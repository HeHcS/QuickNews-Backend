import { io } from 'socket.io-client';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Video from '../models/videoModel.js';

dotenv.config();

const SERVER_URL = 'http://localhost:9000';
const API_URL = `${SERVER_URL}/api`;
let authToken;

// Test user credentials
const testUser = {
  email: 'sockettest@example.com',
  password: 'Password123',
  name: 'Socket Test User'
};

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
    return true;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    return false;
  }
};

// Setup test user
const setupTestUser = async () => {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: testUser.email });
    
    if (!user) {
      // Create test user
      user = await User.create({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        isVerified: true,
        active: true
      });
      console.log('Created test user for socket testing');
    } else {
      console.log('Using existing test user for socket testing');
    }
    
    return user;
  } catch (error) {
    console.error('Error setting up test user:', error.message);
    throw error;
  }
};

// Setup test video
const setupTestVideo = async (userId) => {
  try {
    // Check if video already exists
    let video = await Video.findOne({ title: 'Socket Test Video' });
    
    if (!video) {
      // Create test video
      video = await Video.create({
        creator: userId,
        title: 'Socket Test Video',
        description: 'Video for testing socket functionality',
        videoFile: 'socket-test.mp4',
        thumbnail: 'socket-test.jpg',
        duration: 60,
        isPublished: true
      });
      console.log('Created test video for socket testing');
    } else {
      console.log('Using existing test video for socket testing');
    }
    
    return video;
  } catch (error) {
    console.error('Error setting up test video:', error.message);
    throw error;
  }
};

// Login and get auth token
const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
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

    console.log('✅ Successfully logged in');
    return data.accessToken;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
};

// Test Socket.IO connection
const testSocketConnection = async () => {
  let dbConnected = false;
  let mongooseInstance = null;
  
  try {
    // Connect to database and setup test data
    dbConnected = await connectToDatabase();
    
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    
    const user = await setupTestUser();
    const video = await setupTestVideo(user._id);
    
    // Login with test user
    authToken = await login(testUser.email, testUser.password);
    
    console.log('Connecting to Socket.IO server...');
    
    // Connect to Socket.IO server
    const socket = io(SERVER_URL, {
      auth: {
        token: authToken
      }
    });
    
    // Listen for connection events
    socket.on('connect', () => {
      console.log('✅ Socket connection established successfully');
      console.log(`Socket ID: ${socket.id}`);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });
    
    // Subscribe to comment events for the test video
    console.log(`Subscribing to comment events for video ${video._id}...`);
    
    socket.on(`comment:${video._id}`, (data) => {
      console.log('✅ Received comment event:', data.type);
      console.log(data);
    });
    
    // Subscribe to like events for the test video
    console.log(`Subscribing to like events for video ${video._id}...`);
    
    socket.on(`like:${video._id}`, (data) => {
      console.log('✅ Received like event:', data.type);
      console.log(data);
    });
    
    // Post a comment to trigger event
    console.log('Posting a test comment...');
    
    await fetch(`${API_URL}/engagement/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        contentId: video._id,
        contentType: 'Video',
        text: 'This is a socket test comment'
      })
    });
    
    // Toggle like to trigger event
    console.log('Toggling a test like...');
    
    await fetch(`${API_URL}/engagement/likes/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        contentId: video._id,
        contentType: 'Video'
      })
    });
    
    // Keep the connection open to receive events
    console.log('\nListening for events... (Press Ctrl+C to exit)');
    
    // Keep the process running for a bit to receive socket events
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Socket test completed');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Disconnect from MongoDB if connected
    if (dbConnected && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB Disconnected');
    }
  }
};

testSocketConnection(); 