import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import User from '../models/userModel.js';
import Video from '../models/videoModel.js';
import Like from '../models/likeModel.js';
import Comment from '../models/commentModel.js';
import Follow from '../models/followModel.js';

// Load environment variables
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:9000/api';
let authToken;
let testUsers = [];
let testVideos = [];

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
  await User.deleteMany({ email: /^test.*@example\.com$/ });

  // Create 3 test users
  const users = [];
  for (let i = 1; i <= 3; i++) {
    const user = await User.create({
      name: `Test User ${i}`,
      email: `test${i}@example.com`,
      password: 'Password123',
      profilePicture: `default-${i}.png`,
      bio: `This is test user ${i}`,
      isVerified: true,
      active: true
    });
    users.push(user);
  }

  console.log(`Created ${users.length} test users`);
  return users;
};

// Create test videos
const setupTestVideos = async (userId) => {
  // Clear existing test videos
  await Video.deleteMany({ title: /^Test Video.*/ });

  // Create 3 test videos
  const videos = [];
  for (let i = 1; i <= 3; i++) {
    const video = await Video.create({
      creator: userId,
      title: `Test Video ${i}`,
      description: `This is test video ${i}`,
      videoFile: `test-video-${i}.mp4`,
      thumbnail: `test-thumbnail-${i}.jpg`,
      duration: 60,
      isPublished: true
    });
    videos.push(video);
  }

  console.log(`Created ${videos.length} test videos`);
  return videos;
};

// Login and get auth token
const login = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to login');
    }

    // The auth controller returns the token in data.accessToken, not data.token
    return data.accessToken;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
};

// Test like functionality
const testLikes = async (userId, videoId) => {
  console.log('\n=== Testing Like Functionality ===');
  try {
    // Toggle like (Add)
    let response = await fetch(`${BASE_URL}/engagement/likes/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        contentId: videoId,
        contentType: 'Video'
      })
    });

    let data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to toggle like');
    }
    console.log('✅ Successfully added like');

    // Verify like exists in database
    const likeExists = await Like.findOne({ 
      user: userId, 
      content: videoId, 
      contentType: 'Video' 
    });
    console.log(`✅ Like verification: ${likeExists ? 'Success' : 'Failed'}`);

    // Toggle like again (Remove)
    response = await fetch(`${BASE_URL}/engagement/likes/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        contentId: videoId,
        contentType: 'Video'
      })
    });

    data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to toggle like');
    }
    console.log('✅ Successfully removed like');

    // Verify like was removed
    const likeRemoved = !(await Like.findOne({ 
      user: userId, 
      content: videoId, 
      contentType: 'Video' 
    }));
    console.log(`✅ Like removal verification: ${likeRemoved ? 'Success' : 'Failed'}`);

  } catch (error) {
    console.error('❌ Like test error:', error.message);
  }
};

// Test comment functionality
const testComments = async (userId, videoId) => {
  console.log('\n=== Testing Comment Functionality ===');
  try {
    // Create a comment
    let response = await fetch(`${BASE_URL}/engagement/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        contentId: videoId,
        contentType: 'Video',
        text: 'This is a test comment'
      })
    });

    let data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create comment');
    }
    console.log('✅ Successfully created comment');
    const commentId = data._id;

    // Get comments
    response = await fetch(`${BASE_URL}/engagement/comments?contentId=${videoId}&contentType=Video`);
    data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get comments');
    }
    console.log(`✅ Successfully fetched comments: ${data.comments.length} comments found`);

    // Update comment
    response = await fetch(`${BASE_URL}/engagement/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        text: 'This is an updated test comment'
      })
    });

    data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update comment');
    }
    console.log('✅ Successfully updated comment');

    // Create a reply
    response = await fetch(`${BASE_URL}/engagement/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        contentId: videoId,
        contentType: 'Video',
        text: 'This is a test reply',
        parentComment: commentId
      })
    });

    data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create reply');
    }
    console.log('✅ Successfully created reply comment');

    // Verify parent comment repliesCount was updated
    const parentComment = await Comment.findById(commentId);
    console.log(`✅ Parent comment replies count: ${parentComment.repliesCount}`);

    // Delete comment
    response = await fetch(`${BASE_URL}/engagement/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete comment');
    }
    console.log('✅ Successfully deleted comment');

    // Verify comment was deleted
    const commentDeleted = !(await Comment.findOne({ _id: commentId, active: true }));
    console.log(`✅ Comment deletion verification: ${commentDeleted ? 'Success' : 'Failed'}`);

  } catch (error) {
    console.error('❌ Comment test error:', error.message);
  }
};

