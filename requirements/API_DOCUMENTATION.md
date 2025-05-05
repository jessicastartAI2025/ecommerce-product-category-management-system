# E-Commerce Product Category Management API Documentation

## API Overview

This document provides comprehensive documentation for the RESTful API endpoints of the E-commerce Product Category Management System, built with Next.js, Clerk for authentication, and Supabase for database storage.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All API endpoints are protected with Clerk authentication. You must be authenticated to access any endpoint. The system uses Clerk middleware to validate requests.

## Data Models

### CategoryResponse

```typescript
{
  id: string;              // UUID format
  name: string;            // Required
  parentId: string | null; // Null for root categories
  order: number;           // Sort order within siblings
  createdAt: string;       // ISO date string
  updatedAt: string;       // ISO date string
}
```

### CategoryTree

```typescript
{
  id: string;           // UUID format
  name: string;         // Required
  children: CategoryTree[]; // Recursive structure for hierarchy
}
```

## Endpoints

### Category Management

#### `GET /api/categories`

Retrieves categories for the authenticated user.

- **Query Parameters**:
  - `format`: Optional format parameter ('tree' or 'flat'). Default is 'tree'.

- **Response (Tree Format):**
  ```json
  [
    {
      "id": "00000000-0000-4000-a000-000000000001",
      "name": "Clothing",
      "children": [
        {
          "id": "00000000-0000-4000-a000-000000000002",
          "name": "Men's Wear",
          "children": []
        }
      ]
    }
  ]
  ```

- **Response (Flat Format):**
  ```json
  [
    {
      "id": "00000000-0000-4000-a000-000000000001",
      "name": "Clothing",
      "parentId": null,
      "order": 0,
      "createdAt": "2023-07-15T12:00:00Z",
      "updatedAt": "2023-07-15T12:00:00Z"
    },
    {
      "id": "00000000-0000-4000-a000-000000000002",
      "name": "Men's Wear",
      "parentId": "00000000-0000-4000-a000-000000000001",
      "order": 0,
      "createdAt": "2023-07-15T12:00:00Z",
      "updatedAt": "2023-07-15T12:00:00Z"
    }
  ]
  ```

#### `GET /api/categories/tree`

Retrieves the hierarchical tree structure of categories.

- **Response:**
  ```json
  [
    {
      "id": "00000000-0000-4000-a000-000000000001",
      "name": "Clothing",
      "children": [
        {
          "id": "00000000-0000-4000-a000-000000000002",
          "name": "Men's Wear",
          "children": []
        }
      ]
    }
  ]
  ```

#### `GET /api/categories/:id`

Retrieves a specific category by ID.

- **Path Parameters**:
  - `id`: UUID of the category

- **Response:**
  ```json
  {
    "id": "00000000-0000-4000-a000-000000000001",
    "name": "Clothing",
    "parentId": null,
    "order": 0,
    "createdAt": "2023-07-15T12:00:00Z",
    "updatedAt": "2023-07-15T12:00:00Z"
  }
  ```

#### `POST /api/categories`

Creates a new category.

- **Request Body:**
  ```json
  {
    "name": "New Category",
    "parentId": "00000000-0000-4000-a000-000000000001", // Optional
    "order": 1 // Optional
  }
  ```

- **Response:**
  ```json
  {
    "id": "00000000-0000-4000-a000-000000000099",
    "name": "New Category",
    "parentId": "00000000-0000-4000-a000-000000000001",
    "order": 1,
    "createdAt": "2023-07-15T12:00:00Z",
    "updatedAt": "2023-07-15T12:00:00Z"
  }
  ```

#### `PUT /api/categories/tree`

Saves the entire category structure, replacing all existing categories.

- **Request Body:**
  ```json
  [
    {
      "id": "00000000-0000-4000-a000-000000000001",
      "name": "Clothing",
      "children": [
        {
          "id": "00000000-0000-4000-a000-000000000002",
          "name": "Men's Wear",
          "children": []
        }
      ]
    }
  ]
  ```

- **Response:**
  ```json
  {
    "created": ["00000000-0000-4000-a000-000000000099"],
    "updated": ["00000000-0000-4000-a000-000000000001"],
    "deleted": ["00000000-0000-4000-a000-000000000003"]
  }
  ```

#### `PUT /api/categories/:id`

Updates a category completely.

- **Path Parameters**:
  - `id`: UUID of the category

- **Request Body:**
  ```json
  {
    "name": "Updated Category",
    "parentId": "00000000-0000-4000-a000-000000000001",
    "order": 2
  }
  ```

- **Response:**
  ```json
  {
    "id": "00000000-0000-4000-a000-000000000002",
    "name": "Updated Category",
    "parentId": "00000000-0000-4000-a000-000000000001",
    "order": 2,
    "createdAt": "2023-07-15T12:00:00Z",
    "updatedAt": "2023-07-16T14:30:00Z"
  }
  ```

#### `PATCH /api/categories/:id`

Partially updates a category.

- **Path Parameters**:
  - `id`: UUID of the category

- **Request Body:**
  ```json
  {
    "name": "Renamed Category" // Only fields to update
  }
  ```

- **Response:**
  ```json
  {
    "id": "00000000-0000-4000-a000-000000000002",
    "name": "Renamed Category",
    "parentId": "00000000-0000-4000-a000-000000000001",
    "order": 2,
    "createdAt": "2023-07-15T12:00:00Z",
    "updatedAt": "2023-07-16T15:45:00Z"
  }
  ```

#### `DELETE /api/categories/:id`

Deletes a category.

- **Path Parameters**:
  - `id`: UUID of the category

- **Response:**
  ```json
  {
    "success": true,
    "deleted": "00000000-0000-4000-a000-000000000002",
    "hasChildren": false,
    "childCount": 0
  }
  ```

## Error Responses

All endpoints follow a standard error response format:

```json
{
  "error": "Error message",
  "details": { // Optional additional details
    "code": "ERROR_CODE",
    "message": "Detailed error description"
  }
}
```

### Common HTTP Status Codes

- **200 OK**: Request succeeded
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Implementation Notes

1. **UUIDs**: All category IDs use UUID v4 format
2. **Timestamps**: All timestamps use ISO 8601 format with UTC timezone
3. **Hierarchical Structure**: Categories can have unlimited nesting levels
4. **Compatibility**: The API is designed to work with the existing UI component while providing enhanced RESTful capabilities 