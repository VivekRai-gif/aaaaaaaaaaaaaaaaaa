# ApplyBotX - System Workflow Documentation

## 🔄 Complete System Flow

### Overview
ApplyBotX uses **Intent Classification** to determine whether the user wants to:
1. **Update Resume** - Store and parse resume only
2. **Automate Email** - Generate and send job application email

---

## 📊 Detailed Workflow

### **Initial Request Flow**

```
User Fills Form
    ↓
Frontend Validates Input
    ↓
POST /api/process
    ↓
Backend Receives Data
    ↓
Multer Processes File Upload
    ↓
Resume Text Extraction
    ↓
INTENT CLASSIFICATION
```

---

## 🎯 Intent Classification Logic

```javascript
if (resume exists AND jobPost is empty) {
    → Path 1: Resume Update
} else if (jobPost exists) {
    → Path 2: Email Automation
}
```

---

## 📂 Path 1: Resume Update Flow

### Step-by-Step Process

```
1. Resume Upload
   ├─ File saved to uploads/ directory
   ├─ Unique filename generated (timestamp-originalname)
   └─ File path stored

2. Text Extraction
   ├─ PDF → pdf-parse library
   ├─ DOC/DOCX → mammoth library
   └─ Raw text extracted

3. Text Cleaning
   ├─ Remove extra spaces
   ├─ Normalize newlines
   └─ Clean text output

4. AI Parsing
   ├─ Send text to OpenAI/Gemini
   ├─ Extract: Skills, Experience
   └─ Return structured data

5. Database Storage
   ├─ Create Resume document
   ├─ Save: User info, file data, parsed data
   └─ Store in MongoDB

6. Response to User
   └─ Success message + Extracted data
```

### Code Flow (Resume Update)

```javascript
// 1. Extract text from resume
const resumeText = await extractTextFromResume(filePath);

// 2. Clean the text
const cleanedText = cleanText(resumeText);

// 3. Parse with AI
const parsedData = await parseResumeWithAI(cleanedText);
// Returns: { skills: [...], experience: [...] }

// 4. Save to database
const resume = new Resume({
  userName,
  userEmail,
  fileName,
  filePath,
  resumeText: cleanedText,
  skills: parsedData.skills,
  experience: parsedData.experience
});
await resume.save();

// 5. Send success response
return { 
  success: true,
  message: "Resume saved and parsed successfully",
  data: parsedData 
};
```

---

## ✉️ Path 2: Email Automation Flow

### Step-by-Step Process

```
1. Resume Processing (Same as Path 1, Steps 1-3)
   └─ Extract and clean resume text

2. AI Email Generation
   ├─ Input: Resume text + Job post + User name
   ├─ AI generates:
   │   ├─ Professional subject line
   │   └─ Compelling email body
   └─ Output: { subject, body }

3. Email Extraction
   ├─ Regex pattern matching on job post
   ├─ Find all email addresses
   ├─ Filter blacklisted emails (noreply, etc.)
   └─ Return primary recruiter email

4. Validation Checks
   ├─ Check: Recruiter email exists?
   ├─ Check: Subject line exists?
   ├─ Check: Email body exists?
   └─ If any missing → Return error

5. Email Sending
   ├─ Configure Nodemailer with Gmail
   ├─ Format email (text + HTML)
   ├─ Send via SMTP
   └─ Get message ID confirmation

6. Database Storage (Optional)
   └─ Save resume data for record keeping

7. Response to User
   └─ Success message + Recruiter email + Subject
```

### Code Flow (Email Automation)

```javascript
// 1. Extract and clean resume
const resumeText = await extractTextFromResume(filePath);
const cleanedText = cleanText(resumeText);

// 2. Generate email with AI
const emailContent = await generateJobApplicationEmail(
  cleanedText,
  jobPost,
  userName
);
// Returns: { subject: "...", body: "..." }

// 3. Extract recruiter email
const emails = extractEmails(jobPost);
const recruiterEmail = getPrimaryEmail(emails);

// 4. Validate
if (!recruiterEmail) {
  throw Error("No recruiter email found");
}
if (!emailContent.subject || !emailContent.body) {
  throw Error("Failed to generate email content");
}

// 5. Send email
await sendJobApplicationEmail({
  to: recruiterEmail,
  subject: emailContent.subject,
  body: emailContent.body,
  from: userEmail,
  fromName: userName
});

// 6. Send success response
return {
  success: true,
  message: "Email sent successfully",
  data: { recruiterEmail, subject: emailContent.subject }
};
```

---

## 🔍 Technical Components Breakdown

### 1. **Resume Parser** (`services/resumeParser.js`)

**Purpose:** Extract text from PDF/DOC files

**Technologies:**
- `pdf-parse` - PDF text extraction
- `mammoth` - DOC/DOCX text extraction

**Functions:**
```javascript
extractTextFromResume(filePath) → Returns text string
cleanText(text) → Returns cleaned text
```

---

### 2. **AI Service** (`services/aiService.js`)

**Purpose:** AI-powered content generation

