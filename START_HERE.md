# 🚀 START HERE - Connect Your BoldTrail Data

## You're Almost There!

The frontend is running and showing mock data. To see **your real BoldTrail leads**, follow these 3 simple steps:

---

## Step 1: Install Python (5 minutes)

**If you already have Python 3.11+, skip to Step 2**

1. Go to: https://www.python.org/downloads/
2. Click "Download Python 3.12.x"
3. Run the installer
4. ✅ **CHECK the box "Add Python to PATH"**
5. Click "Install Now"
6. Wait for installation
7. Click "Close"

**Verify it worked:**
- Open Command Prompt
- Type: `python --version`
- Should show: `Python 3.12.x` or similar

---

## Step 2: Setup Backend (5 minutes)

Open Command Prompt in the `agentassist` folder:

```cmd
cd agentassist\backend
setup.bat
```

You'll see:
```
AgentAssist Backend Setup
=========================
Python found!
Creating virtual environment...
Installing dependencies...
```

Wait 2-3 minutes while it downloads and installs everything.

When done:
```
Setup Complete!
Next steps:
  1. Edit .env file and add your BoldTrail API key
```

---

## Step 3: Add Your BoldTrail API Key (1 minute)

### Get Your API Key:
1. Log into your BoldTrail account
2. Go to Settings → API Access (or Developer Settings)
3. Find your API key or generate a new one
4. Copy it

### Add to .env File:
1. Open `agentassist\backend\.env` in Notepad
2. Find this line: `BOLDTRAIL_API_KEY=`
3. Paste your key: `BOLDTRAIL_API_KEY=bt_1234567890abcdef`
4. Save and close

---

## Step 4: Start Backend (1 minute)

```cmd
cd agentassist\backend
start.bat
```

You should see:
```
🚀 AgentAssist Backend Starting...
✓ Configuration loaded
✓ Database ready
Server running at: http://localhost:8000
```

**Keep this window open!** The backend needs to stay running.

---

## Step 5: Connect in Browser (1 minute)

1. Go to: http://localhost:3000/settings/crm
2. Click on **BoldTrail** (🚀 icon)
3. Enter your API key again (same one from Step 3)
4. Click **"Connect & Validate"**
5. Wait 2 seconds
6. **You'll be redirected to dashboard with YOUR REAL DATA!**

---

## ✅ Success!

If everything worked, you should now see:
- Your actual lead count in dashboard
- Real contact names and emails
- Live statistics from BoldTrail
- Working AI features with your data

---

## 🎯 What Each Step Does

**Step 1 (Python):** Installs the programming language needed to run the backend

**Step 2 (Setup):** Downloads all the code libraries the backend needs

**Step 3 (API Key):** Tells the backend how to connect to your BoldTrail account

**Step 4 (Start):** Runs the backend server that talks to BoldTrail

**Step 5 (Connect):** Links the frontend to your BoldTrail via backend

---

## ❓ Need More Help?

### Detailed Guides:
- **`CONNECT_BOLDTRAIL.md`** - Full step-by-step with troubleshooting
- **`BACKEND_BUILT.md`** - Technical details about what was built
- **`SETUP_BACKEND.md`** - Alternative setup instructions

### Quick Tests:
Test your BoldTrail connection:
```cmd
cd agentassist\backend
venv\Scripts\activate
python test_boldtrail.py
```

This will show you if your API key works and list your leads.

---

## 🐛 Troubleshooting

### "Python not found"
→ Reinstall Python with "Add to PATH" checked

### "setup.bat fails"
→ Try manually:
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### "Backend won't start"
→ Check if `.env` file exists in `backend/` folder

### "Connection failed"
→ Double-check your BoldTrail API key is correct

### "Still seeing mock data"
→ Make sure backend is running (you should see "Server running" message)

---

## 📞 Still Stuck?

1. Check the error message in the Command Prompt window
2. Look at the detailed guides above
3. Make sure both frontend AND backend are running
4. Verify your BoldTrail API key is active

---

## 🎉 That's It!

**Total time: ~10-15 minutes**

Once connected, AgentAssist will:
- Sync your leads every 15 minutes
- Generate AI follow-ups for new contacts
- Send messages back to BoldTrail
- Track all activity automatically

**Your real estate AI automation is now live!** 🚀
