/**
 * AI Service
 * Integrates with OpenAI or Gemini API for content generation
 */

require('dotenv').config();
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';

// Initialize AI clients
let openai;
let gemini;

if (AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else if (AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Parse resume and extract structured data using AI
 * @param {String} resumeText - Extracted resume text
 * @returns {Promise<Object>} Parsed resume data with skills and experience
 */
const parseResumeWithAI = async (resumeText) => {
  try {
    // Check if AI is configured
    if (!openai && !gemini) {
      throw new Error('AI service not configured. Please add API key to .env file');
    }

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

    if (AI_PROVIDER === 'openai' && openai) {
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
    } else if (AI_PROVIDER === 'gemini' && gemini) {
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      const result = await model.generateContent(prompt);
      const content = result.response.text();
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
${resumeText.substring(0, 1500)}

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

    if (AI_PROVIDER === 'openai' && openai) {
      try {
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
      } catch (error) {
        console.warn('OpenAI error, using fallback:', error.message);
      }
    } else if (AI_PROVIDER === 'gemini' && gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const result = await model.generateContent(prompt);
        const content = result.response.text();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.warn('Gemini error, using fallback:', error.message);
      }
    }
    
    // Fallback: Generate basic professional email without AI
    console.log('⚠️  Using fallback email generation (AI unavailable)');
    
    // Extract job title from job post
    const jobTitleMatch = jobPost.match(/(?:position|role|job)[\s:]*([^\n]+)/i);
    const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'the position';
    
    // Extract company name from job post  
    const companyMatch = jobPost.match(/(?:at|@|company)[\s:]*([A-Z][a-zA-Z0-9\s&]+)/);
    const company = companyMatch ? companyMatch[1].trim().split(/\s+(is|in|for|with)/)[0] : 'your company';
    
    return {
      subject: `Application for ${jobTitle} - ${userName}`,
      body: `Dear Hiring Manager,

I am writing to express my strong interest in ${jobTitle} at ${company}. With my background and skills, I am confident I would be a valuable addition to your team.

My experience and qualifications align well with the requirements outlined in your job posting. I am particularly excited about the opportunity to contribute to ${company} and grow professionally within your organization.

I have attached my resume for your review. I would welcome the opportunity to discuss how my skills and experience can benefit ${company}. Thank you for considering my application.

I look forward to hearing from you soon.

Best regards,
${userName}`
    };
    
  } catch (error) {
    console.error('Error generating email:', error.message);
    throw new Error('Failed to generate email with AI');
  }
};

module.exports = {
  parseResumeWithAI,
  generateJobApplicationEmail,
};
