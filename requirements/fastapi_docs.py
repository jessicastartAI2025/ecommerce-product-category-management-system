from fastapi import FastAPI, HTTPException, Depends, status, Security, Path, Query
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import uvicorn
from datetime import datetime
from enum import Enum

# Initialize FastAPI app
app = FastAPI(
    title="E-Commerce Product Category Management API",
    description="""
    # E-Commerce Product Category Management API
    
    This API provides a complete solution for managing product categories in a hierarchical structure for e-commerce applications.
    
    ## Key Features
    
    * ✅ **Hierarchical Categories**: Create nested category structures with unlimited depth
    * ✅ **Batch Operations**: Save entire category trees in a single operation
    * ✅ **Individual CRUD**: Also supports individual category operations
    * ✅ **Clean RESTful Design**: Follows REST best practices
    * ✅ **Authentication**: Secured with Clerk authentication
    
    ## Tech Stack
    
    * **Backend**: Next.js API Routes (Node.js)
    * **Database**: Supabase (PostgreSQL)
    * **Authentication**: Clerk
    * **Documentation**: FastAPI (this document)
    
    ## Getting Started
    
    To use this API, you'll need to authenticate with Clerk and then make requests to the appropriate endpoints.
    
    """,
    version="1.0.0",
    contact={
        "name": "E-Commerce Category Management Team",
        "url": "https://github.com/yourusername/ecommerce-category-management",
    },
    license_info={
        "name": "MIT License",
    },
    docs_url=None,
    redoc_url=None,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use a simple API key header for authentication in documentation
API_KEY = "test_key"  # This is just for documentation purposes
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

# Define data models with more detailed documentation
class CategoryBase(BaseModel):
    """Base model for category data"""
    name: str = Field(
        ..., 
        description="Display name of the category",
        example="Electronics",
        min_length=1,
        max_length=100
    )

class CategoryCreate(CategoryBase):
    """Model for creating a new category"""
    parentId: Optional[str] = Field(
        default=None, 
        description="Parent category ID, null for root categories",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    order: Optional[int] = Field(
        default=0, 
        description="Sort order within the same level",
        example=0,
        ge=0
    )

class CategoryResponse(CategoryBase):
    """Response model for a single category"""
    id: str = Field(
        ..., 
        description="Unique UUID identifier for the category",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    parentId: Optional[str] = Field(
        default=None, 
        description="Parent category ID, null for root categories",
        example=None
    )
    order: int = Field(
        ..., 
        description="Sort order within siblings",
        example=0
    )
    createdAt: str = Field(
        ..., 
        description="ISO timestamp of creation time",
        example="2023-07-15T12:00:00Z"
    )
    updatedAt: str = Field(
        ..., 
        description="ISO timestamp of last update time",
        example="2023-07-15T12:00:00Z"
    )

class CategoryTreeNode(CategoryBase):
    """Hierarchical tree structure for categories"""
    id: str = Field(
        ..., 
        description="Unique UUID identifier for the category",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    children: List['CategoryTreeNode'] = Field(
        default=[], 
        description="Child categories"
    )

# Needed for the recursive model
CategoryTreeNode.update_forward_refs()

class CategoryUpdate(BaseModel):
    """Model for updating an existing category"""
    name: Optional[str] = Field(
        default=None, 
        description="Display name of the category",
        example="Updated Electronics",
        min_length=1,
        max_length=100
    )
    parentId: Optional[str] = Field(
        default=None, 
        description="Parent category ID, null for root categories",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    order: Optional[int] = Field(
        default=None, 
        description="Sort order within siblings",
        example=1,
        ge=0
    )

class CategoryPatch(BaseModel):
    """Model for partial updates to a category"""
    name: Optional[str] = Field(
        default=None, 
        description="Display name of the category (optional)",
        example="Renamed Category",
        min_length=1,
        max_length=100
    )
    parentId: Optional[str] = Field(
        default=None, 
        description="Parent category ID (optional)",
        example="550e8400-e29b-41d4-a716-446655440000"
    )
    order: Optional[int] = Field(
        default=None, 
        description="Sort order within siblings (optional)",
        example=2,
        ge=0
    )

class TreeSaveResponse(BaseModel):
    """Response for tree save operations"""
    created: List[str] = Field(
        ..., 
        description="IDs of newly created categories",
        example=["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]
    )
    updated: List[str] = Field(
        ..., 
        description="IDs of updated categories",
        example=["550e8400-e29b-41d4-a716-446655440000"]
    )
    deleted: List[str] = Field(
        ..., 
        description="IDs of deleted categories",
        example=["550e8400-e29b-41d4-a716-446655440003"]
    )

class DeleteResponse(BaseModel):
    """Response for delete operations"""
    success: bool = Field(
        ..., 
        description="Whether the operation was successful",
        example=True
    )
    deleted: str = Field(
        ..., 
        description="ID of the deleted category",
        example="550e8400-e29b-41d4-a716-446655440003"
    )
    hasChildren: bool = Field(
        ..., 
        description="Whether the deleted category had children",
        example=False
    )
    childCount: int = Field(
        ..., 
        description="Number of child categories affected",
        example=0
    )

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(
        ..., 
        description="Error message",
        example="Failed to save categories"
    )
    details: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Additional error details if available",
        example={
            "code": "22P02",
            "message": "invalid input syntax for type uuid"
        }
    )

class FormatEnum(str, Enum):
    """Format options for category retrieval"""
    TREE = "tree"
    FLAT = "flat"

# Authentication dependency
async def get_current_user(api_key: str = Security(api_key_header)):
    """Simulates Clerk authentication for documentation purposes"""
    # This is just for documentation - any key will work
    # In a real app, we would validate the API key
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"userId": "user_2wUsqGRXsrr3oD5dsS8zJtGNXN4"}

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add Bearer auth to all paths
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [])
            method["security"].append({"APIKeyHeader": []})
    
    # Add security scheme
    openapi_schema["components"].setdefault("securitySchemes", {})
    openapi_schema["components"]["securitySchemes"]["APIKeyHeader"] = {
        "type": "apiKey",
        "in": "header",
        "name": "Authorization",
        "description": "Clerk authorization token with 'Bearer ' prefix"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Custom docs endpoints
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=app.title + " - Swagger UI",
        oauth2_redirect_url="/docs/oauth2-redirect",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
        swagger_favicon_url="/favicon.ico"
    )

@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url="/openapi.json",
        title=app.title + " - ReDoc",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
        redoc_favicon_url="/favicon.ico"
    )

# API endpoints with tags
@app.get(
    "/api/categories", 
    response_model=Union[List[CategoryTreeNode], List[CategoryResponse]],
    responses={
        200: {
            "description": "Successfully retrieved categories",
            "content": {
                "application/json": {
                    "examples": {
                        "tree": {
                            "summary": "Tree Structure",
                            "value": [
                                {
                                    "id": "550e8400-e29b-41d4-a716-446655440000",
                                    "name": "Electronics",
                                    "children": [
                                        {
                                            "id": "550e8400-e29b-41d4-a716-446655440001",
                                            "name": "Phones",
                                            "children": []
                                        },
                                        {
                                            "id": "550e8400-e29b-41d4-a716-446655440002",
                                            "name": "Laptops",
                                            "children": []
                                        }
                                    ]
                                },
                                {
                                    "id": "550e8400-e29b-41d4-a716-446655440003",
                                    "name": "Clothing",
                                    "children": []
                                }
                            ]
                        },
                        "flat": {
                            "summary": "Flat Structure",
                            "value": [
                                {
                                    "id": "550e8400-e29b-41d4-a716-446655440000",
                                    "name": "Electronics",
                                    "parentId": None,
                                    "order": 0,
                                    "createdAt": "2023-07-15T12:00:00Z",
                                    "updatedAt": "2023-07-15T12:00:00Z"
                                },
                                {
                                    "id": "550e8400-e29b-41d4-a716-446655440001",
                                    "name": "Phones",
                                    "parentId": "550e8400-e29b-41d4-a716-446655440000",
                                    "order": 0,
                                    "createdAt": "2023-07-15T12:00:00Z",
                                    "updatedAt": "2023-07-15T12:00:00Z"
                                }
                            ]
                        }
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized request",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    },
    summary="Get all categories",
    description="Retrieves categories for the authenticated user. Default format is tree structure.",
    tags=["Categories"]
)
async def get_categories(
    format: Optional[FormatEnum] = Query(None, description="Format for the response: 'tree' (default) or 'flat'"),
    current_user = Depends(get_current_user)
):
    """
    Retrieves all categories for the authenticated user.
    
    - **tree format**: Returns a hierarchical nested structure (default)
    - **flat format**: Returns a flat list with parent references
    """
    # This is mock data for documentation purposes
    if format == FormatEnum.FLAT:
        # Return flat list
        return [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Electronics",
                "parentId": None,
                "order": 0,
                "createdAt": "2023-07-15T12:00:00Z",
                "updatedAt": "2023-07-15T12:00:00Z"
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "name": "Phones",
                "parentId": "550e8400-e29b-41d4-a716-446655440000",
                "order": 0,
                "createdAt": "2023-07-15T12:00:00Z",
                "updatedAt": "2023-07-15T12:00:00Z"
            }
        ]
    else:
        # Return tree structure (default)
        return [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Electronics",
                "children": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440001",
                        "name": "Phones",
                        "children": []
                    },
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440002",
                        "name": "Laptops",
                        "children": []
                    }
                ]
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440003",
                "name": "Clothing",
                "children": []
            }
        ]

@app.get(
    "/api/categories/tree",
    response_model=List[CategoryTreeNode],
    responses={
        200: {
            "description": "Successfully retrieved category tree",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "name": "Electronics",
                            "children": [
                                {
                                    "id": "550e8400-e29b-41d4-a716-446655440001",
                                    "name": "Phones",
                                    "children": []
                                }
                            ]
                        }
                    ]
                }
            }
        },
        401: {
            "description": "Unauthorized request",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    },
    summary="Get category tree",
    description="Retrieves the hierarchical tree structure of categories for the authenticated user.",
    tags=["Categories"]
)
async def get_category_tree(current_user = Depends(get_current_user)):
    """
    Retrieves the hierarchical tree structure of categories.
    
    This is a shortcut for the `/api/categories?format=tree` endpoint.
    """
    # This is mock data for documentation purposes
    return [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Electronics",
            "children": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440001",
                    "name": "Phones",
                    "children": []
                }
            ]
        },
        {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "name": "Clothing",
            "children": []
        }
    ]

