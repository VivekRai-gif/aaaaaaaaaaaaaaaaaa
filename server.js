/**
 * ApplyBotX - Main Server File
 * AI-Powered Job Application Automation System
 * 
 * Author: [Your Name]
 * B.Tech CSE 3rd Year - Mini Project
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import configurations and routes
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const { verifyEmailConfig } = require('./services/emailService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static('public')); // Serve static files from public directory

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('✅ Created uploads directory');
}

// API Routes
app.use('/api', apiRoutes);

// Root route - serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 10MB.',
    });
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  
  // Generic error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/**
 * Start server function
 * Initializes database and starts Express server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Verify email configuration
    await verifyEmailConfig();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 ApplyBotX Server Started Successfully!');
      console.log('='.repeat(50));
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API Endpoint: http://localhost:${PORT}/api`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

module.exports = app;
