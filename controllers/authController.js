import User from '../models/userModel.js';
import { StatusCodes } from 'http-status-codes';
import { generateToken, generateRefreshToken, verifyRefreshToken, generateResetToken } from '../utils/jwtUtils.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, handle, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      handle,
      email,
      password
    });
    
    if (user) {
      // Generate tokens
      const accessToken = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      res.status(StatusCodes.CREATED).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          handle: user.handle,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken
      });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check for user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (!user.active) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (with refresh token)
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify the refresh token
    const { valid, expired, id } = verifyRefreshToken(refreshToken);
    
    if (!valid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: expired ? 'Refresh token expired' : 'Invalid refresh token'
      });
    }
    
    // Find user
    const user = await User.findById(id);
    
    if (!user || !user.active) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'User not found or account deactivated'
      });
    }
    
    // Generate new access token
    const accessToken = generateToken(user._id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'If a user with that email exists, a password reset link has been sent'
      });
    }
    
    // Generate reset token
    const resetToken = generateResetToken();
    
    // Hash the reset token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expire time (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save();
    
    // In a real application, send an email with the reset link
    // For this example, we'll just return the token in the response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password reset token generated',
      resetToken // In a real app, don't return this, send it via email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public (with reset token)
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;
    
    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Find user with the hashed token and valid expire time
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Set new password
    user.password = password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Generate new tokens
    const accessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password reset successful',
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Logged out successfully'
  });
}; 