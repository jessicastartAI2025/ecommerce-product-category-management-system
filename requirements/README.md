# FastAPI Documentation for E-Commerce Product Category Management

This directory contains the FastAPI implementation that serves as interactive API documentation for the E-Commerce Product Category Management System.

## Overview

The FastAPI implementation provides a comprehensive documentation of the API endpoints with the following features:

- Interactive Swagger UI documentation
- ReDoc alternative documentation
- Detailed request/response models
- Authentication flow examples
- Example API responses
- OpenAPI/Swagger compatibility

## Running the Documentation Server

From the project root, run:

```bash
./api-docs.sh
```

Or manually:

```bash
# Activate virtual environment (if using one)
source .venv/bin/activate

# Install dependencies
pip install -r requirements/requirements.txt

# Run FastAPI server
cd requirements
uvicorn fastapi_docs:app --host 127.0.0.1 --port 8001 --reload
```

## Documentation URLs

- Swagger UI: [http://localhost:8001/docs](http://localhost:8001/docs)
- ReDoc: [http://localhost:8001/redoc](http://localhost:8001/redoc)

## Note About Implementation

This FastAPI implementation is used exclusively for documentation purposes and doesn't implement the actual API functionality. The real API is implemented using Next.js API routes. This approach provides superior interactive documentation with request/response examples while maintaining the production API in the Next.js codebase.

## Dependencies

- FastAPI
- Uvicorn
- Pydantic

These dependencies are listed in `requirements.txt` in this directory. 