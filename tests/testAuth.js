import fetch from 'node-fetch';

// Base URL for the API
const BASE_URL = 'http://localhost:5000/api/auth';

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

// Store tokens
let accessToken;
let refreshToken;
let resetToken;

// Helper to log test results
const logResult = (testName, success, data = null) => {
  console.log(`\n----- ${testName} -----`);
  console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (data) {
    console.log('Response:', JSON.stringify(data, null, 2));
  }
};

// Register user
const testRegister = async () => {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    const success = response.status === 201 && data.success;
    
    if (success) {
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
    }
    
    logResult('Register User', success, data);
    return success;
  } catch (error) {
    console.error('Register test error:', error);
    logResult('Register User', false, { error: error.message });
    return false;
  }
};

// Login user
const testLogin = async () => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const data = await response.json();
    const success = response.status === 200 && data.success;
    
    if (success) {
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
    }
    
    logResult('Login User', success, data);
    return success;
  } catch (error) {
    console.error('Login test error:', error);
    logResult('Login User', false, { error: error.message });
    return false;
  }
};

// Get current user profile
const testGetProfile = async () => {
  try {
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    const success = response.status === 200 && data.success;
    
    logResult('Get Profile', success, data);
    return success;
  } catch (error) {
    console.error('Get profile test error:', error);
    logResult('Get Profile', false, { error: error.message });
    return false;
  }
};

// Refresh token
const testRefreshToken = async () => {
  try {
    const response = await fetch(`${BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    const success = response.status === 200 && data.success;
    
    if (success) {
      accessToken = data.accessToken;
    }
    
    logResult('Refresh Token', success, data);
    return success;
  } catch (error) {
    console.error('Refresh token test error:', error);
    logResult('Refresh Token', false, { error: error.message });
    return false;
  }
};

// Forgot password
const testForgotPassword = async () => {
  try {
    const response = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email })
    });
    
    const data = await response.json();
    const success = response.status === 200 && data.success;
    
    if (success && data.resetToken) {
      resetToken = data.resetToken;
    }
    
    logResult('Forgot Password', success, data);
    return success;
  } catch (error) {
    console.error('Forgot password test error:', error);
    logResult('Forgot Password', false, { error: error.message });
    return false;
  }
};

// Reset password
const testResetPassword = async () => {
  if (!resetToken) {
    logResult('Reset Password', false, { error: 'No reset token available' });
    return false;
  }
  
  try {
    const newPassword = 'newpassword123';
    
    const response = await fetch(`${BASE_URL}/reset-password/${resetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });
    
    const data = await response.json();
    const success = response.status === 200 && data.success;
    
    if (success) {
      // Update test user password for future tests
      testUser.password = newPassword;
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
    }
    
    logResult('Reset Password', success, data);
    return success;
  } catch (error) {
    console.error('Reset password test error:', error);
    logResult('Reset Password', false, { error: error.message });
    return false;
  }
};

// Logout
const testLogout = async () => {
  try {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    const success = response.status === 200 && data.success;
    
    logResult('Logout', success, data);
    return success;
  } catch (error) {
    console.error('Logout test error:', error);
    logResult('Logout', false, { error: error.message });
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('🧪 Starting Authentication API Tests 🧪');
  
  // First register a new user
  const registerSuccess = await testRegister();
  
  if (registerSuccess) {
    // Test profile access with the token
    await testGetProfile();
    
    // Test refresh token
    await testRefreshToken();
    
    // Test profile access with new token
    await testGetProfile();
    
    // Test forgot password flow
    await testForgotPassword();
    
    // Test reset password
    if (resetToken) {
      await testResetPassword();
      
      // Login with new password
      await testLogin();
    }
    
    // Test logout
    await testLogout();
  } else {
    // Try login with existing user
    const loginSuccess = await testLogin();
    
    if (loginSuccess) {
      await testGetProfile();
      await testRefreshToken();
      await testLogout();
    }
  }
  
  console.log('\n🏁 Authentication API Tests Completed 🏁');
};

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
}); 