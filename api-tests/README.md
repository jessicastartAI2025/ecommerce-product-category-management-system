# API Testing Framework

This directory contains API tests for the e-commerce product category management system.

## Overview

The tests are designed to validate the API endpoints using a mock server approach, which allows tests to run independently without requiring the actual backend server to be running.

## Directory Structure

```
api-tests/
├── __tests__/            # Test files
│   └── categories/       # Tests for category endpoints
│       ├── create-category.test.js
│       ├── delete-category.test.js
│       ├── get-categories.test.js
│       └── update-category.test.js
├── fixtures/             # Test data
│   └── categories.js     # Category fixtures
├── utils/                # Testing utilities
│   ├── auth.js           # Authentication helpers
│   ├── test-client.js    # Wrapper for supertest
│   └── test-database.js  # In-memory database mock
├── setup.js              # Jest setup file
└── README.md             # This file
```

## Testing Approach

We use the following approach for API testing:

1. **Mock Server:** Each test file sets up a mock Express server with route handlers that simulate the behavior of the real API.

2. **Independent Tests:** Tests don't require the actual backend to be running, which makes them fast and reliable.

3. **Authentication Simulation:** We simulate authentication by using custom headers that would normally be processed by Clerk.

4. **Test Data Separation:** Test fixtures are kept separate from test logic for better maintainability.

## Running Tests

To run all API tests:

```bash
npm test
```

To run a specific test file:

```bash
npm test -- api-tests/__tests__/categories/get-categories.test.js
```

To run with debug output:

```bash
DEBUG_TESTS=true npm test
```

## Mock Server vs. Real API Testing

We've implemented two approaches:

1. **Mock Server (Current):** Each test file creates its own Express server that mimics API behavior.
   - Pros: Tests run independently, no need for a real server, fast execution
   - Cons: Tests might not catch real integration issues

2. **Real API Testing (Alternative):** Using supertest to make real HTTP requests.
   - Pros: Tests against the real API, catches integration issues
   - Cons: Requires the server to be running, tests are slower
   
To enable real API testing, you would need to:
   1. Update the middleware.ts file to handle the test authentication headers
   2. Use the test-client.js utilities instead of the mock server
   3. Set up test database cleaning between test runs

## Adding New Tests

To add a new test file:

1. Create a new file in the appropriate subdirectory of `__tests__/`
2. Import the necessary utilities from `utils/`
3. Set up a mock Express server for the endpoints you want to test
4. Write tests using Jest's test functions

Example:

```javascript
const { getAuthHeaders } = require('../../utils/auth');
const supertest = require('supertest');
const express = require('express');

// Setup a mock Express server for testing
const app = express();

// Define your mock endpoints
app.get('/api/your-endpoint', (req, res) => {
  // Add authentication check
  const isAuthenticated = req.headers['x-playwright-test'] === 'true';
  
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Return mock response
  return res.json({ data: 'Your mock data' });
});

// Helper function for making test requests
async function request() {
  return supertest(app);
}

// Write your tests
describe('GET /api/your-endpoint', () => {
  test('should return data when authenticated', async () => {
    const response = await request()
      .get('/api/your-endpoint')
      .set(getAuthHeaders());
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
}); 