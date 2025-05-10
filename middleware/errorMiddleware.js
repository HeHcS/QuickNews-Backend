import { StatusCodes } from 'http-status-codes';

/**
 * Custom error response handler
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Use the statusCode from the error if present, otherwise use the response status code,
  // and if that's 200 (default success), use 500 (server error)
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    ...(err.errors && { errors: err.errors }) // Include validation errors if present
  });
}; 