@app.get(
    "/api/categories/{category_id}",
    response_model=CategoryResponse,
    responses={
        200: {
            "description": "Successfully retrieved category",
            "model": CategoryResponse
        },
        401: {
            "description": "Unauthorized request",
            "model": ErrorResponse
        },
        404: {
            "description": "Category not found",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": "Category not found",
                        "details": {
                            "category_id": "550e8400-e29b-41d4-a716-446655440999"
                        }
                    }
                }
            }
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    },
    summary="Get category by ID",
    description="Retrieves a specific category by ID.",
    tags=["Categories"]
)
async def get_category(
    category_id: str = Path(..., description="The ID of the category to retrieve"),
    current_user = Depends(get_current_user)
):
    """
    Retrieves a specific category by ID.
    
    Returns all details for a single category, including:
    - Basic information (name, ID)
    - Hierarchy information (parentId)
    - Metadata (order, timestamps)
    """
    # This is mock data for documentation purposes
    return {
        "id": category_id,
        "name": "Sample Category",
        "parentId": None,
        "order": 0,
        "createdAt": "2023-07-15T12:00:00Z",
        "updatedAt": "2023-07-15T12:00:00Z"
    }

@app.post(
    "/api/categories", 
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Category successfully created",
            "model": CategoryResponse
        },
        400: {
            "description": "Invalid request data",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "error": "Invalid category data",
                        "details": {
                            "name": "field required"
                        }
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized request",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    },
    summary="Create a new category",
    description="Creates a new category with the provided data.",
    tags=["Categories"]
)
async def create_category(
    category: CategoryCreate,
    current_user = Depends(get_current_user)
):
    """
    Creates a new category.
    
    Automatically:
    - Generates a UUID for the new category
    - Sets creation and update timestamps
    - Associates the category with the authenticated user
    """
    # This is mock data for documentation purposes
    now = datetime.now().isoformat() + "Z"
    return {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": category.name,
        "parentId": category.parentId,
        "order": category.order or 0,
        "createdAt": now,
        "updatedAt": now
    }

