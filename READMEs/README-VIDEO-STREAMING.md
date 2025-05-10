# Video Streaming System

This document provides an overview of the video streaming system implementation.

## Features

The video streaming system includes:

- Video upload and storage
- Range-based video streaming
- Category management
- Bookmarking system
- User-specific video feeds
- Video metadata management

## Architecture

### Data Models

1. **Video Model**
   - Stores video metadata and file path
   - Tracks views and engagement metrics
   - Manages publishing status
   - Handles category assignments

2. **Category Model**
   - Organizes videos into browsable categories
   - Supports active/inactive status
   - Includes visual elements (icon, color)
   - Maintains sort order

3. **Bookmark Model**
   - Links users to videos they've bookmarked
   - Supports user-defined notes for bookmarks
   - Allows organization into collections

### API Endpoints

#### Video Management

```
GET  /api/videos/feed          - Get personalized video feed
GET  /api/videos/:id           - Get single video details
GET  /api/videos/:id/stream    - Stream video content 
POST /api/videos               - Upload new video (for creators)
PUT  /api/videos/:id           - Update video (for creators/admins)
DEL  /api/videos/:id           - Delete video (for creators/admins)
```

#### Categories

```
GET  /api/categories           - List all active categories
GET  /api/videos/category/:id  - Get videos in a category
POST /api/categories           - Create category (admin only)
PUT  /api/categories/:id       - Update category (admin only)
DEL  /api/categories/:id       - Delete category (admin only)
```

#### Bookmarks

```
GET  /api/videos/user/bookmarks       - Get user's bookmarks
POST /api/videos/:id/bookmark         - Create a bookmark
PUT  /api/videos/:id/bookmark         - Update bookmark
DEL  /api/videos/:id/bookmark         - Delete bookmark
```

## Implementation Details

### Video Streaming

The system implements HTTP range requests (RFC 7233) to support seeking and efficient streaming:

1. Videos are stored on disk or in cloud storage
2. The stream endpoint reads the file using Node.js streams
3. Range headers are parsed and honored
4. Partial content (206) responses are sent for range requests
5. Content-Type and other relevant headers are set correctly

### Bookmark System

The bookmarking system allows users to:

1. Save videos for later viewing
2. Add personal notes to bookmarks
3. Organize bookmarks into collections
4. Quickly access their bookmarked content

### Video Feed

The video feed algorithm:

1. Combines recent videos
2. Prioritizes content from followed creators
3. Includes videos from user's preferred categories
4. Can be filtered and sorted
5. Returns paginated results

## Security Considerations

1. Authentication is required for bookmarks
2. Role-based access controls for content creation and management
3. File validation for video uploads
4. Rate limiting on stream endpoints
5. Authorization checks for user-specific resources

## Performance Optimization

1. Streaming uses efficient Node.js streams
2. Range requests allow for seeking without downloading entire video
3. Caching headers are implemented
4. Database indexes optimize common queries
5. Pagination prevents excessive data retrieval 

## Usage Examples

### Streaming a Video

Client:
```javascript
const videoPlayer = document.querySelector('video');
videoPlayer.src = `http://localhost:5000/api/videos/${videoId}/stream`;
```

### Creating a Bookmark

```javascript
async function bookmarkVideo(videoId, notes, collection) {
  const response = await fetch(`/api/videos/${videoId}/bookmark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      notes,
      collectionName: collection
    })
  });
  
  return await response.json();
}
```

## Testing

See [TESTING-VIDEO-SYSTEM.md](TESTING-VIDEO-SYSTEM.md) for detailed testing procedures.

## Future Enhancements

1. Video transcoding for multiple quality levels
2. Adaptive bitrate streaming
3. Client-side player enhancements
4. Analytics and recommendation engine
5. Live streaming capabilities
6. Comments and social features 