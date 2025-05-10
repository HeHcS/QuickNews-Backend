import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_for_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_jwt_refresh_secret_for_dev';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Generate JWT access token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Generate JWT refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  });
};

// Verify JWT refresh token
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return { valid: true, expired: false, id: decoded.id };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      id: null
    };
  }
};

// Generate reset password token (not JWT, just a random string)
export const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  return resetToken;
}; 