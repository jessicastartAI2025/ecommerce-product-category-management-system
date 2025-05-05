/**
 * Jest setup file for API tests
 * 
 * This file runs before all tests and sets up the test environment
 */

// Set up global test timeout
jest.setTimeout(10000);

// Set up environment variable defaults for testing
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  DEBUG_TESTS: process.env.DEBUG_TESTS || 'false'
};

// Global beforeAll hook
beforeAll(() => {
  // Log test environment info when debug is enabled
  if (process.env.DEBUG_TESTS === 'true') {
    console.log('Starting API tests with configuration:');
    console.log('- API_BASE_URL:', process.env.API_BASE_URL);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
  }
});

// Global afterAll hook
afterAll(() => {
  if (process.env.DEBUG_TESTS === 'true') {
    console.log('Completed all API tests');
  }
});

// Optional: Add custom Jest matchers if needed
expect.extend({
  toBeSuccessResponse(received) {
    const pass = received.status >= 200 && received.status < 300;
    return {
      pass,
      message: () => `expected response status ${received.status} to ${pass ? 'not ' : ''}be a success status code`,
    };
  },
}); 