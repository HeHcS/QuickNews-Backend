/**
 * Test Registration and Login API
 * 
 * This script tests both registration and login APIs.
 * Run with: node tests/testRegisterAndLogin.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:9000/api';
const TEST_EMAIL = `test-${uuidv4().substring(0, 8)}@example.com`;
const TEST_PASSWORD = 'password123';

// Test registration API
const testRegisterAPI = async () => {
  try {
    console.log(`\nRegistering new user: ${TEST_EMAIL}`);
    console.log(`POST ${BASE_URL}/auth/register`);
    
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Register Test User',
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    console.log(`Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    return {
      success: data.success === true,
      token: data.accessToken
    };
  } catch (error) {
    console.error('Registration API Test Error:', error.message);
    return { success: false };
  }
};

// Test login API
const testLoginAPI = async () => {
  try {
    console.log(`\nTesting login with ${TEST_EMAIL}:${TEST_PASSWORD}`);
    console.log(`POST ${BASE_URL}/auth/login`);
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    console.log(`Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    return {
      success: data.success === true,
      token: data.accessToken
    };
  } catch (error) {
    console.error('Login API Test Error:', error.message);
    return { success: false };
  }
};

// Test video upload with token
const testVideoUpload = async (token) => {
  if (!token) {
    console.log('\nSkipping video upload test (no token)');
    return false;
  }
  
  try {
    console.log('\nTesting mock video upload (no actual file):');
    console.log(`POST ${BASE_URL}/videos/upload`);
    
    const response = await fetch(`${BASE_URL}/videos/upload`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Video',
        description: 'This is a test video'
      })
    });
    
    console.log(`Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    return response.status === 400 && data.message === 'No video file uploaded';
  } catch (error) {
    console.error('Video Upload Test Error:', error.message);
    return false;
  }
};

// Run the test
const runTest = async () => {
  console.log('🧪 Starting Registration and Login API Test 🧪');
  
  // Test registration
  const registerResult = await testRegisterAPI();
  
  if (registerResult.success) {
    console.log('\n✅ Registration API Test PASSED');
    
    // Test login
    const loginResult = await testLoginAPI();
    
    if (loginResult.success) {
      console.log('\n✅ Login API Test PASSED');
      
      // Test video upload
      const uploadResult = await testVideoUpload(loginResult.token);
      
      if (uploadResult) {
        console.log('\n✅ Video Upload API Test PASSED');
      } else {
        console.log('\n❌ Video Upload API Test FAILED');
      }
    } else {
      console.log('\n❌ Login API Test FAILED');
    }
  } else {
    console.log('\n❌ Registration API Test FAILED');
  }
};

runTest(); 