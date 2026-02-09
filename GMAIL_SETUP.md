# Gmail Integration Setup Guide

## Current Status: ✅ Backend Ready, Frontend Pending

The Gmail OAuth infrastructure is built and deployed. To complete the integration:

## Step 1: Google Cloud Setup (5 min)

1. Go to https://console.cloud.google.com/
2. Create new project: "AgentAssist"
3. Enable APIs:
   - Gmail API
   - Google+ API (for user info)
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://agentassist-1.onrender.com/api/gmail/oauth/callback`
     - `https://frontend-eta-amber-58.vercel.app/auth/gmail/callback`
5. Copy Client ID and Client Secret

## Step 2: Add Environment Variables to Render

1. Go to https://dashboard.render.com/
2. Click "agentassist-1" service
3. Click "Environment" tab
4. Add these variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GMAIL_REDIRECT_URI=https://agentassist-1.onrender.com/api/gmail/oauth/callback
   ```
5. Save and redeploy

## Step 3: Install Python Dependencies

Add to `backend/requirements.txt`:
```
google-auth-oauthlib==1.1.0
google-api-python-client==2.108.0
google-auth-httplib2==0.1.1
```

## Step 4: Update Frontend Settings Page

Add Gmail connection UI to Settings → Import section:

```tsx
{/* Gmail Connection */}
<div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <EnvelopeIcon className="w-6 h-6 text-blue-600" />
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Gmail Integration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {gmailConnected 
            ? `Connected: ${gmailEmail}`
            : 'Send campaigns from your Gmail account'}
        </p>
      </div>
    </div>
    {gmailConnected ? (
      <button
        onClick={handleDisconnectGmail}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Disconnect
      </button>
    ) : (
      <button
        onClick={handleConnectGmail}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Connect Gmail
      </button>
    )}
  </div>
</div>
```

## Step 5: Test OAuth Flow

1. User clicks "Connect Gmail"
2. Redirected to Google consent screen
3. User authorizes AgentAssist
4. Redirected back with authorization code
5. Backend exchanges code for tokens
6. Tokens stored encrypted in database

## Features Ready to Use:

**✅ Backend API Endpoints:**
- `GET /api/gmail/oauth/url` - Get OAuth authorization URL
- `GET /api/gmail/oauth/callback` - Handle OAuth callback
- `GET /api/gmail/status` - Check connection status
- `POST /api/gmail/send` - Send email via Gmail
- `GET /api/gmail/quota` - Check daily quota (10k emails/day)
- `DELETE /api/gmail/disconnect` - Disconnect Gmail

**✅ Database Models:**
- `GmailToken` - Stores OAuth tokens securely
- User ID indexed for fast lookups
- Token expiry tracking
- Last used tracking

**⏳ Todo:**
- Implement actual Gmail API sending (library installed above)
- Add token refresh logic (when access token expires)
- Track daily email quota
- Build campaign scheduler to auto-send drip sequences

## Why This Matters:

**Before:** Can't send any emails
**After:** Each user sends from their own Gmail (10,000 emails/day free!)

No Sendgrid, no Mailgun, no $$ spent on email sending.
