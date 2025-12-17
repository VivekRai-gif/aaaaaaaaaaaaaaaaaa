/**
 * AI Service
 * Integrates with OpenAI or Gemini API for content generation
 */

require('dotenv').config();
const { OpenAI } = require('openai');

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';

// Initialize OpenAI client
let openai;
if (AI_PROVIDER === 'openai') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Parse resume and extract structured data using AI
 * @param {String} resumeText - Extracted resume text
 * @returns {Promise<Object>} Parsed resume data with skills and experience
 */
const parseResumeWithAI = async (resumeText) => {
  try {
    const prompt = `
Analyze the following resume and extract:
1. Key skills (list of technical and soft skills)
2. Work experience (list of job titles and companies)

Resume:
${resumeText}

Respond in JSON format:
{
  "skills": ["skill1", "skill2", ...],
  "experience": ["job title at company", ...]
}
`;

    if (AI_PROVIDER === 'openai') {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a resume parser. Extract skills and experience from resumes and return data in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { skills: [], experience: [] };
    }
    
    // Fallback if AI provider not configured
    return { skills: [], experience: [] };
    
  } catch (error) {
    console.error('Error parsing resume with AI:', error.message);
    throw new Error('Failed to parse resume with AI');
  }
};

/**
 * Generate job application email using AI
 * @param {String} resumeText - User's resume text
 * @param {String} jobPost - Job posting text
 * @param {String} userName - User's name
 * @returns {Promise<Object>} Generated email with subject and body
 */
const generateJobApplicationEmail = async (resumeText, jobPost, userName) => {
  try {
    const prompt = `
You are a professional job application email writer.

Based on the following information, generate a professional job application email:

Candidate Name: ${userName}

Resume:
${resumeText.substring(0, 1500)} // Limit resume text to avoid token limits

Job Posting:
${jobPost}

Requirements:
1. Write a compelling subject line
2. Write a professional email body that:
   - Introduces the candidate
   - Highlights relevant skills and experience
   - Shows enthusiasm for the position
   - Requests consideration
   - Is concise (3-4 paragraphs)
   - Uses professional tone
3. Do not include placeholder text like [Your Name] or [Contact]

Respond in JSON format:
{
  "subject": "subject line here",
  "body": "email body here"
}
`;

    if (AI_PROVIDER === 'openai') {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional job application email writer. Generate compelling application emails in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    }
    
    throw new Error('AI provider not configured');
    
  } catch (error) {
    console.error('Error generating email with AI:', error.message);
    throw new Error('Failed to generate email with AI');
  }
};

module.exports = {
  parseResumeWithAI,
  generateJobApplicationEmail,
};
