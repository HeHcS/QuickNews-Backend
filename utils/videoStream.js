import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to video storage directory
const VIDEOS_DIR = path.join(__dirname, '..', 'uploads', 'videos');

// Ensure the videos directory exists
export const ensureVideosDirExists = () => {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    console.log(`Created videos directory at ${VIDEOS_DIR}`);
  }
};

// Export the videos directory path
export const getVideosDir = () => VIDEOS_DIR;

// Fix video filename issues
function sanitizeVideoFilename(filename) {
  // Remove any spaces and ensure proper extension
  let cleanName = filename.replace(/\s+/g, '');
  
  // If the extension is split (ends with .mp), append 4
  if (cleanName.endsWith('.mp')) {
    cleanName += '4';
  }
  
  // If no extension, add .mp4
  if (!path.extname(cleanName)) {
    cleanName += '.mp4';
  }
  
  return cleanName;
}

export const streamVideo = async (req, res, filename) => {
  try {
    // Clean up the filename
    const cleanFilename = sanitizeVideoFilename(filename);
    
    // Build the full path to the video file
    const videoPath = path.join(VIDEOS_DIR, cleanFilename);
    
    // Check if the file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }
    
    // Get video stats (file size, etc.)
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize) {
        return res.status(416).send({
          message: 'Requested range not satisfiable',
          range,
          fileSize
        });
      }

      // Limit chunk size
      const maxChunk = 1024 * 1024 * 10; // 10MB
      if (end - start > maxChunk) {
        end = start + maxChunk;
      }

      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': getContentType(videoPath)
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': getContentType(videoPath),
        'Accept-Ranges': 'bytes'
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error in streamVideo:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error streaming video', error: error.message });
    }
  }
};

/**
 * Get content type based on file extension
 * @param {string} filename - Video filename
 * @returns {string} - Content type
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.ogg':
      return 'video/ogg';
    case '.mov':
      return 'video/quicktime';
    default:
      return 'video/mp4'; // Default fallback
  }
} 