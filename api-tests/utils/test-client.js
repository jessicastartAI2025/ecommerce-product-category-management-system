/**
 * API test client for making authenticated requests
 */

const supertest = require('supertest');
const { getAuthHeaders } = require('./auth');

// Base URL from environment or default to localhost
const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

// Add debugging
const DEBUG = process.env.DEBUG_TESTS === 'true';

/**
 * Create a supertest request with authentication headers
 */
function createAuthenticatedRequest() {
  const agent = supertest(baseUrl);
  return agent;
}

/**
 * Helper for making GET requests
 * @param {string} path API path
 * @param {Object} customHeaders Optional custom headers
 * @returns {Promise} Supertest request
 */
async function get(path, customHeaders = {}) {
  const headers = { ...getAuthHeaders(), ...customHeaders };
  const request = createAuthenticatedRequest()
    .get(path);
  
  // Attach all headers
  Object.keys(headers).forEach(key => {
    request.set(key, headers[key]);
  });
  
  try {
    if (DEBUG) {
      console.log(`Sending GET ${path} with headers:`, headers);
    }
    
    const response = await request;
    
    if (DEBUG) {
      console.log(`GET ${path} Response:`, {
        status: response.status,
        body: response.body 
      });
    }
    
    return response;
  } catch (error) {
    console.error(`Error in GET ${path}:`, error);
    throw error;
  }
}

/**
 * Helper for making POST requests
 * @param {string} path API path
 * @param {Object} data Request body
 * @param {Object} customHeaders Optional custom headers
 * @returns {Promise} Supertest request
 */
async function post(path, data, customHeaders = {}) {
  const headers = { ...getAuthHeaders(), ...customHeaders };
  const request = createAuthenticatedRequest()
    .post(path)
    .send(data);
  
  // Attach all headers
  Object.keys(headers).forEach(key => {
    request.set(key, headers[key]);
  });
  
  try {
    if (DEBUG) {
      console.log(`Sending POST ${path} with:`, { headers, data });
    }
    
    const response = await request;
    
    if (DEBUG) {
      console.log(`POST ${path} Response:`, {
        status: response.status,
        body: response.body
      });
    }
    
    return response;
  } catch (error) {
    console.error(`Error in POST ${path}:`, error);
    throw error;
  }
}

/**
 * Helper for making PUT requests
 * @param {string} path API path
 * @param {Object} data Request body
 * @param {Object} customHeaders Optional custom headers
 * @returns {Promise} Supertest request
 */
async function put(path, data, customHeaders = {}) {
  const headers = { ...getAuthHeaders(), ...customHeaders };
  const request = createAuthenticatedRequest()
    .put(path)
    .send(data);
  
  // Attach all headers
  Object.keys(headers).forEach(key => {
    request.set(key, headers[key]);
  });
  
  try {
    if (DEBUG) {
      console.log(`Sending PUT ${path} with:`, { headers, data });
    }
    
    const response = await request;
    
    if (DEBUG) {
      console.log(`PUT ${path} Response:`, {
        status: response.status,
        body: response.body
      });
    }
    
    return response;
  } catch (error) {
    console.error(`Error in PUT ${path}:`, error);
    throw error;
  }
}

/**
 * Helper for making DELETE requests
 * @param {string} path API path
 * @param {Object} customHeaders Optional custom headers
 * @returns {Promise} Supertest request
 */
async function del(path, customHeaders = {}) {
  const headers = { ...getAuthHeaders(), ...customHeaders };
  const request = createAuthenticatedRequest()
    .delete(path);
  
  // Attach all headers
  Object.keys(headers).forEach(key => {
    request.set(key, headers[key]);
  });
  
  try {
    if (DEBUG) {
      console.log(`Sending DELETE ${path} with headers:`, headers);
    }
    
    const response = await request;
    
    if (DEBUG) {
      console.log(`DELETE ${path} Response:`, {
        status: response.status,
        body: response.body
      });
    }
    
    return response;
  } catch (error) {
    console.error(`Error in DELETE ${path}:`, error);
    throw error;
  }
}

module.exports = {
  get,
  post,
  put,
  del,
  createAuthenticatedRequest,
}; 