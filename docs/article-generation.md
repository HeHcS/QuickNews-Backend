# Automatic Article Generation Feature

## Overview

This feature automatically generates news articles when videos are uploaded to the platform. It uses OpenAI's ChatGPT API to create well-structured articles based on the video's title and description.

## How It Works

1. When a user uploads a video through the `/api/videos/upload` endpoint, the system processes the video as usual.
2. After successful video upload, if the OpenAI API key is configured, the system automatically:
   - Calls the OpenAI ChatGPT API with the video's title and description
   - Generates a news article with a title and content
   - Creates a new article in the database linked to the original video
   - Returns both the video and generated article information in the response

## Setup Instructions

1. **Configure OpenAI API Key**:
   - Get an API key from [OpenAI](https://platform.openai.com/)
   - Add the key to your `.env` file:
     ```
     OPENAI_API_KEY=your_openai_api_key
     ```

2. **Install Dependencies**:
   - The feature requires the OpenAI Node.js package
   - Run `npm install` to install all dependencies including the newly added OpenAI package

## API Response

When a video is uploaded and an article is successfully generated, the API response will include both the video and article information:

```json
{
  "status": "success",
  "data": {
    "video": { /* video object */ },
    "generatedArticle": {
      "id": "article-id",
      "title": "Generated Article Title"
    }
  }
}
```

## Error Handling

If article generation fails for any reason (API key not configured, OpenAI API error, etc.), the system will:
1. Log the error to the console
2. Continue with the video upload process
3. Return only the video information in the response

## Customization

The article generation prompt can be customized in the `openaiService.js` file. You can modify the prompt to generate different types of content or adjust the parameters like temperature and max tokens to control the output.