/**
 * API Routes
 * Handles all API endpoints for ApplyBotX
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Resume = require('../models/Resume');
const { extractTextFromResume, cleanText } = require('../services/resumeParser');
const { parseResumeWithAI, generateJobApplicationEmail } = require('../services/aiService');
const { extractEmails, getPrimaryEmail, isValidEmail } = require('../services/emailExtractor');
const { sendJobApplicationEmail } = require('../services/emailService');

/**
 * POST /api/process
 * Main endpoint - handles both resume update and email automation
 */
router.post('/process', upload.single('resume'), async (req, res) => {
  try {
    // Extract form data
    const { userName, userEmail, jobPost } = req.body;
    const resumeFile = req.file;

    // Validation
    if (!userName || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User name and email are required',
      });
    }

    if (!resumeFile) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required',
      });
    }

    // Extract text from resume
    console.log('📄 Extracting text from resume...');
    const resumeText = await extractTextFromResume(resumeFile.path);
    const cleanedText = cleanText(resumeText);

    // INTENT CLASSIFICATION
    // Path 1: Resume Update (no job post provided)
    if (!jobPost || jobPost.trim() === '') {
      console.log('🔄 Path: Resume Update');
      
      // Parse resume with AI
      console.log('🤖 Parsing resume with AI...');
      const parsedData = await parseResumeWithAI(cleanedText);

      // Save to database
      const resume = new Resume({
        userName,
        userEmail,
        fileName: resumeFile.filename,
        filePath: resumeFile.path,
        fileType: resumeFile.mimetype,
        resumeText: cleanedText,
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
      });

      await resume.save();

      return res.json({
        success: true,
        message: 'Resume saved and parsed successfully',
        data: {
          skills: parsedData.skills,
          experience: parsedData.experience,
        },
      });
    }

    // Path 2: Email Automation (job post provided)
    console.log('✉️ Path: Email Automation');

    // Step 1: Generate email with AI
    console.log('🤖 Generating application email...');
    const emailContent = await generateJobApplicationEmail(
      cleanedText,
      jobPost,
      userName
    );

    if (!emailContent.subject || !emailContent.body) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate email content',
      });
    }

    // Step 2: Extract recruiter email
    console.log('🔍 Extracting recruiter email...');
    const emails = extractEmails(jobPost);
    const recruiterEmail = getPrimaryEmail(emails);

    if (!recruiterEmail) {
      return res.status(400).json({
        success: false,
        message: 'No recruiter email found in job post. Please include contact email.',
      });
    }

    // Step 3: Validate before sending
    if (!isValidEmail(recruiterEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recruiter email format',
      });
    }

    // Step 4: Send email
    console.log('📧 Sending email to recruiter...');
    await sendJobApplicationEmail({
      to: recruiterEmail,
      subject: emailContent.subject,
      body: emailContent.body,
      from: userEmail,
      fromName: userName,
    });

    // Optional: Save application record to database
    const resume = new Resume({
      userName,
      userEmail,
      fileName: resumeFile.filename,
      filePath: resumeFile.path,
      fileType: resumeFile.mimetype,
      resumeText: cleanedText,
    });
    await resume.save();

    return res.json({
      success: true,
      message: 'Email sent successfully to recruiter',
      data: {
        recruiterEmail,
        subject: emailContent.subject,
      },
    });

  } catch (error) {
    console.error('❌ Error processing request:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/resumes
 * Get all saved resumes (for testing/admin)
 */
router.get('/resumes', async (req, res) => {
  try {
    const resumes = await Resume.find()
      .select('-resumeText') // Exclude large text field
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ApplyBotX API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
