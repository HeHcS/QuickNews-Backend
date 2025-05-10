# Article Management API

This document outlines the API endpoints for article management in the QuickNews application.

## Features

- Create articles with rich text content
- Upload featured images for articles
- Update article content and metadata
- Categorize articles with tags and categories
- Publish/unpublish articles with status management
- Link articles to related videos

## API Endpoints

### Get All Articles

```
GET /api/articles
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of articles per page (default: 10, max: 50)
- `category` (optional): Filter by category
- `tag` (optional): Filter by tag

**Response:**
```json
{
  "status": "success",
  "data": {
    "articles": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### Get Article by ID

```
GET /api/articles/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "article": {...}
  }
}
```

### Get Articles by Author

```
GET /api/articles/author/:authorId
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of articles per page (default: 10, max: 50)

**Response:**
```json
{
  "status": "success",
  "data": {
    "articles": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### Get Article Categories

```
GET /api/articles/categories
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "categories": [
      { "name": "Technology", "count": 25 },
      { "name": "Sports", "count": 15 }
    ]
  }
}
```

### Upload Article

```
POST /api/articles/upload
```

**Authentication Required**

**Request Body (multipart/form-data):**
- `title` (required): Article title
- `content` (required): Article content (HTML supported)
- `summary` (optional): Brief summary of the article
- `tags` (optional): JSON array of tags
- `categories` (optional): JSON array of categories
- `status` (optional): Article status (draft, published, archived)
- `relatedVideo` (optional): ID of related video
- `featuredImage` (optional): Image file to upload as featured image

**Response:**
```json
{
  "status": "success",
  "data": {
    "article": {...}
  }
}
```

### Update Article

```
PATCH /api/articles/:id
```

**Authentication Required**

**Request Body (multipart/form-data):**
- `title` (optional): Updated article title
- `content` (optional): Updated article content
- `summary` (optional): Updated summary
- `tags` (optional): Updated JSON array of tags
- `categories` (optional): Updated JSON array of categories
- `status` (optional): Updated article status
- `relatedVideo` (optional): Updated ID of related video
- `featuredImage` (optional): New image file to replace existing featured image

**Response:**
```json
{
  "status": "success",
  "data": {
    "article": {...}
  }
}
```

### Delete Article

```
DELETE /api/articles/:id
```

**Authentication Required**

**Response:**
```json
{
  "status": "success",
  "data": null
}
```

## Article Model

The article model includes the following fields:

- `title`: Article title (required)
- `content`: Article content (required)
- `author`: Reference to User model (required)
- `summary`: Brief summary of the article
- `featuredImage`: Path to the uploaded featured image
- `tags`: Array of string tags
- `categories`: Array of string categories
- `relatedVideo`: Reference to Video model
- `isPublished`: Boolean indicating if article is published
- `viewCount`: Number of article views
- `status`: Article status (draft, published, archived)
- `createdAt`: Timestamp when article was created
- `updatedAt`: Timestamp when article was last updated

## Testing

A test script is available at `tests/testArticleAPI.js` to verify the article API functionality.

To run the test:

```bash
node tests/testArticleAPI.js
```

The test script performs the following operations:
1. Login to get authentication token
2. Create a test article with featured image
3. Retrieve all articles
4. Retrieve the specific article by ID
5. Update the article
6. Delete the article