# Politografisi Online

LMS for Greek Citizenship Exams with AI capabilities, built with Next.js 14+, Firebase, and Gemini API.

## Features
- **7 Exam Sections**: History, Geography, Culture, Institutions, etc.
- **AI Integration**: 
  - Essay grading and correction.
  - Audio transcription and speech feedback.
  - Contextual hints for quizzes.
- **Role Based Access**: Admin, Redactor, Student, Demo User.
- **Local Storage**: Media uploads are stored locally in the file system for simplicity and compliance with the prompt.

## Deployment Guide (VPS + PM2)

This application stores uploaded media files locally in `./public/uploads`. When deploying to a standard VPS (Ubuntu/Debian), ensure persistent storage and correct permissions.

### Prerequisites
- Node.js 18+
- PM2 (`npm install -g pm2`)
- Nginx (Reverse Proxy)

### Installation Steps

1. **Clone & Install**
   ```bash
   git clone <your_repo_url>
   cd politografisi-online
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` or `.env.production` file with your keys:
   ```env
   # API Keys
   API_KEY=your_gemini_api_key

   # Firebase Config
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **File Permissions (CRITICAL)**
   The application writes to `public/uploads`. Ensure the user running the app has write access.
   ```bash
   mkdir -p public/uploads
   # If running as 'ubuntu' user:
   chown -R ubuntu:ubuntu public/uploads
   chmod -R 755 public/uploads
   ```

4. **Build**
   ```bash
   npm run build
   ```

5. **Start with PM2**
   ```bash
   pm2 start npm --name "politografisi" -- start
   pm2 save
   ```

6. **Nginx Config (Snippet)**
   Ensure standard proxy pass to localhost:3000.
   Also, ensure `client_max_body_size` is large enough for audio/image uploads.
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       client_max_body_size 20M; # Allow larger uploads

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```