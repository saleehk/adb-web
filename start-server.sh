#!/bin/bash

# Ensure we're in the project directory
cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the project if needed
if [ ! -d ".next" ]; then
    echo "Building the project..."
    npm run build
fi

# Start the Next.js server
echo "Starting Next.js server..."
npm run start 