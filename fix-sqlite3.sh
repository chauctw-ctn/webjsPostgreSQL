#!/bin/bash
# Quick fix script - Run this if deployment still fails

echo "🔧 SQLite3 Deployment Fix"
echo "========================="
echo ""

# Option 1: Clear npm cache and rebuild
echo "Option 1: Clean rebuild"
echo "----------------------"
echo "rm -rf node_modules package-lock.json"
echo "npm install"
echo "npm rebuild --build-from-source sqlite3"
echo ""

# Option 2: Use pre-built binaries
echo "Option 2: Use pre-built binaries"
echo "--------------------------------"
echo "npm install sqlite3 --build-from-source"
echo ""

# Option 3: Specific version
echo "Option 3: Use stable version"
echo "---------------------------"
echo "npm uninstall sqlite3"
echo "npm install sqlite3@5.1.6 --build-from-source"
echo ""

# Test command
echo "Test SQLite3:"
echo "------------"
echo "node -e \"const sqlite3 = require('sqlite3').verbose(); console.log('SQLite3 OK:', sqlite3.VERSION);\""
