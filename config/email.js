/**
 * Email Configuration
 * Gmail SMTP setup using Nodemailer
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Create email transporter for Gmail
 * Uses Gmail App Password for authentication
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

module.exports = { createTransporter };
