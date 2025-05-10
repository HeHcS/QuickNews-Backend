/**
 * Direct MongoDB Test for Video Streaming System
 * 
 * This script tests the video system by directly accessing the MongoDB database
 * without requiring the Express server to be running.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Models
import User from '../models/userModel.js';
import Video from '../models/videoModel.js';
import Category from '../models/categoryModel.js';
import Bookmark from '../models/bookmarkModel.js';

// Load environment variables
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global variables
let mongoServer;
let testUser;
let testVideo;
let testCategory;
let testBookmark;

// Helper for logging
const log = (message) => {
  process.stdout.write(message + '\n');
};

// Create test video file
function createTestVideoFile() {
  const videoDir = path.join(__dirname, '..', 'uploads', 'videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }
  
  const videoPath = path.join(videoDir, 'test-db-video.mp4');
  
  if (!fs.existsSync(videoPath)) {
    log('Creating test video placeholder file...');
    fs.writeFileSync(videoPath, 'This is a test video file for MongoDB direct testing');
  }
  
  return 'test-db-video.mp4';
}

// Test Data Setup
async function setupTestData() {
  log('\n📊 Setting up test data');
  
  try {
    // Create test user
    testUser = await User.create({
      name: 'DB Test User',
      email: 'dbtest@example.com',
      password: 'password123',
      role: 'creator',
      isVerified: true,
      active: true
    });
    log(`✅ Created test user: ${testUser.name} (${testUser._id})`);
    
    // Create test category
    testCategory = await Category.create({
      name: 'DB Test Category',
      description: 'Category for direct MongoDB testing',
      icon: 'test-icon.png',
      color: '#FF5733',
      isActive: true
    });
    log(`✅ Created test category: ${testCategory.name} (${testCategory._id})`);
    
    // Create test video with the created user and category
    const testVideoFileName = createTestVideoFile();
    testVideo = await Video.create({
      title: 'MongoDB Test Video',
      description: 'Video for direct MongoDB testing',
      creator: testUser._id,
      videoFile: testVideoFileName,
      categories: [testCategory._id],
      tags: ['test', 'mongodb', 'direct'],
      isPublished: true
    });
    log(`✅ Created test video: ${testVideo.title} (${testVideo._id})`);
    
    // Create test bookmark
    testBookmark = await Bookmark.create({
      user: testUser._id,
      video: testVideo._id,
      notes: 'Test bookmark for direct MongoDB testing',
      collectionName: 'Test Collection'
    });
    log(`✅ Created test bookmark (${testBookmark._id})`);
    
    return true;
  } catch (error) {
    log(`❌ Error setting up test data: ${error.message}`);
    return false;
  }
}

// Test Video Feed
async function testVideoFeed() {
  log('\n📺 Testing Video Feed Functionality');
  
  try {
    // Test basic video query
    const videos = await Video.find({ isPublished: true })
      .populate('creator', 'name')
      .populate('categories')
      .sort({ createdAt: -1 })
      .limit(10);
    
    log(`Found ${videos.length} videos in feed`);
    
    if (videos.length > 0) {
      log(`First video: ${videos[0].title} by ${videos[0].creator.name}`);
      log(`Categories: ${videos[0].categories.map(c => c.name).join(', ')}`);
    }
    
    return videos.length > 0;
  } catch (error) {
    log(`❌ Error testing video feed: ${error.message}`);
    return false;
  }
}

// Test Category Functionality
async function testCategories() {
  log('\n🏷️ Testing Category Functionality');
  
  try {
    // Get all active categories
    const categories = await Category.find({ isActive: true });
    log(`Found ${categories.length} active categories`);
    
    // Test videos by category
    const categoryVideos = await Video.find({
      categories: testCategory._id,
      isPublished: true
    }).populate('creator', 'name');
    
    log(`Found ${categoryVideos.length} videos in category ${testCategory.name}`);
    
    return categories.length > 0 && categoryVideos.length > 0;
  } catch (error) {
    log(`❌ Error testing categories: ${error.message}`);
    return false;
  }
}

// Test Bookmark Functionality
async function testBookmarks() {
  log('\n🔖 Testing Bookmark Functionality');
  
  try {
    // Get user bookmarks
    const bookmarks = await Bookmark.find({ user: testUser._id })
      .populate({
        path: 'video',
        select: 'title videoFile',
        populate: {
          path: 'creator',
          select: 'name'
        }
      });
    
    log(`Found ${bookmarks.length} bookmarks for user ${testUser.name}`);
    
    if (bookmarks.length > 0) {
      log(`First bookmark: ${bookmarks[0].video.title}`);
      log(`Collection: ${bookmarks[0].collectionName}`);
    }
    
    // Test bookmark collections
    const bookmarkCollections = await Bookmark.aggregate([
      { $match: { user: testUser._id } },
      { $group: { _id: '$collectionName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    log(`Found ${bookmarkCollections.length} bookmark collections`);
    
    return bookmarks.length > 0 && bookmarkCollections.length > 0;
  } catch (error) {
    log(`❌ Error testing bookmarks: ${error.message}`);
    return false;
  }
}

// Clean up test data
async function cleanupTestData() {
  log('\n🧹 Cleaning up test data');
  
  try {
    if (testBookmark) {
      await Bookmark.deleteOne({ _id: testBookmark._id });
      log('✅ Removed test bookmark');
    }
    
    if (testVideo) {
      await Video.deleteOne({ _id: testVideo._id });
      log('✅ Removed test video');
    }
    
    if (testCategory) {
      await Category.deleteOne({ _id: testCategory._id });
      log('✅ Removed test category');
    }
    
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      log('✅ Removed test user');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error cleaning up test data: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  log('🧪 Starting Direct MongoDB Tests for Video System 🧪');
  let connected = false;
  
  try {
    // Connect to MongoDB
    log('\n🔌 Connecting to MongoDB...');
    if (process.env.MONGODB_URI) {
      // Use real MongoDB if URI is provided
      await mongoose.connect(process.env.MONGODB_URI);
      log(`✅ Connected to MongoDB: ${process.env.MONGODB_URI}`);
    } else {
      // Use in-memory MongoDB server
      log('No MongoDB URI provided, using in-memory MongoDB');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      log(`✅ Connected to in-memory MongoDB: ${mongoUri}`);
    }
    connected = true;
    
    // Set up test data
    const setupSuccess = await setupTestData();
    
    if (setupSuccess) {
      // Run tests
      const feedSuccess = await testVideoFeed();
      const categoriesSuccess = await testCategories();
      const bookmarksSuccess = await testBookmarks();
      
      // Print test results
      log('\n📊 Test Results:');
      log(`Video Feed: ${feedSuccess ? '✅ PASS' : '❌ FAIL'}`);
      log(`Categories: ${categoriesSuccess ? '✅ PASS' : '❌ FAIL'}`);
      log(`Bookmarks: ${bookmarksSuccess ? '✅ PASS' : '❌ FAIL'}`);
      
      // Clean up
      await cleanupTestData();
      
      log(`\n🏁 All tests ${feedSuccess && categoriesSuccess && bookmarksSuccess ? 'PASSED ✅' : 'FAILED ❌'}`);
    } else {
      log('\n❌ Failed to set up test data, skipping tests');
    }
  } catch (error) {
    log(`\n❌ Test error: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
  } finally {
    // Disconnect from MongoDB
    if (connected) {
      log('\n🔌 Disconnecting from MongoDB...');
      await mongoose.disconnect();
      log('✅ Disconnected from MongoDB');
    }
    
    // Stop MongoDB memory server if used
    if (mongoServer) {
      log('🔌 Stopping MongoDB memory server...');
      await mongoServer.stop();
      log('✅ MongoDB memory server stopped');
    }
    
    log('\n🏁 Tests completed');
  }
}

// Run the tests
runTests(); 