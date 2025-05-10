# Engagement Features Documentation

This document provides information about the engagement features implementation in QuickNews, covering likes, comments, follows, and real-time updates using Socket.IO.

## Table of Contents

1. [Models](#models)
2. [API Endpoints](#api-endpoints)
3. [Socket.IO Integration](#socketio-integration)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

## Models

### Like Model

Handles likes on various content types:

- User who liked the content
- Reference to the content (polymorphic)
- Content type (Video, Comment, Article)
- Timestamps

### Comment Model

Manages comments with nested replies:

- User who made the comment
- Reference to the content (polymorphic)
- Content type (Video, Article)
- Text content
- Parent comment (for nested replies)
- Likes and replies count
- Flags for edited comments

### Follow Model

Manages user following relationships:

- Follower user
- Following user
- Status (active, blocked)

## API Endpoints

### Like Endpoints

- **Toggle Like** (POST `/api/engagement/likes/toggle`)
  - Requires authentication
  - Body: `{ contentId: "id", contentType: "Video|Comment|Article" }`
  - Response: Like object or success message if unlike

### Comment Endpoints

- **Create Comment** (POST `/api/engagement/comments`)
  - Requires authentication
  - Body: `{ contentId: "id", contentType: "Video|Article", text: "comment text", parentComment?: "parentId" }`
  - Response: Comment object with user populated

- **Update Comment** (PUT `/api/engagement/comments/:commentId`)
  - Requires authentication
  - Body: `{ text: "updated text" }`
  - Response: Updated comment object with user populated

- **Delete Comment** (DELETE `/api/engagement/comments/:commentId`)
  - Requires authentication
  - Response: Success message

- **Get Comments** (GET `/api/engagement/comments?contentId=id&contentType=Video&page=1&limit=10&parentComment=null`)
  - Public endpoint
  - Query parameters:
    - `contentId`: ID of the content
    - `contentType`: Type of content (Video or Article)
    - `page`: Page number for pagination (default: 1)
    - `limit`: Number of comments per page (default: 10)
    - `parentComment`: ID of parent comment for replies (default: null for top-level comments)
  - Response: Comments array with pagination

### Follow Endpoints

- **Toggle Follow** (POST `/api/engagement/follow/:targetUserId`)
  - Requires authentication
  - Response: Follow object or success message if unfollow

- **Get Followers** (GET `/api/engagement/followers/:userId?page=1&limit=20`)
  - Public endpoint
  - Query parameters:
    - `page`: Page number for pagination (default: 1)
    - `limit`: Number of followers per page (default: 20)
  - Response: Followers array with pagination

- **Get Following** (GET `/api/engagement/following/:userId?page=1&limit=20`)
  - Public endpoint
  - Query parameters:
    - `page`: Page number for pagination (default: 1)
    - `limit`: Number of users being followed per page (default: 20)
  - Response: Following users array with pagination

## Socket.IO Integration

### Connecting to Socket.IO

Connect to the Socket.IO server with authentication:

```javascript
const socket = io('http://localhost:9000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error.message);
});
```

### Like Events

Subscribe to like events for a specific content:

```javascript
socket.on(`like:${contentId}`, (data) => {
  // data contains { type: 'like' | 'unlike', userId, contentId }
  console.log(`User ${data.userId} ${data.type === 'like' ? 'liked' : 'unliked'} content ${data.contentId}`);
});
```

### Comment Events

Subscribe to comment events for a specific content:

```javascript
socket.on(`comment:${contentId}`, (data) => {
  // data.type is one of 'new', 'update', 'delete'
  switch (data.type) {
    case 'new':
      console.log('New comment:', data.comment);
      break;
    case 'update':
      console.log('Updated comment:', data.comment);
      break;
    case 'delete':
      console.log('Deleted comment ID:', data.commentId);
      break;
  }
});
```

### Follow Events

Subscribe to follow events for a specific user:

```javascript
socket.on(`follow:${userId}`, (data) => {
  // data contains { type: 'follow' | 'unfollow', userId, targetUserId }
  console.log(`User ${data.userId} ${data.type === 'follow' ? 'followed' : 'unfollowed'} user ${data.targetUserId}`);
});
```

## Testing

### Running Tests

Several test scripts are available to validate the engagement functionality:

- **Basic Functionality Tests**: `npm run test:engagement`
  - Tests basic CRUD operations for likes, comments, and follows
  - Validates error handling and authorization

- **Socket.IO Tests**: `npm run test:socket`
  - Tests real-time event emission and reception
  - Requires the server to be running

- **Concurrency Tests**: `npm run test:concurrency`
  - Tests for race conditions with multiple users engaging simultaneously
  - Validates data integrity under concurrent loads

### Manual Testing Steps

1. Start the server: `npm run dev`
2. Run engagement tests: `npm run test:engagement`
3. In a separate terminal, run socket tests: `npm run test:socket`
4. Test concurrency: `npm run test:concurrency`

## Troubleshooting

### Common Issues

- **Socket.IO Authentication Errors**
  - Ensure your JWT token is valid and not expired
  - Check that the socket authentication middleware is enabled

- **Like Toggle Not Working**
  - Verify that the content exists and is accessible
  - Check that the user has permission to like the content

- **Comment Creation Fails**
  - Ensure the text field is not empty and within the character limit
  - Verify that the content exists and supports comments

- **Follow Functionality Issues**
  - Users cannot follow themselves (built-in protection)
  - Check for proper database indexes for efficient querying

### Debug Mode

To enable more detailed logging for Socket.IO:

```javascript
// Client-side
const socket = io('http://localhost:9000', {
  auth: { token },
  debug: true
});

// Server-side
// Add these environment variables
// DEBUG=socket.io:* npm run dev
``` 