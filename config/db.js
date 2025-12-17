/**
 * Database Configuration
 * MongoDB connection setup for ApplyBotX
 */

const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connect to MongoDB database
 * @returns {Promise} Connection promise
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️  Server will start without database. Some features may be limited.');
    return null;
  }
};

module.exports = connectDB;
