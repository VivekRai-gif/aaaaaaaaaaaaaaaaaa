/**
 * Email Configuration
 * Gmail SMTP setup using Nodemailer
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Check if email credentials are properly configured
 * @returns {Boolean} True if credentials are valid
 */
const isEmailConfigured = () => {
  return !!(
    process.env.GMAIL_USER && 
    process.env.GMAIL_APP_PASSWORD && 
    process.env.GMAIL_APP_PASSWORD !== 'your_gmail_app_password' &&
    process.env.GMAIL_APP_PASSWORD !== 'IMPORTANT_ID'
  );
};

/**
 * Create email transporter for Gmail
 * Uses Gmail App Password for authentication
 * @returns {Object|null} Nodemailer transporter or null if not configured
 */
const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } catch (error) {
    console.error('Error creating email transporter:', error.message);
    return null;
  }
};

module.exports = { createTransporter, isEmailConfigured };
