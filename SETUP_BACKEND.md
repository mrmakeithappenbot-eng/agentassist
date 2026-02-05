# 🚀 Backend Setup - Connect Your Real BoldTrail Data

## Step 1: Install Python (Windows)

1. Download Python 3.11+ from https://www.python.org/downloads/
2. During installation, **CHECK "Add Python to PATH"**
3. Open PowerShell and verify:
```powershell
python --version
pip --version
```

## Step 2: Install Backend Dependencies

Open PowerShell in the `agentassist` directory and run:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## Step 3: Configure Environment

Edit `backend/.env` and add your BoldTrail API key:

```env
# Your BoldTrail API Key
BOLDTRAIL_API_KEY=your-actual-api-key-here

# Database (we'll use SQLite for quick setup)
DATABASE_URL=sqlite:///./agentassist.db

# These are already set (keep as is)
SECRET_KEY=ufS_NhHk6sgjvTft9Ma4ByFis4KqRfrioW3go0eI6Xo
ENCRYPTION_KEY=ISvmkFz05mu0YtIDVoTePa9TfnQV7w4DpeyBEyobjtY=
```

## Step 4: Start Backend Server

```powershell
cd backend
.\venv\Scripts\activate
python startup.py
```

You should see:
```
🚀 AgentAssist Backend Starting...
✓ Configuration loaded
✓ Database initialized
✓ Server running at http://localhost:8000
```

## Step 5: Test BoldTrail Connection

Open a new PowerShell window:

```powershell
cd backend
.\venv\Scripts\activate
python test_boldtrail.py
```

You should see your real leads!

## Step 6: Connect Frontend to Backend

The frontend is already configured to talk to `http://localhost:8000`

Just refresh your browser and try connecting again!

## 🎯 What You'll See

After completing these steps:
- ✅ Real leads from BoldTrail in dashboard
- ✅ Actual contact names, emails, phones
- ✅ Real lead statuses and tags
- ✅ Your actual BoldTrail data everywhere

## 🆘 Troubleshooting

### "Python not found"
- Reinstall Python with "Add to PATH" checked
- Restart PowerShell

### "pip install fails"
- Try: `python -m pip install --upgrade pip`
- Then retry: `pip install -r requirements.txt`

### "Database error"
- Delete `agentassist.db` file
- Restart backend server

### "BoldTrail API error"
- Check your API key in `.env`
- Verify API key is active in BoldTrail dashboard
- Check BoldTrail API documentation for correct endpoint URL

## 📞 Next Steps

Once backend is running:
1. Go to http://localhost:3000/settings/crm
2. Select BoldTrail
3. Enter your API key
4. Click "Connect & Validate"
5. Backend will validate and store your connection
6. Dashboard will show your real data!
