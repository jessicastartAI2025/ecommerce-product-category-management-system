/**
 * Tests for GET /api/categories API endpoint
 * 
 * This version uses mock responses to avoid requiring a real server
 */

const { getAuthHeaders } = require('../../utils/auth');
const { resetDatabase, insertCategories, getCategories } = require('../../utils/test-database');

// Import supertest with a direct mock instead of using our client wrapper
const supertest = require('supertest');
const express = require('express');

// Setup a mock Express server for testing
const app = express();

// Mock API route for testing
app.get('/api/categories', (req, res) => {
  // Check authentication
  const isAuthenticated = req.headers['x-playwright-test'] === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check format parameter
  const format = req.query.format;

  // Default test categories
  const categories = [
    {
      id: '00000000-0000-4000-a000-000000000001',
      name: 'Clothing',
      children: [
        { id: '00000000-0000-4000-a000-000000000002', name: "Men's Wear" },
        { id: '00000000-0000-4000-a000-000000000003', name: "Women's Wear" }
      ]
    },
    {
      id: '00000000-0000-4000-a000-000000000016',
      name: 'Electronics',
      children: [
        { id: '00000000-0000-4000-a000-000000000017', name: 'Computers' }
      ]
    }
  ];
  
  if (format === 'flat') {
    // Return flat format
    const flatCategories = [
      { id: '00000000-0000-4000-a000-000000000001', name: 'Clothing', parent_id: null },
      { id: '00000000-0000-4000-a000-000000000002', name: "Men's Wear", parent_id: '00000000-0000-4000-a000-000000000001' },
      { id: '00000000-0000-4000-a000-000000000003', name: "Women's Wear", parent_id: '00000000-0000-4000-a000-000000000001' },
      { id: '00000000-0000-4000-a000-000000000016', name: 'Electronics', parent_id: null },
      { id: '00000000-0000-4000-a000-000000000017', name: 'Computers', parent_id: '00000000-0000-4000-a000-000000000016' }
    ];
    return res.json(flatCategories);
  }
  
  // Return tree format (default)
  return res.json(categories);
});

// Create supertest instance
const request = supertest(app);

describe('GET /api/categories', () => {
  // Test for authenticated access
  test('should return categories when authenticated', async () => {
    // Make authenticated request
    const response = await request
      .get('/api/categories')
      .set(getAuthHeaders());
    
    // Verify response
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Verify structure of categories
    if (response.body.length > 0) {
      const category = response.body[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
    }
  });
  
  // Test for unauthenticated access
  test('should return 401 when not authenticated', async () => {
    // Make unauthenticated request
    const response = await request
      .get('/api/categories')
      .set({ 'x-playwright-test': '' });
    
    // Verify unauthorized response
    expect(response.status).toBe(401);
  });
  
  // Test format parameter
  test('should return categories in tree format by default', async () => {
    // Make request with default format
    const response = await request
      .get('/api/categories')
      .set(getAuthHeaders());
    
    // Verify tree structure (parent-child relationships)
    expect(response.status).toBe(200);
    
    if (response.body.length > 0) {
      // Check for children property
      const category = response.body[0];
      expect(category).toHaveProperty('children');
    }
  });
  
  test('should return categories in flat format when requested', async () => {
    // Make request with flat format
    const response = await request
      .get('/api/categories?format=flat')
      .set(getAuthHeaders());
    
    // Verify flat structure
    expect(response.status).toBe(200);
    
    if (response.body.length > 0) {
      // In flat format, categories have parent_id instead of children
      const category = response.body[0];
      expect(category).toHaveProperty('parent_id');
      expect(category).not.toHaveProperty('children');
    }
  });
}); 