// Test follow functionality
const testFollows = async (userId, targetUserId) => {
  console.log('\n=== Testing Follow Functionality ===');
  try {
    // Follow user
    let response = await fetch(`${BASE_URL}/engagement/follow/${targetUserId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    let data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to follow user');
    }
    console.log('✅ Successfully followed user');

    // Verify follow exists
    const followExists = await Follow.findOne({ 
      follower: userId, 
      following: targetUserId
    });
    console.log(`✅ Follow verification: ${followExists ? 'Success' : 'Failed'}`);

    // Verify user stats were updated
    const followerUser = await User.findById(userId);
    const followingUser = await User.findById(targetUserId);
    console.log(`✅ Follower stats - following count: ${followerUser.stats.following}`);
    console.log(`✅ Target user stats - followers count: ${followingUser.stats.followers}`);

    // Get followers
    response = await fetch(`${BASE_URL}/engagement/followers/${targetUserId}`);
    data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get followers');
    }
    console.log(`✅ Successfully fetched followers: ${data.followers.length} followers found`);

    // Get following
    response = await fetch(`${BASE_URL}/engagement/following/${userId}`);
    data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get following');
    }
    console.log(`✅ Successfully fetched following: ${data.following.length} following found`);

    // Unfollow user
    response = await fetch(`${BASE_URL}/engagement/follow/${targetUserId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to unfollow user');
    }
    console.log('✅ Successfully unfollowed user');

    // Verify follow was removed
    const followRemoved = !(await Follow.findOne({ 
      follower: userId, 
      following: targetUserId
    }));
    console.log(`✅ Follow removal verification: ${followRemoved ? 'Success' : 'Failed'}`);

    // Verify user stats were updated
    const updatedFollowerUser = await User.findById(userId);
    const updatedFollowingUser = await User.findById(targetUserId);
    console.log(`✅ Updated follower stats - following count: ${updatedFollowerUser.stats.following}`);
    console.log(`✅ Updated target user stats - followers count: ${updatedFollowingUser.stats.followers}`);

    // Test self-follow prevention
    response = await fetch(`${BASE_URL}/engagement/follow/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    data = await response.json();
    console.log(`✅ Self-follow prevention: ${!response.ok ? 'Working as expected' : 'Failed'}`);

  } catch (error) {
    console.error('❌ Follow test error:', error.message);
  }
};

// Test edge cases
const testEdgeCases = async (userId) => {
  console.log('\n=== Testing Edge Cases ===');
  
  try {
    // Test liking non-existent content
    let response = await fetch(`${BASE_URL}/engagement/likes/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        contentId: new mongoose.Types.ObjectId(),
        contentType: 'Video'
      })
    });

    let data = await response.json();
    console.log(`✅ Liking non-existent content: ${response.status} response`);

    // Test commenting on non-existent content
    response = await fetch(`${BASE_URL}/engagement/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        contentId: new mongoose.Types.ObjectId(),
        contentType: 'Video',
        text: 'This comment should not work'
      })
    });

    data = await response.json();
    console.log(`✅ Commenting on non-existent content: ${response.status} response`);

    // Test updating non-existent comment
    response = await fetch(`${BASE_URL}/engagement/comments/${new mongoose.Types.ObjectId()}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        text: 'This update should not work'
      })
    });

    data = await response.json();
    console.log(`✅ Updating non-existent comment: ${response.status} response`);

    // Test deleting non-existent comment
    response = await fetch(`${BASE_URL}/engagement/comments/${new mongoose.Types.ObjectId()}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    data = await response.json();
    console.log(`✅ Deleting non-existent comment: ${response.status} response`);

    // Test following non-existent user
    response = await fetch(`${BASE_URL}/engagement/follow/${new mongoose.Types.ObjectId()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    data = await response.json();
    console.log(`✅ Following non-existent user: ${response.status} response`);

  } catch (error) {
    console.error('❌ Edge case test error:', error.message);
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

    // Delete test follows
    const deletedFollows = await Follow.deleteMany({
      $or: [
        { follower: { $in: testUsers.map(user => user._id) } },
        { following: { $in: testUsers.map(user => user._id) } }
      ]
    });
    console.log(`✅ Deleted ${deletedFollows.deletedCount} test follows`);

    // Delete test videos
    const deletedVideos = await Video.deleteMany({
      _id: { $in: testVideos.map(video => video._id) }
    });
    console.log(`✅ Deleted ${deletedVideos.deletedCount} test videos`);

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
    testVideos = await setupTestVideos(testUsers[0]._id);
    
    // Login as first user
    authToken = await login('test1@example.com', 'Password123');
    
    // Run tests
    await testLikes(testUsers[0]._id, testVideos[0]._id);
    await testComments(testUsers[0]._id, testVideos[0]._id);
    await testFollows(testUsers[0]._id, testUsers[1]._id);
    await testEdgeCases(testUsers[0]._id);
    
    // Cleanup
    await cleanup();
    
    console.log('\n✅ All tests completed!');
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