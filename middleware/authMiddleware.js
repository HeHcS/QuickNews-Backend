import passport from 'passport';
import { StatusCodes } from 'http-status-codes';

// Middleware to protect routes with JWT
export const protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        success: false,
        message: 'Not authorized, no token or invalid token'
      });
    }
    
    // Check if user is active
    if (!user.active) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'User account is deactivated'
      });
    }
    
    // Set user in request
    req.user = user;
    next();
  })(req, res, next);
};

// Middleware to restrict to certain roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Not authorized, no user found'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Alias for authorize with a different name for compatibility
export const restrictTo = (...roles) => {
  return authorize(...roles);
};

// Admin middleware - restricts access to admin users only
export const admin = (req, res, next) => {
  return authorize('admin')(req, res, next);
};

// Creator middleware - restricts access to creators and admins
export const creator = (req, res, next) => {
  return authorize('creator', 'admin')(req, res, next);
}; 