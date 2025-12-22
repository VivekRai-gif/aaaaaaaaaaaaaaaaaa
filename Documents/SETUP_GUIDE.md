# Setup Guide for ApplyBotX

## 📋 Prerequisites

Before setting up ApplyBotX, ensure you have:

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
3. **OpenAI API Key** - [Get API Key](https://platform.openai.com/api-keys)
4. **Gmail Account** with App Password

---

## 🚀 Installation Steps

### Step 1: Clone/Download Project

```bash
# If you have the project files
cd aapply-17dec
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- express
- multer
- dotenv
- cors
- nodemailer
- pdf-parse
- mammoth
- openai
- mongoose

---

## ⚙️ Configuration

### Step 1: Create Environment File

Create a `.env` file in the root directory:

```bash
# Copy the example file
copy .env.example .env
```

### Step 2: Configure Environment Variables

Open `.env` and fill in your credentials:

```env
# Server Configuration
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/applybotx

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Gmail Configuration
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# AI Provider (openai or gemini)
AI_PROVIDER=openai
```

---

## 🔑 Getting Required Credentials

### 1. OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-`)
6. Paste it in `.env` as `OPENAI_API_KEY`

**Note:** You need to add billing information and credits to use the API.

---

### 2. Gmail App Password

**Important:** You need a Gmail account with 2-Factor Authentication enabled.

#### Enable 2FA:
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security**
3. Enable **2-Step Verification**

#### Generate App Password:
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Windows Computer** (or your OS)
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
6. Paste it in `.env` as `GMAIL_APP_PASSWORD` (without spaces)

**Format in .env:**
```env
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

---

### 3. MongoDB Setup

#### Option A: Local MongoDB (Recommended for Development)

1. **Install MongoDB:**
   - Windows: [Download MongoDB](https://www.mongodb.com/try/download/community)
   - Install with default settings
   - MongoDB Compass will be installed automatically

2. **Start MongoDB:**
   ```bash
   # Windows (run as Administrator)
   net start MongoDB
   ```

3. **Verify Connection:**
   ```bash
   mongosh
   ```

4. **Use Default Connection String:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/applybotx
   ```

#### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Click **Connect** → **Connect your application**
5. Copy connection string
6. Replace `<password>` with your database password
7. Paste in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/applybotx
   ```

---

## 🗂️ Project Structure Verification

Ensure your project has this structure:

```
aapply-17dec/
├── config/
│   ├── db.js
│   └── email.js
├── models/
│   └── Resume.js
├── services/
│   ├── aiService.js
│   ├── emailService.js
│   ├── resumeParser.js
│   └── emailExtractor.js
├── middleware/
│   └── upload.js
├── routes/
│   └── api.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── uploads/          (auto-created)
├── server.js
├── package.json
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

## ▶️ Running the Application

### Step 1: Start MongoDB (if using local)

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 2: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
✅ Email configuration verified
🚀 ApplyBotX Server Started Successfully!
📡 Server running on: http://localhost:5000
```

### Step 3: Access the Application

Open your browser and go to:
```
http://localhost:5000
```

---

## ✅ Testing the Setup

### Test 1: Health Check

Visit: `http://localhost:5000/api/health`

Expected response:
```json
{
  "success": true,
  "message": "ApplyBotX API is running",
  "timestamp": "2025-12-17T..."
}
```

### Test 2: Resume Upload (Path 1)

1. Open `http://localhost:5000`
2. Fill in:
   - Name: John Doe
   - Email: john@example.com
   - Upload a resume PDF
   - Leave job post empty
3. Click Submit

Expected: Success message with extracted skills

### Test 3: Email Automation (Path 2)

1. Fill in:
   - Name: John Doe
   - Email: john@example.com
   - Upload a resume PDF
   - Job post: Include recruiter email
2. Click Submit

Expected: Email sent successfully message

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**
1. Check if MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Check status
   sc query MongoDB
   ```

2. Verify connection string in `.env`

3. Try connecting with Compass to test

---

### Issue: OpenAI API Error

**Error:** `401 Unauthorized` or `Invalid API key`

**Solution:**
1. Verify API key is correct in `.env`
2. Check if you have credits: [OpenAI Usage](https://platform.openai.com/usage)
3. Ensure no extra spaces in the key

---

### Issue: Email Not Sending

**Error:** `Invalid login` or `Username and Password not accepted`

**Solution:**
1. Verify 2FA is enabled on Gmail
2. Generate a new App Password
3. Ensure no spaces in password in `.env`
4. Check Gmail security settings

**Test email config:**
```javascript
// Add to server.js temporarily
const { verifyEmailConfig } = require('./services/emailService');
verifyEmailConfig().then(console.log);
```

---

### Issue: File Upload Error

**Error:** `Invalid file type` or `File too large`

**Solution:**
1. Ensure file is PDF or DOC format
2. Check file size (max 10MB)
3. Verify `uploads/` directory exists
4. Check file permissions

---

### Issue: AI Response Error

**Error:** `Failed to parse AI response`

**Solution:**
1. Check internet connection
2. Verify API key has credits
3. Reduce resume text length
4. Check OpenAI API status page

---

## 🔒 Security Checklist

- [ ] `.env` file is NOT committed to Git
- [ ] `.gitignore` includes `.env`
- [ ] Gmail App Password (not actual password) is used
- [ ] MongoDB connection is secured (if production)
- [ ] File upload size limits are set
- [ ] File type validation is active

---

## 📱 Port Configuration

If port 5000 is already in use:

1. Change in `.env`:
   ```env
   PORT=3000
   ```

2. Access at: `http://localhost:3000`

---

## 🧪 Development Tips

### Auto-Reload (Nodemon)

Already configured. Any code changes will auto-restart the server.

### Testing API with Postman

**Endpoint:** `POST http://localhost:5000/api/process`

**Body:** form-data
- `userName`: John Doe
- `userEmail`: john@example.com
- `resume`: [file]
- `jobPost`: [text]

### Viewing Database Records

**MongoDB Compass:**
1. Open Compass
2. Connect to `mongodb://localhost:27017`
3. View `applybotx` database
4. Check `resumes` collection

**Or use command line:**
```bash
mongosh
use applybotx
db.resumes.find().pretty()
```

---

## 📦 Production Deployment (Optional)

### Using Heroku

1. Install Heroku CLI
2. Create app:
   ```bash
   heroku create applybotx
   ```

3. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your_uri
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set GMAIL_USER=your_email
   heroku config:set GMAIL_APP_PASSWORD=your_password
   ```

4. Deploy:
   ```bash
   git push heroku main
   ```

### Using Render/Railway

Similar process - set environment variables in dashboard and deploy from Git.

---

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Nodemailer Guide](https://nodemailer.com/)
- [Express.js Guide](https://expressjs.com/guide/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check console logs for error messages
2. Verify all environment variables are set
3. Test each service independently
4. Check network/firewall settings

---

**Setup Complete! 🎉**

You're now ready to use ApplyBotX for automated job applications.
