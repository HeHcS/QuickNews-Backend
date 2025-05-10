/**
 * Wraps async Express route handlers to catch and forward errors to Express error handler
 * @param {Function} fn - Express route handler function
 * @returns {Function} - Wrapped function that catches errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler; 