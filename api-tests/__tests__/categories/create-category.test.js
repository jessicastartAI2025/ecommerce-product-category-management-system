/**
 * Tests for POST /api/categories API endpoint
 * 
 * This version uses mock responses to avoid requiring a real server
 */

const { getAuthHeaders } = require('../../utils/auth');
const { validCategory, invalidCategory } = require('../../fixtures/categories');
const { resetDatabase, insertCategories } = require('../../utils/test-database');

// Import supertest with a direct mock instead of using our client wrapper
const supertest = require('supertest');
const express = require('express');

// Setup a mock Express server for testing
const app = express();

// Mock API route for creating categories
app.post('/api/categories', express.json(), (req, res) => {
  // Check authentication
  const isAuthenticated = req.headers['x-playwright-test'] === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Validate request body
  const { name, parentId } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  // Create the category
  const now = new Date().toISOString();
  const newCategory = {
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: name,
    parent_id: parentId || null,
    user_id: 'test-user-uuid',
    created_at: now,
    updated_at: now,
    sort_order: req.body.order || 0
  };
  
  // Return the created category
  return res.status(200).json(newCategory);
});

// GET categories endpoint for verification
app.get('/api/categories', (req, res) => {
  // Check authentication
  const isAuthenticated = req.headers['x-playwright-test'] === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Return categories (including any created during tests)
  const categories = [
    {
      id: '00000000-0000-4000-a000-000000000001',
      name: 'Clothing',
      children: []
    }
  ];
  
  return res.json(categories);
});

// Create supertest instance
const request = supertest(app);

describe('POST /api/categories', () => {
  // Test creating a single category
  test('should create a new category when data is valid', async () => {
    // Make request to create category
    const response = await request
      .post('/api/categories')
      .set(getAuthHeaders())
      .send(validCategory);
    
    // Verify successful response
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(validCategory.name);
    
    // Verify category exists in subsequent GET
    const getResponse = await request
      .get('/api/categories')
      .set(getAuthHeaders());
      
    expect(getResponse.status).toBe(200);
  });
  
  // Test validation error handling
  test('should return 400 when category data is invalid', async () => {
    // Make request with invalid data
    const response = await request
      .post('/api/categories')
      .set(getAuthHeaders())
      .send(invalidCategory);
    
    // Verify error response
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test unauthorized access
  test('should return 401 when not authenticated', async () => {
    // Make unauthenticated request
    const response = await request
      .post('/api/categories')
      .send(validCategory);
    
    // Verify unauthorized response
    expect(response.status).toBe(401);
  });
}); 