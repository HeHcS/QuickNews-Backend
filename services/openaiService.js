import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_MS: 5000, // 5 seconds
  MAX_BACKOFF_MS: 15000, // 15 seconds
  BACKOFF_MULTIPLIER: 2
};

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate backoff time with exponential increase and jitter
 * @param {number} retry - Current retry attempt
 * @returns {number} - Backoff time in milliseconds
 */
const calculateBackoff = (retry) => {
  const backoff = Math.min(
    RETRY_CONFIG.MAX_BACKOFF_MS,
    RETRY_CONFIG.INITIAL_BACKOFF_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retry)
  );
  // Add jitter (±20%)
  return backoff * (0.8 + Math.random() * 0.4);
};

/**
 * Generate article content using OpenAI's ChatGPT
 * @param {string} videoTitle - The title of the video
 * @param {string} videoDescription - The description of the video
 * @returns {Promise<{title: string, content: string}>} - Generated article title and content
 */
/**
 * Generate a basic article from video metadata without using AI
 * @param {string} videoTitle - The title of the video
 * @param {string} videoDescription - The description of the video
 * @returns {Object} - Basic article with title and content
 */
const generateBasicArticle = (videoTitle, videoDescription) => {
  const title = `${videoTitle}: Latest Update`;
  
  // Create a simple formatted article from the description
  const paragraphs = videoDescription.split('\n').filter(p => p.trim().length > 0);
  
  let content = `<h2>Overview</h2>\n<p>${paragraphs[0] || 'This article provides information related to the video.'}</p>\n\n`;
  
  if (paragraphs.length > 1) {
    content += `<h2>Details</h2>\n`;
    for (let i = 1; i < paragraphs.length; i++) {
      content += `<p>${paragraphs[i]}</p>\n`;
    }
  }
  
  content += `\n<h2>Conclusion</h2>\n<p>For more detailed information, please watch the full video.</p>`;
  
  return { title, content };
};

/**
 * Generate article content using OpenAI's ChatGPT with retry logic
 * @param {string} videoTitle - The title of the video
 * @param {string} videoDescription - The description of the video
 * @returns {Promise<{title: string, content: string}>} - Generated article title and content
 */
export const generateArticleFromVideo = async (videoTitle, videoDescription) => {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key is not configured, using basic article generation');
    return generateBasicArticle(videoTitle, videoDescription);
  }

  let retries = 0;
  
  while (retries <= RETRY_CONFIG.MAX_RETRIES) {
    try {
      // Create a prompt for the ChatGPT model
      const prompt = `Generate a news article based on the following video information:\n\nVideo Title: ${videoTitle}\nVideo Description: ${videoDescription}\n\nPlease create a well-structured news article with a catchy title and detailed content that expands on the video's topic. The article should be informative, engaging, and between 400-600 words.`;

      // Call the OpenAI API
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a professional news writer who creates engaging and informative articles." },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      // Extract the generated text
      const generatedText = response.data.choices[0].message.content.trim();

      // Parse the response to extract title and content
      const lines = generatedText.split('\n');
      let title = '';
      let content = '';

      // Extract title (usually the first non-empty line)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim()) {
          title = lines[i].replace(/^#\s*|Title:\s*/i, '').trim();
          content = lines.slice(i + 1).join('\n').trim();
          break;
        }
      }

      return {
        title: title || videoTitle, // Fallback to video title if parsing fails
        content: content || generatedText // Fallback to full text if parsing fails
      };
    } catch (error) {
      // Check if it's a rate limit error (429)
      const isRateLimitError = error.response && error.response.status === 429;
      
      // If we've reached max retries or it's not a rate limit error, throw or use fallback
      if (retries >= RETRY_CONFIG.MAX_RETRIES || !isRateLimitError) {
        console.error('Error generating article with OpenAI:', error);
        console.log('Using fallback article generation method');
        return generateBasicArticle(videoTitle, videoDescription);
      }
      
      // Calculate backoff time and wait
      const backoffTime = calculateBackoff(retries);
      console.log(`Rate limit exceeded. Retrying in ${Math.round(backoffTime / 1000)} seconds... (Attempt ${retries + 1}/${RETRY_CONFIG.MAX_RETRIES})`);
      await sleep(backoffTime);
      
      retries++;
    }
  }
  
  // If we've exhausted all retries, use the fallback
  console.log('All retry attempts failed, using fallback article generation');
  return generateBasicArticle(videoTitle, videoDescription);
};