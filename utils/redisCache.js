import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Redis client configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600', 10); // Default: 1 hour

let redisClient = null;

/**
 * Initialize the Redis client
 */
export const initRedis = async () => {
  if (!CACHE_ENABLED) {
    console.log('Redis cache is disabled');
    return;
  }

  try {
    redisClient = createClient({ url: REDIS_URL });
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });
    
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection error:', error);
    // Continue without Redis if connection fails
    redisClient = null;
  }
};

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached data or null if not found
 */
export const getCache = async (key) => {
  if (!redisClient || !CACHE_ENABLED) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (default: CACHE_TTL)
 * @returns {Promise<boolean>} - Success status
 */
export const setCache = async (key, data, ttl = CACHE_TTL) => {
  if (!redisClient || !CACHE_ENABLED) return false;
  
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
};

/**
 * Delete a key from cache
 * @param {string} key - Cache key to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteCache = async (key) => {
  if (!redisClient || !CACHE_ENABLED) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'categories:*')
 * @returns {Promise<boolean>} - Success status
 */
export const clearCacheByPattern = async (pattern) => {
  if (!redisClient || !CACHE_ENABLED) return false;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cleared ${keys.length} keys matching pattern: ${pattern}`);
    }
    return true;
  } catch (error) {
    console.error('Redis clear cache error:', error);
    return false;
  }
};

/**
 * Check if Redis is connected
 * @returns {boolean} - Connection status
 */
export const isRedisConnected = () => {
  return !!(redisClient && redisClient.isOpen);
};

// Graceful shutdown helper
export const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
}; 