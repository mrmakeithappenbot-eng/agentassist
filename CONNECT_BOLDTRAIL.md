# 🚀 Connect Your BoldTrail Data - Complete Guide

## What This Does

After following these steps, you'll see **your real BoldTrail leads** in the AgentAssist dashboard instead of mock data.

---

## ⚡ Quick Start (Windows)

### Step 1: Install Python (if not installed)

1. Go to https://www.python.org/downloads/
2. Download Python 3.11 or newer
3. Run installer
4. **✅ CHECK "Add Python to PATH"** ← IMPORTANT!
5. Click "Install Now"

### Step 2: Run Setup

Open PowerShell or Command Prompt in the `agentassist/backend` folder:

```cmd
cd agentassist\backend
setup.bat
```

This will:
- Create virtual environment
- Install all dependencies (takes 2-3 minutes)
- Prepare everything for you

### Step 3: Add Your BoldTrail API Key

1. Open `backend\.env` in Notepad
2. Find the line: `BOLDTRAIL_API_KEY=`
3. Add your key: `BOLDTRAIL_API_KEY=your-actual-api-key-here`
4. Save and close

**Where to get your API key:**
- Log into your BoldTrail account
- Go to Settings → API Access
- Copy your API key

### Step 4: Test Your Connection

```cmd
cd agentassist\backend
venv\Scripts\activate
python test_boldtrail.py
```

You should see:
```
✓ Connection successful!
✓ Found 10 leads!

Sample Leads:
Lead #1:
  Name: John Smith
  Email: john@example.com
  ...
```

### Step 5: Start Backend Server

**Option A - Easy (batch file):**
```cmd
cd agentassist\backend
start.bat
```

**Option B - Manual:**
```cmd
cd agentassist\backend
venv\Scripts\activate
python startup.py
```

You should see:
```
🚀 AgentAssist Backend Starting...
✓ Configuration loaded
✓ Database ready
Server will start at: http://localhost:8000
```

### Step 6: Connect Frontend

1. Keep backend running
2. Go to http://localhost:3000/settings/crm
3. Select BoldTrail (🚀)
4. Enter your API key
5. Click "Connect & Validate"
6. You'll be redirected to dashboard
7. **See your real BoldTrail data!**

---

## 🎯 What You'll See

After connecting:

### Dashboard
- **Real lead counts** from your BoldTrail account
- **Actual activity** from your leads
- **Live statistics** about your pipeline

### The Hunter
- Your FSBO/expired leads mixed with scraped ones
- Real property data from BoldTrail

### Pending Approvals
- AI-generated messages for your **actual leads**
- Real contact info (names, emails, phones)
- Send messages directly to your BoldTrail contacts

---

## 🔧 Troubleshooting

### "Python not found"
1. Reinstall Python
2. Make sure "Add to PATH" is checked
3. Restart Command Prompt/PowerShell
4. Try: `py --version` instead of `python --version`

### "pip install fails"
```cmd
python -m pip install --upgrade pip
pip install --upgrade setuptools wheel
pip install -r requirements.txt
```

### "Cannot activate virtual environment"
```cmd
# Try this instead:
venv\Scripts\activate.bat
```

### "BoldTrail connection failed"
1. Check API key is correct in `.env`
2. Verify key is active in BoldTrail dashboard
3. Check if you need to whitelist your IP in BoldTrail
4. Contact BoldTrail support if needed

### "No leads found"
- Check if you have leads in BoldTrail
- Verify API endpoint URL in `backend/app/crm/boldtrail.py`
- BoldTrail API structure may differ - check their docs

### Backend crashes
1. Check error message
2. Look in backend console for stack trace
3. Common issues:
   - Missing dependencies: `pip install -r requirements.txt`
   - Wrong Python version: Need 3.11+
   - Port 8000 already in use: Stop other apps using that port

---

## 📱 Keep Both Running

You need **TWO windows open**:

**Window 1 - Backend:**
```cmd
cd agentassist\backend
start.bat
# Leave this running
```

**Window 2 - Frontend:**
```cmd
cd agentassist\frontend
npm run dev
# Leave this running too
```

Then open browser to http://localhost:3000

---

## ✅ Success Checklist

- [ ] Python installed with PATH
- [ ] Backend dependencies installed (`setup.bat`)
- [ ] BoldTrail API key in `.env`
- [ ] Test passes (`test_boldtrail.py`)
- [ ] Backend server running (`start.bat`)
- [ ] Frontend running (`npm run dev`)
- [ ] Connected in http://localhost:3000/settings/crm
- [ ] Real data showing in dashboard

---

## 🎉 You're Done!

Once you see your real BoldTrail leads in the dashboard, everything is working!

The backend will now:
- ✅ Fetch leads from BoldTrail every 15 minutes
- ✅ Generate AI follow-up messages
- ✅ Send messages back to BoldTrail when approved
- ✅ Log all activity in your CRM

---

## 📞 Need Help?

If you get stuck, check:
1. Backend console for error messages
2. Browser console (F12) for frontend errors
3. `backend/agentassist.db` should exist after first run
4. Both servers should show "Running" in their windows

The most common issue is **forgetting to add the BoldTrail API key** to `.env` - double check that first!
