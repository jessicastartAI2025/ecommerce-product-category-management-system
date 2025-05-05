#!/bin/bash

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# Check if required packages are installed
echo "Checking dependencies..."
pip install -r requirements/requirements.txt

# Run the FastAPI documentation server
echo "Starting FastAPI documentation server..."
cd requirements
uvicorn fastapi_docs:app --host 127.0.0.1 --port 8001 --reload

# Deactivate virtual environment when done
if [ -d "../.venv" ]; then
    deactivate
fi 