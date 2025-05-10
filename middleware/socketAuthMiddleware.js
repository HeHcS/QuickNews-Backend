import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user to socket
    socket.user = user;
    
    // Join user's own room for targeted events
    socket.join(`user:${user._id}`);
    
    next();
  } catch (error) {
    return next(new Error(`Authentication error: ${error.message}`));
  }
};

export default socketAuthMiddleware; 