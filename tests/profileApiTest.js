/**
 * API test for user and creator profile functionality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:9000/api';
let authToken = '';
let userId = '';

// Register a test user first
async function registerUser() {
  try {
    console.log('\n🔍 Registering test user...');
    
    // Generate unique timestamp for email
    const timestamp = Date.now();
    const userData = {
      name: `Test User ${timestamp}`,
      email: `testuser_${timestamp}@example.com`,
      password: 'TestPassword123!'
    };
    
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    console.log('Register response status:', response.status);
    
    if (!response.ok) {
      // If user exists, try login
      if (response.status === 400 && data.error?.includes('already exists')) {
        console.log('⚠️ User already exists, trying login instead');
        return loginUser(userData.email, userData.password);
      }
      throw new Error(data.error || data.message || 'Registration failed');
    }
    
    console.log('✅ User registered successfully');
    console.log(`- Email: ${userData.email}`);
    console.log(`- Password: ${userData.password}`);
    
    // Store token and user ID
    if (data.accessToken) {
      authToken = data.accessToken;
      userId = data.user?.id || '';
      
      console.log(`- Token received: ${authToken ? 'Yes' : 'No'}`);
      console.log(`- User ID: ${userId}`);
      
      return {
        success: true,
        email: userData.email,
        password: userData.password
      };
    } else {
      // If no token in response, try login
      return loginUser(userData.email, userData.password);
    }
  } catch (error) {
    console.error(`❌ Registration failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Login user
async function loginUser(email, password) {
  try {
    console.log('\n🔍 Logging in user...');
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    const data = await response.json();
    
    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }
    
    console.log('✅ Login successful');
    
    // Store auth token - note the API returns accessToken, not token
    authToken = data.accessToken;
    userId = data.user?.id || '';
    
    console.log(`- Token received: ${authToken ? 'Yes' : 'No'}`);
    console.log(`- User ID: ${userId}`);
    
    return {
      success: true,
      token: data.accessToken,
      user: data.user
    };
  } catch (error) {
    console.error(`❌ Login failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test get current profile
async function getCurrentProfile() {
  try {
    console.log('\n🔍 Getting current profile...');
    console.log(`- Using token: ${authToken ? authToken.substring(0, 20) + '...' : 'undefined'}`);
    
    const response = await fetch(`${BASE_URL}/profile/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    console.log('Profile response status:', response.status);
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get profile');
    }
    
    console.log('✅ Retrieved profile successfully');
    console.log(`- Name: ${data.name}`);
    console.log(`- Email: ${data.email}`);
    console.log(`- Bio: ${data.bio || 'No bio'}`);
    
    return {
      success: true,
      profile: data
    };
  } catch (error) {
    console.error(`❌ Error getting profile: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Update profile
async function updateProfile() {
  try {
    console.log('\n🔍 Updating profile...');
    
    const updateData = {
      bio: `Updated bio - ${new Date().toISOString()}`,
      website: 'https://updated-example.com',
      location: 'Updated Test City',
      socialLinks: {
        twitter: 'updated_testuser',
        instagram: 'updated_testuser',
        youtube: 'testchannel'
      }
    };
    
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    console.log('Update response status:', response.status);
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update profile');
    }
    
    console.log('✅ Profile updated successfully');
    console.log(`- Bio: ${data.bio}`);
    console.log(`- Website: ${data.website}`);
    console.log(`- Location: ${data.location}`);
    
    return {
      success: true,
      profile: data
    };
  } catch (error) {
    console.error(`❌ Error updating profile: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get profile by ID
async function getProfileById() {
  if (!userId) {
    console.error('❌ No user ID available');
    return {
      success: false,
      error: 'No user ID available'
    };
  }
  
  try {
    console.log('\n🔍 Getting profile by ID...');
    console.log(`- User ID: ${userId}`);
    
    const response = await fetch(`${BASE_URL}/profile/user/${userId}`);
    
    const data = await response.json();
    
    console.log('Profile by ID response status:', response.status);
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get profile by ID');
    }
    
    console.log('✅ Retrieved profile by ID successfully');
    console.log(`- Name: ${data.name}`);
    console.log(`- Bio: ${data.bio || 'No bio'}`);
    
    return {
      success: true,
      profile: data
    };
  } catch (error) {
    console.error(`❌ Error getting profile by ID: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Apply for creator status
async function applyForCreator() {
  try {
    console.log('\n🔍 Applying for creator status...');
    
    // Try to use MongoDB ObjectId format
    const categoryId = '65a123b789c123456789abcd';
    
    const response = await fetch(`${BASE_URL}/profile/creator-application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        category: categoryId,
        specialization: ['Technology', 'Education']
      })
    });
    
    const data = await response.json();
    
    console.log('Creator application response status:', response.status);
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to apply for creator status');
    }
    
    console.log('✅ Applied for creator status successfully');
    console.log(`- Message: ${data.message}`);
    if (data.applicationDate) {
      console.log(`- Application Date: ${data.applicationDate}`);
    }
    
    return {
      success: true,
      result: data
    };
  } catch (error) {
    console.error(`❌ Error applying for creator status: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Check server health
async function checkServerHealth() {
  try {
    console.log('\n🔍 Checking server health...');
    
    const response = await fetch(`${BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Server is running');
    console.log(`- Status: ${data.status}`);
    console.log(`- Environment: ${data.environment}`);
    console.log(`- Database: ${data.dbStatus}`);
    
    return {
      success: true,
      serverInfo: data
    };
  } catch (error) {
    console.error(`❌ Server health check failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run all API tests
async function runAPITests() {
  console.log('=====================================================');
  console.log('🧪 STARTING PROFILE API TESTS 🧪');
  console.log('=====================================================');
  
  // First check if server is running
  const serverStatus = await checkServerHealth();
  if (!serverStatus.success) {
    console.error('❌ Cannot proceed with tests, server is not running');
    return;
  }
  
  // Register/login
  const authResult = await registerUser();
  if (!authResult.success) {
    console.error('❌ Cannot proceed with tests, authentication failed');
    return;
  }
  
  // Get current profile
  await getCurrentProfile();
  
  // Update profile
  await updateProfile();
  
  // Get profile by ID
  await getProfileById();
  
  // Apply for creator
  await applyForCreator();
  
  console.log('\n=====================================================');
  console.log('🎉 PROFILE API TESTS COMPLETED 🎉');
  console.log('=====================================================');
}

// Run the tests
runAPITests(); 