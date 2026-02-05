# 🔗 BoldTrail + Zapier Integration Setup

Since BoldTrail doesn't have a direct REST API, we'll use **Zapier** to connect BoldTrail leads to AgentAssist!

---

## 📋 What You Need:

- ✅ BoldTrail account (you have this)
- ✅ Zapier account (free tier works!)
- ✅ Your BoldTrail Zapier API key (you have this)
- ✅ AgentAssist backend URL: `https://agentassist-1.onrender.com`

---

## 🚀 Setup Steps (10 Minutes):

### **Step 1: Create Zapier Account**

1. Go to https://zapier.com/sign-up
2. Sign up (free account is fine)
3. Verify your email

---

### **Step 2: Create a New Zap**

1. Click **"Create Zap"** (big orange button)
2. Name it: **"BoldTrail → AgentAssist"**

---

### **Step 3: Set Up Trigger (BoldTrail)**

1. **Search for:** "BoldTrail" in the trigger search
2. **Select event:** Choose one of:
   - "New Contact" (recommended - triggers when a new lead is added)
   - "New Lead"
   - "Updated Contact"
3. **Click "Continue"**
4. **Connect BoldTrail:**
   - Click "Sign in to BoldTrail"
   - Enter your BoldTrail Zapier API key
   - Authorize the connection
5. **Test the trigger:**
   - Zapier will pull a sample lead from BoldTrail
   - Click "Continue"

---

### **Step 4: Set Up Action (Webhook to AgentAssist)**

1. **Click "+ Add Step"**
2. **Search for:** "Webhooks by Zapier"
3. **Select:** "POST" (send data)
4. **Click "Continue"**
5. **Configure the webhook:**

   **URL:**
   ```
   https://agentassist-1.onrender.com/api/webhooks/boldtrail
   ```

   **Payload Type:** `JSON`

   **Data:** (Map BoldTrail fields - click "+ Add" for each)
   ```
   first_name: [Select "First Name" from BoldTrail]
   last_name: [Select "Last Name" from BoldTrail]
   email: [Select "Email" from BoldTrail]
   phone: [Select "Phone" from BoldTrail]
   status: [Select "Status" from BoldTrail or type "New"]
   id: [Select "ID" from BoldTrail]
   ```

   **Headers:** (optional, leave blank for now)

6. **Click "Continue"**

---

### **Step 5: Test Your Zap**

1. Click **"Test & Continue"**
2. Zapier will send a test lead to AgentAssist
3. You should see: ✅ **"Success! We sent your test to Webhooks by Zapier"**
4. Click **"Publish Zap"**

---

### **Step 6: Turn On Your Zap**

1. Toggle the switch to **ON**
2. Your Zap is now live! 🎉

---

## ✅ What Happens Now:

**Every time a new lead is added to BoldTrail:**
1. Zapier detects it
2. Sends the lead data to AgentAssist
3. AgentAssist receives it and can:
   - Store it in the database
   - Generate AI follow-up messages
   - Assign it to a team member
   - Send automated responses

---

## 🧪 Testing It:

**To verify it's working:**

1. **Add a test lead in BoldTrail** (or wait for a real one)
2. **Check Zapier dashboard** - you should see "Zap Runs" showing successful triggers
3. **Check AgentAssist backend logs** - look for "📥 Received BoldTrail lead"

**Or test the webhook directly:**

Go to: https://agentassist-1.onrender.com/api/webhooks/boldtrail/test

You should see setup instructions!

---

## 🔧 Troubleshooting:

**Zap not triggering?**
- Make sure the Zap is turned ON
- Check that BoldTrail connection is authorized
- Try "Test Trigger" again in Zapier

**Webhook not receiving data?**
- Check the webhook URL is correct
- Look at Zapier task history for errors
- Check AgentAssist is live: https://agentassist-1.onrender.com

**Fields not mapping correctly?**
- Go back to Zapier and re-map the fields
- Make sure you're selecting the right BoldTrail fields

---

## 🎯 Next Steps After Setup:

Once your Zap is working, you can:

1. **View leads in AgentAssist dashboard**
2. **Generate AI follow-up messages**
3. **Auto-assign to team members**
4. **Track response rates**
5. **Set up automated workflows**

---

## 💡 Advanced: Bi-Directional Sync

Later, you can create a **reverse Zap**:
- **Trigger:** AgentAssist webhook (when message is approved)
- **Action:** Update lead in BoldTrail

This way changes in AgentAssist flow back to BoldTrail!

---

## 📞 Need Help?

Check:
- Zapier help docs: https://help.zapier.com
- AgentAssist webhook test: https://agentassist-1.onrender.com/api/webhooks/boldtrail/test

---

**Ready to set up your Zap? Go to https://zapier.com and follow the steps above!** 🚀
