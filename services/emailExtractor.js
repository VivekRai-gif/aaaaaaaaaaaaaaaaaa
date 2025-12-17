/** 
 * Email Extractor Service
 * Extracts email addresses from text using regex
 */

/**
 * Extract email addresses from text
 * Uses regex pattern to find valid email formats
 * @param {String} text - Text to extract emails from
 * @returns {Array<String>} Array of found email addresses
 */
const extractEmails = (text) => {
  if (!text) return [];
  
  // Comprehensive email regex pattern
  // Matches standard email formats: name@domain.com
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  const emails = text.match(emailRegex);
  
  if (!emails || emails.length === 0) {
    return [];
  }
  
  // Remove duplicates and return
  return [...new Set(emails)];
};

/**
 * Get primary email from list
 * Returns the first valid email found
 * @param {Array<String>} emails - Array of email addresses
 * @returns {String|null} Primary email or null
 */
const getPrimaryEmail = (emails) => {
  if (!emails || emails.length === 0) {
    return null;
  }
  
  // Filter out common non-recruiter emails
  const blacklist = ['noreply', 'no-reply', 'donotreply', 'mailer-daemon'];
  
  const validEmails = emails.filter(email => {
    const lowerEmail = email.toLowerCase();
    return !blacklist.some(blocked => lowerEmail.includes(blocked));
  });
  
  return validEmails.length > 0 ? validEmails[0] : null;
};

/**
 * Validate email format
 * @param {String} email - Email address to validate
 * @returns {Boolean} True if valid, false otherwise
 */
const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
};

module.exports = {
  extractEmails,
  getPrimaryEmail,
  isValidEmail,
};
