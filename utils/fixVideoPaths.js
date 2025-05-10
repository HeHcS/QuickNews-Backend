import mongoose from 'mongoose';
import Video from '../models/videoModel.js';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the correct path
dotenv.config({ path: './back-end/.env' });

async function fixVideoPaths() {
  try {
    // Use a default MongoDB URI if not found in environment variables
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quicknews';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos to process`);

    for (const video of videos) {
      // Get just the filename from the full path
      const filename = path.basename(video.videoFile);
      
      // Update the video record with just the filename
      await Video.findByIdAndUpdate(video._id, {
        videoFile: filename
      });
      
      console.log(`Updated video ${video._id}: ${video.videoFile} -> ${filename}`);
    }

    console.log('All video paths have been updated');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing video paths:', error);
    process.exit(1);
  }
}

fixVideoPaths(); 