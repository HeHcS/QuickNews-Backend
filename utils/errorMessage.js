/**
 * Utility for creating standardized error objects
 */

/**
 * Create a formatted error object with status code and message
 * @param {number} statusCode - HTTP status code for the error
 * @param {string} message - Error message
 * @returns {Error} Error object with statusCode and message
 */
export const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Create a formatted validation error object
 * @param {string} message - Validation error message
 * @param {Object} errors - Validation errors object 
 * @returns {Error} Error object with statusCode 400 and validation errors
 */
export const createValidationError = (message, errors) => {
  const error = new Error(message || 'Validation error');
  error.statusCode = 400;
  error.errors = errors;
  return error;
};

/**
 * Create a formatted authentication error object
 * @param {string} message - Authentication error message
 * @returns {Error} Error object with statusCode 401
 */
export const createAuthError = (message) => {
  const error = new Error(message || 'Authentication failed');
  error.statusCode = 401;
  return error;
};

/**
 * Create a formatted forbidden error object
 * @param {string} message - Forbidden error message
 * @returns {Error} Error object with statusCode 403
 */
export const createForbiddenError = (message) => {
  const error = new Error(message || 'Access denied');
  error.statusCode = 403;
  return error;
};

/**
 * Create a formatted not found error object
 * @param {string} message - Not found error message
 * @returns {Error} Error object with statusCode 404
 */
export const createNotFoundError = (message) => {
  const error = new Error(message || 'Resource not found');
  error.statusCode = 404;
  return error;
}; 