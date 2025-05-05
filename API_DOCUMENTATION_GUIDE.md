# API Documentation Guide

This guide explains how to use the FastAPI documentation for the E-Commerce Product Category Management System.

## Running the Documentation Server

1. Make sure you have Python 3.7+ installed
2. Run the documentation server:
   ```bash
   ./api-docs.sh
   ```
3. Open your browser and navigate to:
   - Swagger UI: [http://localhost:8001/docs](http://localhost:8001/docs)
   - ReDoc: [http://localhost:8001/redoc](http://localhost:8001/redoc)

## Using Swagger UI

The Swagger UI provides an interactive interface to explore and test the API:

1. **Authentication**: Click the "Authorize" button to authenticate with the API. For documentation purposes, any API key will work.

2. **Exploring Endpoints**: Endpoints are grouped by tags (e.g., "Categories", "Categories - Batch Operations"). Click on an endpoint to expand it.

3. **Testing Endpoints**: After expanding an endpoint:
   - Fill in the required parameters
   - Click "Execute" to see example responses
   - View response details including status codes, headers, and body

4. **Models**: Scroll down to see the API models section, which describes all request and response data structures in detail.

## Using ReDoc

ReDoc provides a more readable, documentation-focused view:

1. **Navigation**: Use the left sidebar to navigate between endpoints and models.

2. **Endpoint Details**: Click on an endpoint to see:
   - Description
   - Request parameters
   - Request body schema
   - Response examples for different status codes
   - Authentication requirements

3. **Models**: The "Schema Definitions" section at the bottom provides detailed information about all data models.

## Documentation Structure

The API documentation is organized into the following sections:

1. **Categories**: Basic CRUD operations for individual categories
   - GET /api/categories
   - GET /api/categories/{category_id}
   - POST /api/categories
   - PUT /api/categories/{category_id}
   - PATCH /api/categories/{category_id}
   - DELETE /api/categories/{category_id}

2. **Categories - Batch Operations**: Operations for working with the category tree
   - GET /api/categories/tree
   - PUT /api/categories/tree

## Notes

- This documentation is for reference only. The actual implementation is in Next.js API routes.
- While you can test the endpoints in Swagger UI, they return mock data and do not perform actual database operations.
- For real API testing, use the actual Next.js application endpoints. 