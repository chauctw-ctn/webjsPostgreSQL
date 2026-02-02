#!/bin/bash

# Render deployment script
echo "🚀 Starting deployment build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Rebuild sqlite3 for Linux
echo "🔨 Rebuilding sqlite3 for Linux..."
npm rebuild --build-from-source sqlite3

# Verify sqlite3 installation
echo "✅ Verifying sqlite3..."
node -e "const sqlite3 = require('sqlite3'); console.log('SQLite3 version:', sqlite3.VERSION);"

echo "✅ Build completed successfully!"