@app.put(
    "/api/categories/tree", 
    response_model=TreeSaveResponse,
    responses={
        200: {
            "description": "Categories successfully saved",
            "model": TreeSaveResponse
        },
        400: {
            "description": "Invalid request data",
            "model": ErrorResponse
        },
        401: {
            "description": "Unauthorized request",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    },
    summary="Save entire category tree",
    description="Saves the entire hierarchical category structure for the authenticated user. This replaces all existing categories with the new structure.",
    tags=["Categories - Batch Operations"]
)
async def save_category_tree(
    categories: List[CategoryTreeNode],
    current_user = Depends(get_current_user)
):
    """
    Saves the entire hierarchical category structure in a single operation.
    
    This is a powerful batch operation that:
    1. Creates new categories not present in the database
    2. Updates existing categories that have changed
    3. Deletes categories not present in the new structure
    
    Returns detailed information about what categories were affected.
    """
    # This is mock data for documentation purposes
    return {
        "created": ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
        "updated": ["550e8400-e29b-41d4-a716-446655440000"],
        "deleted": ["550e8400-e29b-41d4-a716-446655440003"]
    }

@app.put(
    "/api/categories/{category_id}", 
    response_model=CategoryResponse,
    responses={
        200: {
            "description": "Category successfully updated",
            "model": CategoryResponse
        },
        400: {
            "description": "Invalid request data",
            "model": ErrorResponse
        },
        401: {
            "description": "Unauthorized request",
            "model": ErrorResponse
        },
        404: {
            "description": "Category not found",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    },
    summary="Update a category",
    description="Updates a category with the provided data.",
    tags=["Categories"]
)
async def update_category(
    category_id: str = Path(..., description="The ID of the category to update"),
    category: CategoryUpdate = None,
    current_user = Depends(get_current_user)
):
    """
    Updates a category with the provided data.
    
    This is a full update operation - all specified fields will be updated.
    For partial updates, use the PATCH endpoint instead.
    """
    # This is mock data for documentation purposes
    return {
        "id": category_id,
        "name": category.name or "Updated Category",
        "parentId": category.parentId,
        "order": category.order or 0,
        "createdAt": "2023-07-15T12:00:00Z",
        "updatedAt": datetime.now().isoformat() + "Z"
    }

@app.patch(
    "/api/categories/{category_id}", 
    response_model=CategoryResponse,
    responses={
        200: {
            "description": "Category successfully patched",
            "model": CategoryResponse
        },
        400: {
            "description": "Invalid request data",
            "model": ErrorResponse
        },
        401: {
            "description": "Unauthorized request",
            "model": ErrorResponse
        },
        404: {
            "description": "Category not found",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    },
    summary="Partially update a category",
    description="Partially updates a category with the provided data.",
    tags=["Categories"]
)
async def patch_category(
    category_id: str = Path(..., description="The ID of the category to patch"),
    patch: CategoryPatch = None,
    current_user = Depends(get_current_user)
):
    """
    Partially updates a category with the provided data.
    
    Only the fields specified in the request will be updated.
    Other fields will remain unchanged.
    """
    # This is mock data for documentation purposes
    return {
        "id": category_id,
        "name": patch.name or "Patched Category",
        "parentId": patch.parentId if patch.parentId is not None else None,
        "order": patch.order or 1,
        "createdAt": "2023-07-15T12:00:00Z",
        "updatedAt": datetime.now().isoformat() + "Z"
    }

@app.delete(
    "/api/categories/{category_id}", 
    response_model=DeleteResponse,
    responses={
        200: {
            "description": "Category successfully deleted",
            "model": DeleteResponse
        },
        401: {
            "description": "Unauthorized request",
            "model": ErrorResponse
        },
        404: {
            "description": "Category not found",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    },
    summary="Delete a category",
    description="Deletes a category by ID.",
    tags=["Categories"]
)
async def delete_category(
    category_id: str = Path(..., description="The ID of the category to delete"),
    current_user = Depends(get_current_user)
):
    """
    Deletes a category by ID.
    
    Returns information about:
    - Whether the operation was successful
    - The ID of the deleted category
    - Whether the category had children
    - How many children were affected
    """
    # This is mock data for documentation purposes
    return {
        "success": True,
        "deleted": category_id,
        "hasChildren": False,
        "childCount": 0
    }

# Run the application
if __name__ == "__main__":
    uvicorn.run("fastapi_docs:app", host="127.0.0.1", port=8001, reload=True) 