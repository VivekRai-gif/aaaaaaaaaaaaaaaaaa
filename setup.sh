#!/bin/bash

# ApplyBotX - Unix/Linux/macOS Setup Script
# This script helps set up the project automatically

echo "========================================"
echo "   ApplyBotX - Automated Setup"
echo "========================================"
echo

# Check if Node.js is installed
echo "[1/5] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please download and install Node.js from: https://nodejs.org/"
    exit 1
fi
echo "Node.js is installed."
node --version
echo

# Check if MongoDB is installed
echo "[2/5] Checking MongoDB installation..."
if ! command -v mongod &> /dev/null; then
    echo "WARNING: MongoDB may not be installed or not in PATH"
    echo "Please ensure MongoDB is installed from: https://www.mongodb.com/try/download/community"
    echo
else
    echo "MongoDB is installed."
fi

# Install npm dependencies
echo "[3/5] Installing npm dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi
echo "Dependencies installed successfully."
echo

# Check if .env file exists
echo "[4/5] Checking environment configuration..."
if [ -f .env ]; then
    echo ".env file already exists."
else
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ".env file created! Please edit it with your credentials."
    echo
    echo "IMPORTANT: You need to configure:"
    echo "  - OPENAI_API_KEY (from https://platform.openai.com/api-keys)"
    echo "  - GMAIL_USER (your Gmail address)"
    echo "  - GMAIL_APP_PASSWORD (from https://myaccount.google.com/apppasswords)"
    echo
fi

# Create uploads directory
echo "[5/5] Creating uploads directory..."
mkdir -p uploads
echo "Uploads directory ready."
echo

echo "========================================"
echo "   Setup Complete!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Start MongoDB (brew services start mongodb-community or sudo systemctl start mongod)"
echo "3. Run: npm start"
echo "4. Open: http://localhost:5000"
echo
echo "For detailed instructions, see SETUP_GUIDE.md"
echo