**API Provider:** OpenAI (GPT-3.5-turbo) or Gemini

**Functions:**

```javascript
// Parse resume to extract structured data
parseResumeWithAI(resumeText) → {
  skills: ["JavaScript", "React", ...],
  experience: ["Software Engineer at XYZ", ...]
}

// Generate job application email
generateJobApplicationEmail(resumeText, jobPost, userName) → {
  subject: "Application for Software Engineer Position",
  body: "Dear Hiring Manager,\n\n..."
}
```

---

### 3. **Email Extractor** (`services/emailExtractor.js`)

**Purpose:** Extract and validate email addresses

**Regex Pattern:**
```javascript
/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
```

**Functions:**
```javascript
extractEmails(text) → ["email1@domain.com", "email2@domain.com"]
getPrimaryEmail(emails) → "email1@domain.com"
isValidEmail(email) → true/false
```

**Email Filtering:**
- Removes duplicates
- Filters out: noreply, no-reply, donotreply, mailer-daemon

---

### 4. **Email Service** (`services/emailService.js`)

**Purpose:** Send emails via Gmail SMTP

**Technology:** Nodemailer

**Configuration:**
```javascript
{
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
}
```

**Functions:**
```javascript
sendJobApplicationEmail({
  to, subject, body, from, fromName
}) → { success, messageId }

verifyEmailConfig() → true/false
```

---

## 🔐 Security Implementation

### 1. **Environment Variables**
All sensitive data stored in `.env`:
```
MONGODB_URI
OPENAI_API_KEY
GMAIL_USER
GMAIL_APP_PASSWORD
```

### 2. **File Upload Security**
- File type validation (PDF, DOC only)
- File size limit (10MB max)
- Unique filename generation
- Secure storage path

### 3. **Input Validation**
- Email format validation
- Required field checks
- SQL injection prevention (Mongoose)
- XSS protection

### 4. **Error Handling**
- Try-catch blocks
- Graceful error messages
- No sensitive data exposure

---

## 📊 Database Schema

### Resume Model (`models/Resume.js`)

```javascript
{
  userName: String,           // User's full name
  userEmail: String,          // User's email (lowercase, trimmed)
  fileName: String,           // Original file name
  filePath: String,           // Server storage path
  fileType: String,           // MIME type
  resumeText: String,         // Extracted text
  skills: [String],           // Array of skills
  experience: [String],       // Array of experiences
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-updated
}
```

---

## 🚀 API Endpoints

### 1. **POST /api/process**
Main endpoint for resume processing

**Request (multipart/form-data):**
```
userName: String (required)
userEmail: String (required)
resume: File (required, PDF/DOC, max 10MB)
jobPost: String (optional)
```

**Response (Resume Update):**
```json
{
  "success": true,
  "message": "Resume saved and parsed successfully",
  "data": {
    "skills": ["JavaScript", "Node.js"],
    "experience": ["Software Engineer at ABC Corp"]
  }
}
```

**Response (Email Automation):**
```json
{
  "success": true,
  "message": "Email sent successfully to recruiter",
  "data": {
    "recruiterEmail": "recruiter@company.com",
    "subject": "Application for Software Engineer Position"
  }
}
```

### 2. **GET /api/resumes**
Get all saved resumes (for testing)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### 3. **GET /api/health**
Health check endpoint

**Response:**
```json
{
  "success": true,
  "message": "ApplyBotX API is running",
  "timestamp": "2025-12-17T..."
}
```

---

## ⚡ Performance Considerations

### 1. **Asynchronous Operations**
All file I/O, AI calls, and database operations use async/await

### 2. **Error Recovery**
Graceful degradation with meaningful error messages

### 3. **File Storage**
Resume files stored locally in `uploads/` directory

### 4. **Token Optimization**
Resume text limited to 1500 chars for AI processing to reduce costs

---

## 🎓 Viva Preparation Points

### **Question:** How does intent classification work?
**Answer:** "The system checks if a job post is provided. If the user only uploads a resume without job details, we parse and save it. If job details are included, we generate and send an application email."

### **Question:** How do you extract email addresses?
**Answer:** "We use a regex pattern that matches standard email formats. The pattern identifies text before @, domain name, and TLD. We then filter out system emails like noreply."

### **Question:** Which AI model do you use?
**Answer:** "We support OpenAI's GPT-3.5-turbo and Google's Gemini. The AI generates professional emails by analyzing both the resume and job posting."

### **Question:** How is email sending secured?
**Answer:** "We use Gmail's SMTP with App Passwords, not the actual account password. All credentials are stored in environment variables, never in code."

### **Question:** What happens if the AI fails?
**Answer:** "We have error handling that catches AI failures and returns user-friendly messages. The system validates AI responses before proceeding."

---

## 📈 Future Enhancements

1. **Multiple Job Applications** - Queue system for bulk applications
2. **Application Tracking** - Dashboard to view sent applications
3. **Template Management** - Custom email templates
4. **Integration** - LinkedIn, Indeed API integration
5. **Analytics** - Track success rates and responses

---

**End of Workflow Documentation**
