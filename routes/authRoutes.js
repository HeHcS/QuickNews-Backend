import express from 'express';
import { 
  registerUser, 
  loginUser, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  getCurrentUser, 
  logoutUser 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import passport from 'passport';
import { generateToken, generateRefreshToken } from '../utils/jwtUtils.js';
import { 
  validateRegister, 
  validateLogin, 
  validateForgotPassword, 
  validateResetPassword 
} from '../middleware/validationMiddleware.js';
import User from '../models/userModel.js';

const router = express.Router();

// Registration and login routes
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/refresh-token', refreshToken);

// Password reset routes
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password/:resetToken', validateResetPassword, resetPassword);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logoutUser);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate tokens
    const accessToken = generateToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);
    
    // In a real application, redirect to frontend with tokens
    // For this example, just return the tokens
    res.json({
      success: true,
      accessToken,
      refreshToken
    });
  }
);

// Note: Apple OAuth would follow a similar pattern as Google OAuth

// Add this route somewhere in the file
router.get('/test-users', async (req, res, next) => {
  try {
    // In a production app, this would be protected. 
    // For testing purposes only.
    const users = await User.find({ email: /^test.*@example\.com$/ })
      .select('_id name email');
    
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

export default router; 