# 🚀 Copy & Paste Setup - No Thinking Required

Just follow these steps EXACTLY. Copy and paste each command.

---

## Step 1: Install Python (5 minutes)

1. Open your web browser
2. Go to: https://www.python.org/downloads/
3. Click the big yellow button "Download Python 3.12.x"
4. Run the downloaded file
5. ⚠️ **IMPORTANT:** Check the box "Add Python to PATH"
6. Click "Install Now"
7. Wait for it to finish
8. Click "Close"

---

## Step 2: Test Python (30 seconds)

1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter
4. A black window opens
5. Type this and press Enter:
   ```
   python --version
   ```
6. Should say "Python 3.12.x"
7. If it says "python not found", restart your computer and try again

---

## Step 3: Go to Backend Folder (1 minute)

**In the same black command window, copy and paste this:**

```cmd
cd /d \\wsl$\Ubuntu\home\logrealbot\.openclaw\workspace\agentassist\backend
```

Press Enter.

You should see something like:
```
\\wsl$\Ubuntu\home\logrealbot\.openclaw\workspace\agentassist\backend>
```

---

## Step 4: Create Virtual Environment (1 minute)

**Copy and paste this:**

```cmd
python -m venv venv
```

Press Enter. Wait 30 seconds. You'll see nothing, then you're back to the prompt.

---

## Step 5: Activate Virtual Environment (10 seconds)

**Copy and paste this:**

```cmd
venv\Scripts\activate
```

Press Enter.

You should now see `(venv)` at the start of your line.

---

## Step 6: Install Packages (3 minutes)

**Copy and paste this:**

```cmd
pip install fastapi uvicorn httpx python-dotenv
```

Press Enter. Wait 2-3 minutes. You'll see lots of text scrolling. That's good!

When done, you'll see something like:
```
Successfully installed fastapi-0.109.0 uvicorn-0.27.0 ...
```

---

## Step 7: Add Your BoldTrail API Key (1 minute)

1. Open Notepad
2. Go to File → Open
3. Paste this path:
   ```
   \\wsl$\Ubuntu\home\logrealbot\.openclaw\workspace\agentassist\backend\.env
   ```
4. Click Open
5. Find the line that says: `BOLDTRAIL_API_KEY=`
6. Change it to: `BOLDTRAIL_API_KEY=your-actual-api-key-here`
   (Put your real API key after the = sign)
7. Save and close Notepad

---

## Step 8: Start Backend Server (30 seconds)

**Back in the black command window, copy and paste this:**

```cmd
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Press Enter.

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Keep this window open!** Don't close it.

---

## Step 9: Test Backend (30 seconds)

1. Open your web browser
2. Go to: http://localhost:8000
3. You should see: `{"app":"AgentAssist API","status":"operational"}`

If you see that, **IT'S WORKING!**

---

## Step 10: Connect BoldTrail (1 minute)

1. Go to: http://localhost:3000/settings/crm
2. Click on BoldTrail (🚀)
3. Enter your API key
4. Click "Connect & Validate"
5. Wait 2 seconds
6. You'll be taken to the dashboard
7. **YOU SHOULD SEE YOUR REAL BOLDTRAIL DATA!**

---

## ✅ Done!

If you made it here, everything is working!

**Keep these windows open:**
- Command window with backend server
- Browser with http://localhost:3000

---

## 🆘 If Something Goes Wrong

### "python not found"
→ Reinstall Python and check "Add to PATH"
→ Restart computer
→ Try again from Step 2

### "pip not found"
→ Type: `python -m pip --version`
→ If that doesn't work, reinstall Python

### "Cannot find path"
→ Make sure you typed the path exactly as shown in Step 3
→ Check if WSL is running

### "Port 8000 already in use"
→ Close any other programs using port 8000
→ Or change 8000 to 8001 in the command

### Backend shows errors
→ Copy the error message
→ Tell me what it says
→ I can help fix it

---

## 📋 Summary

What you just did:
1. ✅ Installed Python
2. ✅ Created virtual environment
3. ✅ Installed backend packages
4. ✅ Added API key
5. ✅ Started backend server
6. ✅ Connected BoldTrail
7. ✅ Seeing real data!

**Total time:** About 15 minutes

---

## 🎉 Congratulations!

Your AgentAssist platform is now fully operational with:
- ✅ Real BoldTrail leads
- ✅ AI message generation
- ✅ Lead follow-up automation
- ✅ The Hunter (FSBO finder)
- ✅ Team management
- ✅ Full dashboard

All from your real BoldTrail account!
