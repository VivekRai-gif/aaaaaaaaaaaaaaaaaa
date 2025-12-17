@echo off
REM ApplyBotX - Windows Setup Script
REM This script helps set up the project automatically

echo ========================================
echo    ApplyBotX - Automated Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed.
node --version
echo.

REM Check if MongoDB is installed
echo [2/5] Checking MongoDB installation...
where mongod >nul 2>&1
if errorlevel 1 (
    echo WARNING: MongoDB may not be installed or not in PATH
    echo Please ensure MongoDB is installed from: https://www.mongodb.com/try/download/community
    echo.
) else (
    echo MongoDB is installed.
)

REM Install npm dependencies
echo [3/5] Installing npm dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo Dependencies installed successfully.
echo.

REM Check if .env file exists
echo [4/5] Checking environment configuration...
if exist .env (
    echo .env file already exists.
) else (
    echo Creating .env file from template...
    copy .env.example .env >nul
    echo .env file created! Please edit it with your credentials.
    echo.
    echo IMPORTANT: You need to configure:
    echo   - OPENAI_API_KEY (from https://platform.openai.com/api-keys)
    echo   - GMAIL_USER (your Gmail address)
    echo   - GMAIL_APP_PASSWORD (from https://myaccount.google.com/apppasswords)
    echo.
)

REM Create uploads directory
echo [5/5] Creating uploads directory...
if not exist uploads mkdir uploads
echo Uploads directory ready.
echo.

echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file with your API keys
echo 2. Start MongoDB (net start MongoDB)
echo 3. Run: npm start
echo 4. Open: http://localhost:5000
echo.
echo For detailed instructions, see SETUP_GUIDE.md
echo.
pause
