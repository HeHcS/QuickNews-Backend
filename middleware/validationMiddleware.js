import { body, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

// Validation middleware for register
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('handle')
    .trim()
    .notEmpty()
    .withMessage('Handle is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Handle must be between 3 and 30 characters')
    .matches(/^[a-z0-9_]{3,30}$/)
    .withMessage('Handle can only contain lowercase letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  
  validationCheck
];

// Validation middleware for login
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  
  validationCheck
];

// Validation middleware for forgot password
export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
  
  validationCheck
];

// Validation middleware for reset password
export const validateResetPassword = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  
  validationCheck
];

// Common validation check middleware
function validationCheck(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }
  
  next();
} 