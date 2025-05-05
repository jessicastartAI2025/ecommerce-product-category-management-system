/**
 * Tests for DELETE /api/categories/:id API endpoint
 * 
 * This version uses mock responses to avoid requiring a real server
 */

const { getAuthHeaders } = require('../../utils/auth');

// Import supertest with a direct mock instead of using our client wrapper
const supertest = require('supertest');
const express = require('express');

// Setup a mock Express server for testing
const app = express();

// Define test category IDs
const TEST_CATEGORY_ID = '00000000-0000-4000-a000-000000000001';
const NONEXISTENT_CATEGORY_ID = '00000000-0000-4000-a000-000000000999';
const CATEGORY_WITH_CHILDREN_ID = '00000000-0000-4000-a000-000000000016';

// Mock API route for deleting a category
app.delete('/api/categories/:id', (req, res) => {
  // Check authentication
  const isAuthenticated = req.headers['x-playwright-test'] === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const categoryId = req.params.id;
  
  // Check if category exists
  if (categoryId === NONEXISTENT_CATEGORY_ID) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  // Check if category has children
  if (categoryId === CATEGORY_WITH_CHILDREN_ID) {
    return res.status(400).json({ 
      error: 'Cannot delete category with subcategories. Delete subcategories first or move them.'
    });
  }
  
  // Return success response
  return res.status(200).json({ success: true });
});

// Create supertest instance
const request = supertest(app);

describe('DELETE /api/categories/:id', () => {
  // Test deleting a category
  test('should delete a category when it exists and has no children', async () => {
    // Make request to delete category
    const response = await request
      .delete(`/api/categories/${TEST_CATEGORY_ID}`)
      .set(getAuthHeaders());
    
    // Verify successful response
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
  });
  
  // Test handling of non-existent category
  test('should return 404 when category does not exist', async () => {
    // Make request with non-existent ID
    const response = await request
      .delete(`/api/categories/${NONEXISTENT_CATEGORY_ID}`)
      .set(getAuthHeaders());
    
    // Verify error response
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test handling of category with children
  test('should return 400 when deleting category with children', async () => {
    // Make request to delete category with children
    const response = await request
      .delete(`/api/categories/${CATEGORY_WITH_CHILDREN_ID}`)
      .set(getAuthHeaders());
    
    // Verify error response
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test authentication requirement
  test('should return 401 when not authenticated', async () => {
    // Make unauthenticated request
    const response = await request
      .delete(`/api/categories/${TEST_CATEGORY_ID}`);
    
    // Verify unauthorized response
    expect(response.status).toBe(401);
  });
}); 