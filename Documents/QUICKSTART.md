# 🚀 Quick Start Guide - ApplyBotX

## ⚡ Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/applybotx
OPENAI_API_KEY=your_openai_key_here
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
AI_PROVIDER=openai
```

### Step 3: Start MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 4: Run the Application
```bash
npm start
```

### Step 5: Open in Browser
```
http://localhost:5000
```

---

## 📝 Quick API Keys Setup

### OpenAI API Key
1. Visit: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `.env`

### Gmail App Password
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and your device
4. Copy 16-character password to `.env`

---

## ✅ Quick Test

### Test 1: Resume Upload Only
- Name: Test User
- Email: test@example.com
- Upload: Any PDF resume
- Job Post: Leave empty
- Result: Skills and experience extracted

### Test 2: Email Automation
- Name: Test User
- Email: test@example.com
- Upload: Any PDF resume
- Job Post: Paste job description with recruiter email
- Result: Email sent to recruiter

---

## 🆘 Quick Troubleshooting

**MongoDB not connecting?**
```bash
# Check if running
mongosh
```

**OpenAI errors?**
- Check API key is correct
- Verify you have credits

**Email not sending?**
- Ensure 2FA is enabled
- Regenerate App Password
- Remove any spaces from password

---

## 📚 Full Documentation

- **Setup Guide:** See `SETUP_GUIDE.md`
- **Workflow Details:** See `WORKFLOW.md`
- **Viva Questions:** See `VIVA_QUESTIONS.md`
- **Project Overview:** See `README.md`

---

## 🎯 Project Structure

```
aapply-17dec/
├── config/          # Database and email config
├── models/          # MongoDB schemas
├── services/        # Business logic (AI, email, parsing)
├── middleware/      # Express middleware (file upload)
├── routes/          # API endpoints
├── public/          # Frontend files
├── uploads/         # Resume storage (auto-created)
└── server.js        # Main server file
```

---

## 🔑 Important Files

- `server.js` - Main entry point
- `.env` - Configuration (CREATE THIS!)
- `package.json` - Dependencies
- `public/index.html` - Frontend UI

---

## 📞 Support

For detailed setup instructions, refer to:
- `SETUP_GUIDE.md` - Complete installation guide
- `README.md` - Project overview and features

---

**That's it! You're ready to use ApplyBotX! 🎉**
