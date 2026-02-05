# 🎨 Deploy AgentAssist Backend to Render

## Why Render?

- ✅ Completely free tier (no credit card needed)
- ✅ Free PostgreSQL database
- ✅ Automatic HTTPS
- ✅ Easy deployment from GitHub
- ✅ Built-in monitoring
- ✅ Your backend will be live at: https://yourapp.onrender.com

**Time to deploy: 10 minutes**

---

## Step 1: Create Render Account (2 minutes)

1. Go to: https://render.com/
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)
4. Verify your email

---

## Step 2: Create GitHub Repository (3 minutes)

Same as Railway - see Step 2 in `DEPLOY_TO_RAILWAY.md`

Quick version:
1. Download GitHub Desktop
2. Add your agentassist folder
3. Publish to GitHub
4. Done!

---

## Step 3: Create PostgreSQL Database (2 minutes)

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Name: `agentassist-db`
4. Database: `agentassist`
5. User: `agentassist`
6. Region: Choose closest to you
7. Plan: **Free**
8. Click "Create Database"
9. Wait ~1 minute for provisioning

**Copy the "Internal Database URL"** - you'll need it!

---

## Step 4: Deploy Backend Service (3 minutes)

1. Click "New +" again
2. Select "Web Service"
3. Click "Build and deploy from a Git repository"
4. Connect your GitHub account (if not already)
5. Select your `agentassist` repository
6. Click "Connect"

**Configure the service:**

- **Name:** `agentassist-backend`
- **Region:** Same as database
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Plan:** **Free**

Click "Create Web Service"

---

## Step 5: Add Environment Variables (2 minutes)

In the web service settings, go to "Environment" tab.

Add these variables:

```
SECRET_KEY=ufS_NhHk6sgjvTft9Ma4ByFis4KqRfrioW3go0eI6Xo
ENCRYPTION_KEY=ISvmkFz05mu0YtIDVoTePa9TfnQV7w4DpeyBEyobjtY=
BOLDTRAIL_API_KEY=your-actual-boldtrail-api-key
DATABASE_URL=[paste your Internal Database URL from Step 3]
ENVIRONMENT=production
DEBUG=False
CORS_ORIGINS=["https://localhost:3000","http://localhost:3000"]
```

Click "Save Changes"

Render will automatically redeploy.

---

## Step 6: Get Your Backend URL (1 minute)

1. Once deployment finishes (takes ~3-5 minutes)
2. You'll see your URL at the top: `https://agentassist-backend-xxxx.onrender.com`
3. Click on it to test
4. Should see: `{"app":"AgentAssist API","status":"operational"}`

**Copy this URL!**

---

## Step 7: Update Frontend (1 minute)

Edit `frontend/next.config.js`:

```javascript
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://agentassist-backend-xxxx.onrender.com/api/:path*',
      },
    ]
  },
}
```

Replace with your actual Render URL.

Restart frontend:
```bash
cd frontend
npm run dev
```

---

## Step 8: Connect BoldTrail (1 minute)

1. Go to: http://localhost:3000/settings/crm
2. Select BoldTrail
3. Enter your API key
4. Click "Connect & Validate"
5. **See your real data!**

---

## ✅ Done!

You now have:
- ✅ Backend on Render (free)
- ✅ PostgreSQL database (free)
- ✅ HTTPS by default
- ✅ BoldTrail connected
- ✅ Real data flowing

---

## 🆘 Troubleshooting

### "Build failed"
→ Check Render logs (click on service → Logs tab)
→ Verify requirements.txt exists in backend folder
→ Make sure Python 3.12 is supported

### "Service unhealthy"
→ Check environment variables are set
→ Verify DATABASE_URL is correct
→ Look at logs for errors

### "Database connection failed"
→ Copy the **Internal** Database URL, not External
→ Make sure database is running
→ Check if database and web service are in same region

### Free tier limitations
→ Service goes to sleep after 15 min of inactivity
→ First request after sleep takes ~30 seconds
→ 750 hours/month of runtime (plenty for testing)

---

## 💰 Cost

**Free tier includes:**
- 750 hours/month for web service
- PostgreSQL database (1GB storage)
- 100GB bandwidth/month
- Automatic SSL
- **$0/month**

**Perfect for:**
- Development
- Testing
- Personal projects
- Low-traffic production

**Paid plans start at:**
- $7/month for web service (always-on)
- $7/month for database (more storage)

---

## 🎯 Render vs Railway

| Feature | Render | Railway |
|---------|--------|---------|
| Free tier | ✅ Truly free | ✅ $5 credit/month |
| Database | ✅ Free PostgreSQL | ⚠️ Paid after credit |
| Always-on | ❌ Sleeps after 15min | ✅ With credit |
| Setup | Easy | Very easy |
| Best for | Small projects | Active development |

**Recommendation:** Start with Render (free forever), upgrade if needed.

---

## 📊 Monitoring

**View logs:**
1. Click on your service
2. Go to "Logs" tab
3. See real-time output

**Check metrics:**
1. Go to "Metrics" tab
2. See CPU, memory, requests
3. Monitor performance

**Database management:**
1. Click on PostgreSQL service
2. Click "Connect"
3. Use provided credentials with any PostgreSQL client

---

## 🔄 Auto-Deploy on Git Push

**Already set up!** When you:
1. Make changes to code
2. Commit in GitHub Desktop
3. Push to GitHub
4. Render automatically detects changes
5. Rebuilds and redeploys
6. App updates in ~3-5 minutes

---

## 🚀 Deploy Frontend to Render Too (Optional)

1. Click "New +" → "Static Site"
2. Select your repository
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Publish Directory: `out` or `.next`
6. Click "Create Static Site"
7. Get URL: `https://agentassist.onrender.com`

Now everything is hosted!

---

## ✅ Success Checklist

- [ ] Render account created
- [ ] GitHub repository published
- [ ] PostgreSQL database created
- [ ] Backend service deployed
- [ ] Environment variables added
- [ ] Backend URL obtained
- [ ] Frontend updated with URL
- [ ] BoldTrail connected
- [ ] Real data showing

---

## 🎉 You're Live!

Your AgentAssist platform is now:
- 🌐 Accessible from anywhere
- 🔒 Secured with HTTPS
- 📊 Connected to real BoldTrail data
- 💾 Backed by PostgreSQL database
- 🆓 Running on free tier
- 🔄 Auto-deploying from GitHub

**Professional deployment with $0 cost!** 🚀

---

Questions? Check the Render docs: https://render.com/docs
