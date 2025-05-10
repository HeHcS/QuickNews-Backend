// Socket.IO event names
export const SOCKET_EVENTS = {
  LIKE: {
    NEW: 'like:new',
    REMOVE: 'like:remove'
  },
  COMMENT: {
    NEW: 'comment:new',
    UPDATE: 'comment:update',
    DELETE: 'comment:delete'
  },
  FOLLOW: {
    NEW: 'follow:new',
    REMOVE: 'follow:remove'
  }
};

// Join a room for real-time updates
export const joinRoom = (socket, roomId) => {
  socket.join(roomId);
};

// Leave a room
export const leaveRoom = (socket, roomId) => {
  socket.leave(roomId);
};

// Emit event to a specific room
export const emitToRoom = (io, roomId, eventName, data) => {
  io.to(roomId).emit(eventName, data);
};

// Emit event to a specific user
export const emitToUser = (io, userId, eventName, data) => {
  io.to(`user:${userId}`).emit(eventName, data);
};

// Create room ID for content
export const getContentRoomId = (contentType, contentId) => {
  return `${contentType}:${contentId}`;
};

// Create room ID for user
export const getUserRoomId = (userId) => {
  return `user:${userId}`;
}; 