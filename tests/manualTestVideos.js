/**
 * Manual Test Script for Video Streaming and Bookmark System
 * 
 * Run this script to set up some test data and perform manual testing.
 * It will create:
 * - Test users (admin, creator, regular user)
 * - Categories
 * - Sample videos
 * - Sample bookmarks
 * 
 * Usage: node tests/manualTestVideos.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/userModel.js';
import Video from '../models/videoModel.js';
import Category from '../models/categoryModel.js';
import Bookmark from '../models/bookmarkModel.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Check if MongoDB URI is available
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

// Function to generate test video files
function createTestVideoFiles() {
  const videoDir = path.join(__dirname, '..', 'uploads', 'videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  // Create 3 different test video files
  const testVideos = [
    { name: 'test-video-1.mp4', content: 'This is test video 1' },
    { name: 'test-video-2.mp4', content: 'This is test video 2' },
    { name: 'test-video-3.mp4', content: 'This is test video 3' }
  ];

  testVideos.forEach(video => {
    const videoPath = path.join(videoDir, video.name);
    if (!fs.existsSync(videoPath)) {
      console.log(`Creating test video file: ${video.name}`);
      fs.writeFileSync(videoPath, video.content);
    }
  });

  return testVideos.map(v => v.name);
}

// Main function to set up test data
async function setupTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB!');

    // Create test users
    console.log('Creating test users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@test.com' },
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        active: true
      },
      { upsert: true, new: true }
    );

    const creatorUser = await User.findOneAndUpdate(
      { email: 'creator@test.com' },
      {
        name: 'Creator User',
        email: 'creator@test.com',
        password: hashedPassword,
        role: 'creator',
        isVerified: true,
        active: true
      },
      { upsert: true, new: true }
    );

    const regularUser = await User.findOneAndUpdate(
      { email: 'user@test.com' },
      {
        name: 'Regular User',
        email: 'user@test.com',
        password: hashedPassword,
        role: 'user',
        isVerified: true,
        active: true
      },
      { upsert: true, new: true }
    );

    console.log('Users created/updated!');

    // Create test categories
    console.log('Creating test categories...');
    const categories = [
      {
        name: 'Technology',
        description: 'Tech videos and tutorials',
        icon: 'tech-icon.png',
        color: '#3498db',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Entertainment',
        description: 'Fun and entertaining videos',
        icon: 'entertainment-icon.png',
        color: '#e74c3c',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Education',
        description: 'Educational content',
        icon: 'education-icon.png',
        color: '#2ecc71',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Hidden Category',
        description: 'This category is not active',
        icon: 'hidden-icon.png',
        color: '#7f8c8d',
        isActive: false,
        sortOrder: 4
      }
    ];

    const createdCategories = [];
    for (const category of categories) {
      const createdCategory = await Category.findOneAndUpdate(
        { name: category.name },
        category,
        { upsert: true, new: true }
      );
      createdCategories.push(createdCategory);
    }

    console.log('Categories created/updated!');

    // Create test video files
    console.log('Creating test video files...');
    const videoFiles = createTestVideoFiles();

    // Create test videos
    console.log('Creating test videos...');
    const videos = [
      {
        title: 'Getting Started with Node.js',
        description: 'Learn the basics of Node.js in this beginner tutorial',
        creator: creatorUser._id,
        videoFile: videoFiles[0],
        categories: [createdCategories[0]._id, createdCategories[2]._id], // Tech & Education
        tags: ['nodejs', 'javascript', 'tutorial'],
        isPublished: true
      },
      {
        title: 'Funny Cat Compilation',
        description: 'The funniest cat videos of 2023',
        creator: creatorUser._id,
        videoFile: videoFiles[1],
        categories: [createdCategories[1]._id], // Entertainment
        tags: ['cats', 'funny', 'animals'],
        isPublished: true
      },
      {
        title: 'Advanced MongoDB Techniques',
        description: 'Explore advanced MongoDB features for your applications',
        creator: adminUser._id,
        videoFile: videoFiles[2],
        categories: [createdCategories[0]._id, createdCategories[2]._id], // Tech & Education
        tags: ['mongodb', 'database', 'advanced'],
        isPublished: true
      },
      {
        title: 'Unpublished Video',
        description: 'This video is not yet published',
        creator: creatorUser._id,
        videoFile: videoFiles[0],
        categories: [createdCategories[1]._id],
        tags: ['draft', 'unpublished'],
        isPublished: false
      }
    ];

    const createdVideos = [];
    for (const video of videos) {
      const existingVideo = await Video.findOne({ 
        title: video.title,
        creator: video.creator
      });

      if (existingVideo) {
        console.log(`Video already exists: ${video.title}`);
        createdVideos.push(existingVideo);
      } else {
        const createdVideo = await Video.create(video);
        console.log(`Video created: ${createdVideo.title}`);
        createdVideos.push(createdVideo);
      }
    }

    // Create bookmarks
    console.log('Creating test bookmarks...');
    const bookmarks = [
      {
        user: regularUser._id,
        video: createdVideos[0]._id,
        notes: 'Great Node.js tutorial for beginners',
        collectionName: 'Learning'
      },
      {
        user: regularUser._id,
        video: createdVideos[1]._id,
        notes: 'Hilarious cat videos',
        collectionName: 'Entertainment'
      },
      {
        user: adminUser._id,
        video: createdVideos[2]._id,
        notes: 'Reference for advanced MongoDB features',
        collectionName: 'Database'
      }
    ];

    for (const bookmark of bookmarks) {
      const existingBookmark = await Bookmark.findOne({
        user: bookmark.user,
        video: bookmark.video
      });

      if (existingBookmark) {
        console.log(`Bookmark already exists for ${bookmark.collectionName}`);
      } else {
        const createdBookmark = await Bookmark.create(bookmark);
        console.log(`Bookmark created: ${createdBookmark.collectionName}`);
      }
    }

    console.log('\n✅ Test data setup complete!');
    console.log('\n📋 Test accounts:');
    console.log('- Admin: admin@test.com / password123');
    console.log('- Creator: creator@test.com / password123');
    console.log('- User: user@test.com / password123');
    
    console.log('\n📋 Test videos:');
    createdVideos.forEach(video => {
      console.log(`- ${video.title} (${video.isPublished ? 'Published' : 'Unpublished'})`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}

// Run the setup
setupTestData(); 