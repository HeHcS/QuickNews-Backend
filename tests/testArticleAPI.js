import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:9000/api';
let authToken = '';

// Test image path
const testImagePath = path.join(__dirname, 'test-assets', 'test-video.mp4'); // Using existing test asset

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null, token = null, isFormData = false) {
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!isFormData && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    if (isFormData) {
      options.body = body;
    } else if (method !== 'GET') {
      options.body = JSON.stringify(body);
    }
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  
  if (response.status === 204) {
    return { status: response.status };
  }
  
  const data = await response.json();
  return { status: response.status, data };
}

// Login function
async function login(email, password) {
  const response = await apiRequest('/auth/login', 'POST', { email, password });
  if (response.status === 200) {
    authToken = response.data.token;
    console.log('Login successful');
    return true;
  }
  console.error('Login failed:', response.data);
  return false;
}

// Test article creation
async function testCreateArticle() {
  console.log('\n--- Testing Article Creation ---');
  
  const formData = new FormData();
  formData.append('title', 'Test Article ' + Date.now());
  formData.append('content', '<p>This is a test article content with <b>formatted text</b>.</p>');
  formData.append('summary', 'A brief summary of the test article');
  formData.append('tags', JSON.stringify(['test', 'api', 'article']));
  formData.append('categories', JSON.stringify(['Technology', 'Testing']));
  formData.append('status', 'draft');
  
  // Add test image as featured image
  if (fs.existsSync(testImagePath)) {
    formData.append('featuredImage', fs.createReadStream(testImagePath));
  } else {
    console.warn(`Test image not found at ${testImagePath}`);
  }
  
  const response = await apiRequest('/articles/upload', 'POST', formData, authToken, true);
  
  if (response.status === 201) {
    console.log('Article created successfully:', response.data.data.article.title);
    return response.data.data.article._id;
  } else {
    console.error('Failed to create article:', response.data);
    return null;
  }
}

// Test get all articles
async function testGetAllArticles() {
  console.log('\n--- Testing Get All Articles ---');
  
  const response = await apiRequest('/articles');
  
  if (response.status === 200) {
    console.log(`Retrieved ${response.data.data.articles.length} articles`);
    console.log('Pagination:', response.data.data.pagination);
    return true;
  } else {
    console.error('Failed to get articles:', response.data);
    return false;
  }
}

// Test get article by ID
async function testGetArticleById(articleId) {
  console.log('\n--- Testing Get Article By ID ---');
  
  const response = await apiRequest(`/articles/${articleId}`);
  
  if (response.status === 200) {
    console.log('Retrieved article:', response.data.data.article.title);
    return true;
  } else {
    console.error('Failed to get article:', response.data);
    return false;
  }
}

// Test update article
async function testUpdateArticle(articleId) {
  console.log('\n--- Testing Update Article ---');
  
  const formData = new FormData();
  formData.append('title', 'Updated Test Article ' + Date.now());
  formData.append('status', 'published');
  
  const response = await apiRequest(`/articles/${articleId}`, 'PATCH', formData, authToken, true);
  
  if (response.status === 200) {
    console.log('Article updated successfully:', response.data.data.article.title);
    return true;
  } else {
    console.error('Failed to update article:', response.data);
    return false;
  }
}

// Test delete article
async function testDeleteArticle(articleId) {
  console.log('\n--- Testing Delete Article ---');
  
  const response = await apiRequest(`/articles/${articleId}`, 'DELETE', null, authToken);
  
  if (response.status === 204) {
    console.log('Article deleted successfully');
    return true;
  } else {
    console.error('Failed to delete article:', response.data);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting Article API Tests...');
  
  // Login first
  const loggedIn = await login('test@example.com', 'password123');
  if (!loggedIn) {
    console.error('Cannot proceed with tests without login');
    return;
  }
  
  // Create article
  const articleId = await testCreateArticle();
  if (!articleId) {
    console.error('Cannot proceed with tests without article creation');
    return;
  }
  
  // Get all articles
  await testGetAllArticles();
  
  // Get article by ID
  await testGetArticleById(articleId);
  
  // Update article
  await testUpdateArticle(articleId);
  
  // Delete article
  await testDeleteArticle(articleId);
  
  console.log('\nArticle API Tests Completed');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});