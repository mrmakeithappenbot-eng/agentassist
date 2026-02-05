# 🚀 Deploy AgentAssist Backend to Railway

## Why Railway?

- ✅ Free tier available ($5 credit/month)
- ✅ No credit card required to start
- ✅ Automatic deployments from GitHub
- ✅ Built-in PostgreSQL database
- ✅ Easy environment variables
- ✅ Your backend will be live at: https://yourapp.railway.app

**Time to deploy: 10 minutes**

---

## Step 1: Create Railway Account (2 minutes)

1. Go to: https://railway.app/
2. Click "Start a New Project"
3. Sign in with GitHub (recommended) or email
4. Verify your email if needed

---

## Step 2: Create GitHub Repository (3 minutes)

### Option A: Using GitHub Desktop (Easiest)

1. Download GitHub Desktop from: https://desktop.github.com/
2. Open GitHub Desktop
3. File → Add Local Repository
4. Navigate to: `\\wsl$\Ubuntu\home\logrealbot\.openclaw\workspace\agentassist`
5. Click "create a repository" when prompted
6. Name it: `agentassist`
7. Click "Publish repository"
8. Uncheck "Keep this code private" (or keep it private, up to you)
9. Click "Publish repository"

### Option B: Using Git Command Line

```bash
cd /home/logrealbot/.openclaw/workspace/agentassist
git init
git add .
git commit -m "Initial AgentAssist deployment"
git remote add origin https://github.com/YOUR_USERNAME/agentassist.git
git push -u origin main
```

(Replace YOUR_USERNAME with your GitHub username)

---

## Step 3: Deploy to Railway (3 minutes)

1. Go back to Railway: https://railway.app/
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `agentassist` repository
5. Railway will detect the backend folder automatically
6. Click "Deploy"

**Railway will now:**
- Read the Dockerfile
- Build your backend
- Start the server
- Give you a URL

---

## Step 4: Add PostgreSQL Database (1 minute)

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Wait 30 seconds for it to provision
4. Railway automatically connects it to your backend

---

## Step 5: Configure Environment Variables (2 minutes)

1. Click on your backend service
2. Go to "Variables" tab
3. Add these variables:

**Required:**
```
BOLDTRAIL_API_KEY=your-boldtrail-api-key-here
SECRET_KEY=ufS_NhHk6sgjvTft9Ma4ByFis4KqRfrioW3go0eI6Xo
ENCRYPTION_KEY=ISvmkFz05mu0YtIDVoTePa9TfnQV7w4DpeyBEyobjtY=
ENVIRONMENT=production
DEBUG=False
```

**Optional (if you want other CRMs):**
```
FOLLOWUPBOSS_API_KEY=
OPENAI_API_KEY=your-openai-key-for-ai-features
```

4. Click "Save"
5. Railway will automatically redeploy with new variables

---

## Step 6: Get Your Backend URL (1 minute)

1. In Railway, click on your backend service
2. Go to "Settings" tab
3. Scroll down to "Domains"
4. Click "Generate Domain"
5. You'll get a URL like: `https://agentassist-production-xxxx.up.railway.app`

**Copy this URL!** You'll need it for the frontend.

---

## Step 7: Update Frontend to Use Railway Backend (1 minute)

### Option A: Edit in WSL

```bash
cd /home/logrealbot/.openclaw/workspace/agentassist/frontend
```

Edit `next.config.js`:

```javascript
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://YOUR-RAILWAY-URL.up.railway.app/api/:path*',
      },
    ]
  },
}
```

Replace `YOUR-RAILWAY-URL` with your actual Railway URL.

### Option B: Create Environment Variable

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
```

Then restart your frontend:
```bash
cd frontend
npm run dev
```

---

## Step 8: Test the Deployment (1 minute)

1. Go to your Railway URL in browser
2. You should see: `{"app":"AgentAssist API","status":"operational"}`
3. Try: `https://your-url.railway.app/health`
4. Should return: `{"status":"healthy"}`

**If you see those, it's working!**

---

## Step 9: Connect BoldTrail (1 minute)

1. Go to: http://localhost:3000/settings/crm
2. Select BoldTrail
3. Enter your API key
4. Click "Connect & Validate"
5. Backend (now on Railway) validates your key
6. You're redirected to dashboard
7. **See your real BoldTrail data!**

---

## ✅ Done!

Your setup:
- ✅ Backend running on Railway
- ✅ PostgreSQL database on Railway
- ✅ Frontend running locally (or deploy to Vercel)
- ✅ BoldTrail connected
- ✅ Real data flowing

---

## 🎯 Benefits of Railway Deployment

**What you get:**
- Always-on backend (24/7)
- No Windows Python needed
- Automatic SSL (HTTPS)
- Automatic backups
- Logs and monitoring
- Easy updates (just push to GitHub)

**Free tier includes:**
- $5 credit per month
- ~500 hours of compute
- 1GB database storage
- Enough for testing/personal use

---

## 📊 Monitoring Your App

**View logs:**
1. Go to Railway project
2. Click on backend service
3. Click "Deployments"
4. Click on latest deployment
5. See real-time logs

**Check database:**
1. Click on PostgreSQL service
2. Click "Data" tab
3. See your tables and data

---

## 🔄 Updating Your Backend

**After you make changes:**

1. Commit changes in GitHub Desktop (or git)
2. Push to GitHub
3. Railway automatically detects changes
4. Rebuilds and redeploys
5. Your app updates in ~2 minutes

No manual redeployment needed!

---

## 🆘 Troubleshooting

### "Build failed"
→ Check Railway logs for error
→ Make sure Dockerfile is in backend folder
→ Verify requirements.txt has no typos

### "Application error"
→ Check environment variables are set
→ Verify BOLDTRAIL_API_KEY is correct
→ Check logs for Python errors

### "Database connection failed"
→ Make sure PostgreSQL is running
→ Check if DATABASE_URL variable is set (Railway does this automatically)

### "Frontend can't connect"
→ Verify Railway URL in next.config.js
→ Check CORS settings
→ Make sure Railway app is running

---

## 💰 Cost

**Free tier:**
- $5 credit/month
- Perfect for development/testing
- Good for low traffic

**If you exceed free tier:**
- Starts at $5/month
- Only charged for what you use
- Can set spending limits

**Alternative free hosting:**
- Render.com (also has free tier)
- Fly.io (free tier available)
- Heroku (limited free tier)

---

## 🎉 Congratulations!

You now have:
- Professional cloud-hosted backend
- Real database
- HTTPS/SSL by default
- Automatic deployments
- Monitoring and logs
- No local Python installation needed

**Your AgentAssist platform is production-ready!** 🚀

---

## 📚 Next Steps

1. **Deploy frontend to Vercel:**
   - Go to vercel.com
   - Import your GitHub repo
   - Deploy frontend folder
   - Get: https://agentassist.vercel.app

2. **Add custom domain:**
   - Buy domain (Namecheap, Google Domains, etc.)
   - Point to Railway URL
   - Professional URL for your app

3. **Set up monitoring:**
   - Add Sentry for error tracking
   - Set up Railway notifications
   - Monitor usage and costs

---

Built with ❤️ via Railway
