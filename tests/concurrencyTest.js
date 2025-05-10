import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import User from '../models/userModel.js';
import Video from '../models/videoModel.js';
import Like from '../models/likeModel.js';
import Comment from '../models/commentModel.js';

// Load environment variables
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:9000/api';
let testUsers = [];
let tokens = [];
let testVideo;

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Create test users
const setupTestUsers = async () => {
  // Clear existing test users
  await User.deleteMany({ email: /^concurrent.*@example\.com$/ });

  // Create 5 test users for concurrency testing
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const user = await User.create({
      name: `Concurrent User ${i}`,
      email: `concurrent${i}@example.com`,
      password: 'Password123',
      isVerified: true,
      active: true
    });
    users.push(user);
  }

  console.log(`Created ${users.length} test users for concurrency testing`);
  return users;
};

// Create test video
const setupTestVideo = async (userId) => {
  // Clear existing test videos
  await Video.deleteMany({ title: 'Concurrency Test Video' });

  // Create a test video
  const video = await Video.create({
    creator: userId,
    title: 'Concurrency Test Video',
    description: 'Video for testing concurrent engagement',
    videoFile: 'concurrency-test.mp4',
    thumbnail: 'concurrency-test.jpg',
    duration: 60,
    isPublished: true
  });

  console.log(`Created test video: ${video._id}`);
  return video;
};

// Login users and get tokens
const loginUsers = async (users) => {
  const tokens = [];

  for (const user of users) {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: user.email, 
          password: 'Password123' 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Failed to login user ${user.email}: ${data.message}`);
      }

      tokens.push(data.accessToken);
      console.log(`Logged in user: ${user.email}`);
    } catch (error) {
      console.error(`Login error for ${user.email}:`, error.message);
    }
  }

  return tokens;
};

// Test concurrent likes
const testConcurrentLikes = async () => {
  console.log('\n=== Testing Concurrent Likes ===');

  // First, clear any existing likes
  await Like.deleteMany({ 
    content: testVideo._id, 
    user: { $in: testUsers.map(u => u._id) } 
  });

  const likePromises = tokens.map((token, index) => {
    return fetch(`${BASE_URL}/engagement/likes/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        contentId: testVideo._id,
        contentType: 'Video'
      })
    }).then(response => {
      if (!response.ok) {
        throw new Error(`User ${index + 1} like failed: ${response.status}`);
      }
      return response.json();
    }).then(data => {
      console.log(`✅ User ${index + 1} like successful`);
      return data;
    }).catch(error => {
      console.error(`❌ User ${index + 1} like error:`, error.message);
      return null;
    });
  });

  try {
    await Promise.all(likePromises);
    
    // Check if all likes were recorded properly
    const likeCount = await Like.countDocuments({ 
      content: testVideo._id,
      contentType: 'Video' 
    });
    
    console.log(`Total likes recorded: ${likeCount} out of ${tokens.length} attempts`);
    console.log(`Concurrency test result: ${likeCount === tokens.length ? '✅ PASSED' : '❌ FAILED'}`);
  } catch (error) {
    console.error('❌ Concurrent likes test error:', error.message);
  }
};

// Test concurrent comments
const testConcurrentComments = async () => {
  console.log('\n=== Testing Concurrent Comments ===');

  // First, clear any existing comments
  await Comment.deleteMany({ 
    content: testVideo._id, 
    user: { $in: testUsers.map(u => u._id) } 
  });

  const commentPromises = tokens.map((token, index) => {
    return fetch(`${BASE_URL}/engagement/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        contentId: testVideo._id,
        contentType: 'Video',
        text: `Concurrent comment test from User ${index + 1}`
      })
    }).then(response => {
      if (!response.ok) {
        throw new Error(`User ${index + 1} comment failed: ${response.status}`);
      }
      return response.json();
    }).then(data => {
      console.log(`✅ User ${index + 1} comment successful`);
      return data;
    }).catch(error => {
      console.error(`❌ User ${index + 1} comment error:`, error.message);
      return null;
    });
  });

  try {
    await Promise.all(commentPromises);
    
    // Check if all comments were recorded properly
    const commentCount = await Comment.countDocuments({ 
      content: testVideo._id,
      contentType: 'Video' 
    });
    
    console.log(`Total comments recorded: ${commentCount} out of ${tokens.length} attempts`);
    console.log(`Concurrency test result: ${commentCount === tokens.length ? '✅ PASSED' : '❌ FAILED'}`);
  } catch (error) {
    console.error('❌ Concurrent comments test error:', error.message);
  }
};

// Test rapid toggling of likes (stress test)
const testRapidLikeToggles = async () => {
  console.log('\n=== Testing Rapid Like Toggles ===');

  // Clear existing likes first
  await Like.deleteMany({ 
    content: testVideo._id, 
    user: testUsers[0]._id 
  });

  const toggleCount = 10;
  const token = tokens[0];

  try {
    for (let i = 0; i < toggleCount; i++) {
      const response = await fetch(`${BASE_URL}/engagement/likes/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contentId: testVideo._id,
          contentType: 'Video'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Toggle ${i + 1} failed: ${data.message}`);
      }

      console.log(`✅ Toggle ${i + 1} successful: ${data.message || JSON.stringify(data)}`);

      // Don't wait too long between toggles to simulate rapid clicking
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // If toggleCount is even, we should end up with no like
    // If toggleCount is odd, we should end up with a like
    const expectLike = toggleCount % 2 === 1;
    const likeExists = await Like.exists({ 
      content: testVideo._id, 
      user: testUsers[0]._id,
      contentType: 'Video'
    });

    console.log(`After ${toggleCount} toggles, like exists: ${likeExists !== null}`);
    console.log(`Expected like to exist: ${expectLike}`);
    console.log(`Rapid toggle test result: ${(likeExists !== null) === expectLike ? '✅ PASSED' : '❌ FAILED'}`);
  } catch (error) {
    console.error('❌ Rapid toggle test error:', error.message);
  }
};

// Cleanup test data
const cleanup = async () => {
  console.log('\n=== Cleaning Up Test Data ===');
  
  try {
    // Delete test likes
    const deletedLikes = await Like.deleteMany({ 
      user: { $in: testUsers.map(user => user._id) } 
    });
    console.log(`✅ Deleted ${deletedLikes.deletedCount} test likes`);

    // Delete test comments
    const deletedComments = await Comment.deleteMany({
      user: { $in: testUsers.map(user => user._id) }
    });
    console.log(`✅ Deleted ${deletedComments.deletedCount} test comments`);

    // Delete test video
    if (testVideo) {
      await Video.findByIdAndDelete(testVideo._id);
      console.log('✅ Deleted test video');
    }

    // Delete test users
    const deletedUsers = await User.deleteMany({
      _id: { $in: testUsers.map(user => user._id) }
    });
    console.log(`✅ Deleted ${deletedUsers.deletedCount} test users`);

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
};

// Run all tests
const runTests = async () => {
  try {
    await connectDB();
    
    // Setup test data
    testUsers = await setupTestUsers();
    testVideo = await setupTestVideo(testUsers[0]._id);
    tokens = await loginUsers(testUsers);
    
    if (tokens.length !== testUsers.length) {
      console.error(`❌ Failed to login all test users. Got ${tokens.length} tokens for ${testUsers.length} users.`);
      process.exit(1);
    }
    
    // Run concurrency tests
    await testConcurrentLikes();
    await testConcurrentComments();
    await testRapidLikeToggles();
    
    // Cleanup
    await cleanup();
    
    console.log('\n✅ All concurrency tests completed!');
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB Disconnected');
    }
    process.exit(0);
  }
};

runTests(); 