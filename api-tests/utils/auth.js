/**
 * Authentication utilities for API testing
 */

// For JWT generation (if needed)
const crypto = require('crypto');

/**
 * Generate a mock user ID for testing
 * @returns {string} A consistent test user ID
 */
function getTestUserId() {
  return 'test_user_id_12345';
}

/**
 * Get authentication headers for API requests
 * Using the x-playwright-test header that's already supported by the middleware
 * @returns {Object} Headers object with authentication
 */
function getAuthHeaders() {
  return {
    'x-playwright-test': 'true',
    'Content-Type': 'application/json'
  };
}

/**
 * Generate a mock JWT token for testing
 * Not used directly since we're using the x-playwright-test header,
 * but included for completeness
 * @returns {string} JWT token
 */
function generateMockJwt() {
  // Simple JWT structure (not cryptographically secure, just for testing)
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: getTestUserId(),
    name: 'Test User',
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  })).toString('base64');
  
  // Replace any + with -, / with _, and remove trailing =
  const signature = '';
  return `${header}.${payload}.${signature}`;
}

/**
 * Attach authentication headers to a supertest request
 * @param {Object} request Supertest request object
 * @returns {Object} Request with auth headers attached
 */
function attachAuthToRequest(request) {
  const headers = getAuthHeaders();
  Object.keys(headers).forEach(key => {
    request.set(key, headers[key]);
  });
  return request;
}

module.exports = {
  getTestUserId,
  getAuthHeaders,
  generateMockJwt,
  attachAuthToRequest
}; 