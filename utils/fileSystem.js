import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures that the profiles directory exists for storing profile pictures
 */
export const ensureProfilesDirExists = () => {
  const profilesDir = path.join(__dirname, '..', 'uploads', 'profiles');
  const defaultProfilePath = path.join(profilesDir, 'default-profile.png');

  // Create profiles directory if it doesn't exist
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
    console.log('Created profiles directory');
  }

  // Copy default profile image if it doesn't exist
  if (!fs.existsSync(defaultProfilePath)) {
    const defaultImageSource = path.join(__dirname, '..', 'assets', 'default-profile.png');
    if (fs.existsSync(defaultImageSource)) {
      fs.copyFileSync(defaultImageSource, defaultProfilePath);
      console.log('Copied default profile image');
    } else {
      console.warn('Default profile image source not found');
    }
  }
  
  return profilesDir;
};

// Ensure featured images directory exists
export const ensureFeaturedImagesDirExists = () => {
  const featuredImagesDir = path.join(__dirname, '../uploads/featured-images');
  if (!fs.existsSync(featuredImagesDir)) {
    fs.mkdirSync(featuredImagesDir, { recursive: true });
  }
  return featuredImagesDir;
};

export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};