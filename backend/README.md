# AgentAssist Backend

FastAPI backend for AI-powered real estate automation.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

**Critical Security Setup:**

Generate your encryption key (required for CRM credential security):

```bash
python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
```

Add the output to your `.env` as `ENCRYPTION_KEY`.

Generate your secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add the output as `SECRET_KEY`.

### 3. Database Setup

Create PostgreSQL database:

```bash
createdb agentassist
```

Apply schema:

```bash
psql -U your_username -d agentassist -f ../database/schema.sql
```

Or use Supabase and run the SQL in their query editor.

### 4. Run Server

```bash
uvicorn main:app --reload
```

Server runs at http://localhost:8000

API docs: http://localhost:8000/docs

## 📁 Project Structure

```
app/
├── api/
│   └── routes/          # API endpoint routers
│       ├── auth.py      # Authentication
│       ├── crm.py       # CRM connection & sync
│       ├── leads.py     # Lead management
│       ├── messages.py  # Message approvals & sending
│       └── social.py    # Social media scheduling
├── core/
│   ├── config.py        # Configuration management
│   └── security.py      # Encryption, hashing, JWT
├── crm/
│   ├── base.py          # CRM_Handler base class
│   ├── followupboss.py  # Follow Up Boss implementation
│   └── __init__.py      # CRM factory
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic schemas (DTOs)
└── services/
    ├── hunter.py        # The Hunter scraper
    ├── ai_agent.py      # AI message generation
    └── social.py        # Social media posting
```

## 🔐 Security Architecture

### Credential Encryption

All CRM API keys and OAuth tokens are encrypted using **AES-256-GCM** before storage:

1. User connects CRM via UI
2. Credentials are sent over HTTPS
3. Backend encrypts using `app.core.security.encrypt_credentials()`
4. Encrypted blob + IV stored in `crm_connections` table
5. On retrieval, decrypted in memory only

**Never log or expose decrypted credentials.**

### Database Security

- Use Supabase Row Level Security (RLS) policies
- Ensure `user_id` foreign keys are indexed
- Encrypted columns are TEXT type (base64 encoded ciphertext)

## 🔌 CRM Integration Guide

### Adding a New CRM Provider

1. Create `app/crm/your_crm.py`:

```python
from app.crm.base import CRM_Handler, CRMLead

class YourCRM(CRM_Handler):
    def __init__(self, credentials):
        super().__init__(credentials)
        self.provider = "your_crm"
        self.api_key = credentials.get("api_key")
    
    async def validate_connection(self):
        # Test API connection
        pass
    
    async def get_leads(self, statuses, tags, limit):
        # Fetch leads from API
        pass
    
    # Implement other required methods...
```

2. Register in `app/crm/__init__.py`:

```python
from app.crm.your_crm import YourCRM

# In CRMFactory.create_handler():
elif provider == "your_crm":
    return YourCRM(credentials)
```

3. Add provider to database enum (if using enums)

4. Update frontend dropdown in `frontend/app/settings/crm/page.tsx`

### CRM Testing

```python
# Test your CRM handler
from app.crm import CRMFactory
from app.core.security import encrypt_credentials, decrypt_credentials

# Encrypt test credentials
encrypted, iv = encrypt_credentials({
    "api_key": "test-key-123"
})

# Decrypt and create handler
creds = decrypt_credentials(encrypted, iv)
handler = CRMFactory.create_handler("followupboss", creds)

# Test connection
is_valid = await handler.validate_connection()
print(f"Connection valid: {is_valid}")

# Fetch leads
leads = await handler.get_leads(statuses=["New"], limit=10)
print(f"Found {len(leads)} leads")
```

## 🤖 AI Agent Workflows

### Smart Lead Follow-Up (Workflow A)

Cron job runs every 15 minutes (Celery task):

1. Query all active users with `followup_enabled=True`
2. For each user:
   - Get CRM handler from encrypted credentials
   - Fetch new leads matching configured statuses/tags
   - For each lead:
     - Generate personalized message using GPT-4
     - If `autopilot_enabled`: send directly via CRM
     - Else: create pending approval in database
3. Notify user of pending approvals

### The Hunter (Workflow B)

Daily cron at 8:00 AM:

1. Query all users with Hunter enabled
2. For each user's ZIP codes:
   - Scrape Zillow FSBO
   - Scrape Craigslist
   - Parse County Clerk data (if available)
3. For each found property:
   - Enrich with Skip Trace API
   - Store in `leads` table with source="The Hunter"
   - Generate icebreaker message
4. Notify user via dashboard

### Listing Launchpad (Workflow C)

On-demand (user uploads photos):

1. Upload images to storage
2. Use GPT-4o Vision API to analyze each photo
3. Extract features (e.g., "granite counters", "hardwood floors")
4. Generate 3 description variations
5. Generate social captions + hashtags
6. Schedule posts via Meta APIs
7. Output flyer JSON

## 📊 Background Jobs (Celery)

Required for production:

```bash
# Start Redis
redis-server

# Start Celery worker
celery -A app.celery_app worker --loglevel=info

# Start Celery beat (for cron jobs)
celery -A app.celery_app beat --loglevel=info
```

Jobs:
- `sync_crm_leads` (every 15 min)
- `hunter_scan` (daily at 8:00 AM)
- `send_pending_message` (on approval)
- `post_social_media` (scheduled posts)

## 🧪 Testing

```bash
pytest tests/
```

### Manual API Testing

Use the interactive docs at http://localhost:8000/docs

Or with curl:

```bash
# Health check
curl http://localhost:8000/health

# Test CRM connection (requires auth token)
curl -X POST http://localhost:8000/api/crm/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "followupboss", "api_key": "YOUR_KEY"}'
```

## 🚨 Production Deployment

1. **Environment Variables:** Use secrets manager (AWS Secrets Manager, etc.)
2. **Database:** Supabase with RLS enabled
3. **Redis:** Use managed Redis (Upstash, Redis Cloud)
4. **Web Server:** Gunicorn with Uvicorn workers
5. **Reverse Proxy:** Nginx or Cloudflare
6. **Monitoring:** Sentry for error tracking
7. **Rate Limiting:** Implement per-user API limits

**Deployment command:**

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📝 License

Proprietary - AgentAssist Platform
