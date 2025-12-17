/**
 * Resume Parser Service
 * Extracts text from PDF and DOC files
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extract text from resume file
 * Supports PDF and DOC/DOCX formats
 * @param {String} filePath - Path to the resume file
 * @returns {Promise<String>} Extracted text
 */
const extractTextFromResume = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      // Parse PDF file
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
      
    } else if (ext === '.doc' || ext === '.docx') {
      // Parse DOC/DOCX file
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
      
    } else {
      throw new Error('Unsupported file format');
    }
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    throw new Error('Failed to extract text from resume');
  }
};

/**
 * Clean and normalize extracted text
 * @param {String} text - Raw extracted text
 * @returns {String} Cleaned text
 */
const cleanText = (text) => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
};

module.exports = {
  extractTextFromResume,
  cleanText,
};
