/**
 * Direct test for user and creator profile functionality using MongoDB
 * Tests profile updates and creator application/approval
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/userModel.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return false;
  }
}

// Create test user
async function createTestUser() {
  try {
    console.log('\n🔍 Creating test user...');
    
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@example.com`;
    const password = 'TestPassword123!';
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      return existingUser;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      name: `Test User ${timestamp}`,
      email,
      password: hashedPassword,
      bio: 'Initial test bio',
      website: 'https://example.com',
      location: 'Test City',
      socialLinks: {
        twitter: 'testuser',
        instagram: 'testuser'
      }
    });
    
    await newUser.save();
    
    console.log('✅ Test user created successfully');
    console.log(`- ID: ${newUser._id}`);
    console.log(`- Name: ${newUser.name}`);
    console.log(`- Email: ${email}`);
    console.log(`- Password: ${password}`);
    
    return newUser;
  } catch (error) {
    console.error(`Error creating test user: ${error.message}`);
    return null;
  }
}

// Test profile update
async function updateUserProfile(userId) {
  try {
    console.log('\n🔍 Testing profile update...');
    
    const updatedProfile = await User.findByIdAndUpdate(
      userId,
      {
        bio: `Updated bio - ${new Date().toISOString()}`,
        website: 'https://updated-example.com',
        location: 'Updated Test City',
        socialLinks: {
          twitter: 'updated_testuser',
          instagram: 'updated_testuser',
          youtube: 'testchannel'
        }
      },
      { new: true }
    );
    
    console.log('✅ Profile updated successfully');
    console.log(`- Bio: ${updatedProfile.bio}`);
    console.log(`- Website: ${updatedProfile.website}`);
    console.log(`- Location: ${updatedProfile.location}`);
    console.log(`- Social Links:`, JSON.stringify(updatedProfile.socialLinks, null, 2));
    
    return updatedProfile;
  } catch (error) {
    console.error(`Error updating profile: ${error.message}`);
    return null;
  }
}

// Test creator application
async function applyForCreator(userId) {
  try {
    console.log('\n🔍 Testing creator application...');
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.creatorProfile = {
      isApproved: false,
      applicationDate: new Date(),
      specialization: ['Technology', 'Education'],
      featured: false
    };
    
    await user.save();
    
    console.log('✅ Creator application submitted successfully');
    console.log(`- Application Date: ${user.creatorProfile.applicationDate}`);
    console.log(`- Is Approved: ${user.creatorProfile.isApproved}`);
    console.log(`- Specialization: ${user.creatorProfile.specialization}`);
    
    return user;
  } catch (error) {
    console.error(`Error applying for creator: ${error.message}`);
    return null;
  }
}

// Test creator approval
async function approveCreator(userId) {
  try {
    console.log('\n🔍 Testing creator approval...');
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.creatorProfile || !user.creatorProfile.applicationDate) {
      throw new Error('User has not applied for creator status');
    }
    
    // Update to creator role
    user.role = 'creator';
    user.creatorProfile.isApproved = true;
    user.creatorProfile.approvalDate = new Date();
    
    // Add verified badge
    if (!user.creatorProfile.badges) {
      user.creatorProfile.badges = [];
    }
    user.creatorProfile.badges.push('verified');
    
    await user.save();
    
    console.log('✅ Creator application approved successfully');
    console.log(`- Role: ${user.role}`);
    console.log(`- Is Approved: ${user.creatorProfile.isApproved}`);
    console.log(`- Approval Date: ${user.creatorProfile.approvalDate}`);
    console.log(`- Badges: ${user.creatorProfile.badges}`);
    
    return user;
  } catch (error) {
    console.error(`Error approving creator: ${error.message}`);
    return null;
  }
}

// Get final user state
async function getFinalUserState(userId) {
  try {
    console.log('\n🔍 Getting final user state...');
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log('✅ Final user state:');
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Bio: ${user.bio}`);
    console.log(`- Website: ${user.website}`);
    console.log(`- Location: ${user.location}`);
    console.log(`- Social Links:`, JSON.stringify(user.socialLinks, null, 2));
    console.log(`- Creator Profile:`, JSON.stringify(user.creatorProfile, null, 2));
    
    return user;
  } catch (error) {
    console.error(`Error getting final user state: ${error.message}`);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('=====================================================');
  console.log('🧪 STARTING DIRECT PROFILE FUNCTIONALITY TESTS 🧪');
  console.log('=====================================================');
  
  // Connect to MongoDB
  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('❌ Cannot proceed without database connection');
    return;
  }
  
  // Create test user
  const testUser = await createTestUser();
  if (!testUser) {
    console.error('❌ Failed to create test user. Aborting tests.');
    await mongoose.connection.close();
    return;
  }
  
  // Update profile
  const updatedUser = await updateUserProfile(testUser._id);
  if (!updatedUser) {
    console.error('❌ Failed to update profile');
  }
  
  // Apply for creator
  const creatorApplicant = await applyForCreator(testUser._id);
  if (!creatorApplicant) {
    console.error('❌ Failed to apply for creator status');
  }
  
  // Approve creator
  const approvedCreator = await approveCreator(testUser._id);
  if (!approvedCreator) {
    console.error('❌ Failed to approve creator');
  }
  
  // Get final state
  await getFinalUserState(testUser._id);
  
  // Close MongoDB connection
  console.log('\nClosing MongoDB connection...');
  await mongoose.connection.close();
  
  console.log('\n=====================================================');
  console.log('🎉 DIRECT PROFILE TESTS COMPLETED 🎉');
  console.log('=====================================================');
}

// Execute the tests
runTests(); 