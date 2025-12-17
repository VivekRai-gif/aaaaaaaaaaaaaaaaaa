/**
 * Resume Data Model
 * MongoDB schema for storing resume information
 */

const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  // User Information
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  
  // Resume File Information
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  
  // Parsed Resume Data
  resumeText: {
    type: String,
  },
  skills: {
    type: [String],
    default: [],
  },
  experience: {
    type: [String],
    default: [],
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
ResumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resume', ResumeSchema);
