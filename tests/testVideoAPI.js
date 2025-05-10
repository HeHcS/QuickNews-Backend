/**
 * Direct Video API Test Script
 * 
 * This script tests the video API directly using node-fetch.
 * Run with: node tests/testVideoAPI.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = null;
let testVideoId = null;
let testCategoryId = null;

console.log('🧪 Starting Video API Tests 🧪');
console.log('API URL:', BASE_URL);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Configured ✅' : 'Not configured ❌');
console.log('Redis URL:', process.env.REDIS_URL ? 'Configured ✅' : 'Not configured ❌');
console.log('\n---------------------------------------\n');

// Utility to make API requests
async function api(endpoint, options = {}) {
  console.log(`Making API request to: ${endpoint}`);
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    console.log('Request options:', {
      method: options.method || 'GET',
      headers: { ...headers, ...options.headers }
    });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    
    if (response.status === 204) {
      console.log('Response status: 204 No Content');
      return { status: response.status };
    }
    
    const data = await response.json().catch((err) => {
      console.error('Failed to parse JSON response:', err.message);
      return {};
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Array.from(response.headers.entries()));
    
    return {
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    console.error(`API Request Error to ${endpoint}:`, error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    throw error;
  }
}

// Test functions
async function testLogin() {
  console.log('\n🔑 Testing Authentication...');
  
  try {
    const result = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@test.com',
        password: 'password123'
      })
    });
    
    if (result.status === 200 && result.data.token) {
      authToken = result.data.token;
      console.log('✅ Login Successful');
      return true;
    } else {
      console.log('❌ Login Failed:', result.data.message || 'Unknown error');
      console.log('Response data:', JSON.stringify(result.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    return false;
  }
}

async function testVideoFeed() {
  console.log('\n📺 Testing Video Feed...');
  
  try {
    const result = await api('/videos/feed');
    
    if (result.status === 200 && result.data.videos) {
      console.log(`✅ Video Feed Retrieved: ${result.data.videos.length} videos`);
      
      if (result.data.videos.length > 0) {
        testVideoId = result.data.videos[0]._id;
        console.log(`   First Video ID: ${testVideoId}`);
      }
      
      return true;
    } else {
      console.log('❌ Video Feed Failed:', result.data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Video Feed Error:', error.message);
    return false;
  }
}

async function testCategories() {
  console.log('\n🏷️ Testing Categories...');
  
  try {
    const result = await api('/categories');
    
    if (result.status === 200 && Array.isArray(result.data)) {
      console.log(`✅ Categories Retrieved: ${result.data.length} categories`);
      
      if (result.data.length > 0) {
        testCategoryId = result.data[0]._id;
        console.log(`   First Category: ${result.data[0].name} (${testCategoryId})`);
      }
      
      return true;
    } else {
      console.log('❌ Categories Failed:', result.data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Categories Error:', error.message);
    return false;
  }
}

async function testVideoStreaming() {
  if (!testVideoId) {
    console.log('\n🎬 Skipping Video Streaming Test (no video ID found)');
    return false;
  }
  
  console.log('\n🎬 Testing Video Streaming...');
  
  try {
    const result = await api(`/videos/${testVideoId}/stream`, {
      headers: {
        'Range': 'bytes=0-1023'
      }
    });
    
    if ([200, 206].includes(result.status)) {
      console.log('✅ Video Streaming Working');
      console.log(`   Content-Type: ${result.headers.get('content-type')}`);
      console.log(`   Content-Length: ${result.headers.get('content-length')}`);
      
      if (result.status === 206) {
        console.log(`   Content-Range: ${result.headers.get('content-range')}`);
      }
      
      return true;
    } else {
      console.log('❌ Video Streaming Failed:', result.data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Video Streaming Error:', error.message);
    return false;
  }
}

async function testBookmarks() {
  if (!testVideoId || !authToken) {
    console.log('\n🔖 Skipping Bookmarks Test (no video ID or auth token)');
    return false;
  }
  
  console.log('\n🔖 Testing Bookmarks...');
  
  try {
    // Create bookmark
    const createResult = await api(`/videos/${testVideoId}/bookmark`, {
      method: 'POST',
      body: JSON.stringify({
        notes: 'Test bookmark from API test',
        collectionName: 'API Tests'
      })
    });
    
    if (createResult.status === 201) {
      console.log('✅ Bookmark Created');
    } else {
      console.log('❌ Bookmark Creation Failed:', createResult.data.message || 'Unknown error');
      return false;
    }
    
    // Get bookmarks
    const getResult = await api('/videos/user/bookmarks');
    
    if (getResult.status === 200) {
      console.log(`✅ Bookmarks Retrieved: ${getResult.data.bookmarks?.length || 0} bookmarks`);
    } else {
      console.log('❌ Bookmark Retrieval Failed:', getResult.data.message || 'Unknown error');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Bookmarks Error:', error.message);
    return false;
  }
}

async function testVideoDetail() {
  if (!testVideoId) {
    console.log('\n📋 Skipping Video Detail Test (no video ID found)');
    return false;
  }
  
  console.log('\n📋 Testing Video Detail...');
  
  try {
    const result = await api(`/videos/${testVideoId}`);
    
    if (result.status === 200 && result.data.video) {
      console.log('✅ Video Detail Retrieved');
      console.log(`   Title: ${result.data.video.title}`);
      console.log(`   Creator: ${result.data.video.creator.name || result.data.video.creator}`);
      console.log(`   Views: ${result.data.video.views}`);
      return true;
    } else {
      console.log('❌ Video Detail Failed:', result.data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Video Detail Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting Video API Tests 🧪');
  console.log('API URL:', BASE_URL);
  
  try {
    // Test login
    const loginSuccess = await testLogin();
    
    // Test video feed
    const feedSuccess = await testVideoFeed();
    
    // Test categories
    const categoriesSuccess = await testCategories();
    
    // Test video streaming
    const streamSuccess = await testVideoStreaming();
    
    // Test video detail
    const detailSuccess = await testVideoDetail();
    
    // Test bookmarks (requires auth and video ID)
    const bookmarksSuccess = await testBookmarks();
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`Authentication: ${loginSuccess ? '✅' : '❌'}`);
    console.log(`Video Feed: ${feedSuccess ? '✅' : '❌'}`);
    console.log(`Categories: ${categoriesSuccess ? '✅' : '❌'}`);
    console.log(`Video Streaming: ${streamSuccess ? '✅' : '❌'}`);
    console.log(`Video Detail: ${detailSuccess ? '✅' : '❌'}`);
    console.log(`Bookmarks: ${bookmarksSuccess ? '✅' : '❌'}`);
    
    console.log('\n🏁 Video API Tests Completed 🏁');
  } catch (error) {
    console.error('\n💥 Test Suite Error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Execute tests
runTests().catch(error => {
  console.error('Test execution error:', error);
}); 