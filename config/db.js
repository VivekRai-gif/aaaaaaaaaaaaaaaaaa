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
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
