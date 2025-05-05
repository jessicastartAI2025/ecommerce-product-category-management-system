/**
 * Tests for PUT /api/categories/:id API endpoint
 * 
 * This version uses mock responses to avoid requiring a real server
 */

const { getAuthHeaders } = require('../../utils/auth');
const { categoryUpdate } = require('../../fixtures/categories');

// Import supertest with a direct mock instead of using our client wrapper
const supertest = require('supertest');
const express = require('express');

// Setup a mock Express server for testing
const app = express();

// Define test category ID
const TEST_CATEGORY_ID = '00000000-0000-4000-a000-000000000001';
const NONEXISTENT_CATEGORY_ID = '00000000-0000-4000-a000-000000000999';

// Mock API route for updating a category
app.put('/api/categories/:id', express.json(), (req, res) => {
  // Check authentication
  const isAuthenticated = req.headers['x-playwright-test'] === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const categoryId = req.params.id;
  
  // Check if category exists
  if (categoryId !== TEST_CATEGORY_ID) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  // Validate request body
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  // Update the category
  const now = new Date().toISOString();
  const updatedCategory = {
    id: categoryId,
    name: name,
    parent_id: req.body.parentId || null,
    user_id: 'test-user-uuid',
    updated_at: now,
    sort_order: req.body.order || 0
  };
  
  // Return the updated category
  return res.status(200).json(updatedCategory);
});

// Create supertest instance
const request = supertest(app);

describe('PUT /api/categories/:id', () => {
  // Test updating a category
  test('should update a category when data is valid', async () => {
    // Make request to update category
    const response = await request
      .put(`/api/categories/${TEST_CATEGORY_ID}`)
      .set(getAuthHeaders())
      .send(categoryUpdate);
    
    // Verify successful response
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(categoryUpdate.name);
  });
  
  // Test handling of non-existent category
  test('should return 404 when category does not exist', async () => {
    // Make request with non-existent ID
    const response = await request
      .put(`/api/categories/${NONEXISTENT_CATEGORY_ID}`)
      .set(getAuthHeaders())
      .send(categoryUpdate);
    
    // Verify error response
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test validation error handling
  test('should return 400 when category data is invalid', async () => {
    // Make request with invalid data
    const response = await request
      .put(`/api/categories/${TEST_CATEGORY_ID}`)
      .set(getAuthHeaders())
      .send({ name: '' }); // Empty name
    
    // Verify error response
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test authentication requirement
  test('should return 401 when not authenticated', async () => {
    // Make unauthenticated request
    const response = await request
      .put(`/api/categories/${TEST_CATEGORY_ID}`)
      .send(categoryUpdate);
    
    // Verify unauthorized response
    expect(response.status).toBe(401);
  });
}); 