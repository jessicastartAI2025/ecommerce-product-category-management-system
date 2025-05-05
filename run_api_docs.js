#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine if we should use shell scripts or not based on platform
const isWindows = process.platform === 'win32';

console.log('Starting API Documentation Server...');
console.log('-------------------------------------');
console.log('The interactive API documentation will be available at:');
console.log('Swagger UI: http://localhost:8001/docs');
console.log('ReDoc: http://localhost:8001/redoc');
console.log('-------------------------------------');
console.log('Press Ctrl+C to stop the server');
console.log('');

// Function to check if Python is installed
function checkPython() {
  try {
    const pythonCmd = isWindows ? 'python' : 'python3';
    const result = require('child_process').spawnSync(pythonCmd, ['--version']);
    if (result.status === 0) {
      return pythonCmd;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Function to run the documentation server
function runDocServer() {
  const pythonCmd = checkPython();
  
  if (!pythonCmd) {
    console.error('Python 3.7+ is required to run the API documentation server.');
    console.error('Please install Python from https://www.python.org/downloads/');
    process.exit(1);
  }

  let cmd;
  let args;
  
  if (isWindows) {
    // On Windows, run commands directly
    cmd = pythonCmd;
    args = ['-m', 'uvicorn', 'requirements.fastapi_docs:app', '--host', '127.0.0.1', '--port', '8001', '--reload'];
  } else {
    // On Unix-like systems, run the shell script
    const scriptPath = path.join(__dirname, 'api-docs.sh');
    if (fs.existsSync(scriptPath)) {
      cmd = '/bin/bash';
      args = [scriptPath];
    } else {
      console.error('Could not find api-docs.sh script.');
      process.exit(1);
    }
  }

  const child = spawn(cmd, args, { 
    stdio: 'inherit',
    shell: isWindows
  });

  child.on('error', (error) => {
    console.error(`Error starting documentation server: ${error.message}`);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('\nStopping API documentation server...');
    child.kill('SIGINT');
    process.exit(0);
  });
}

runDocServer(); 