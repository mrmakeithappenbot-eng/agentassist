# AgentAssist - Real Estate AI Automation Platform

A SaaS platform enabling Real Estate Agents to deploy autonomous AI employees for lead follow-up and social media management.

## 🚀 Quick Start

### Option 1: Deploy to Cloud (Recommended - 10 minutes)

**No Python installation needed!**

1. Open: **`DEPLOY_NOW.md`**
2. Choose Railway or Render
3. Follow the guide
4. Your backend will be live in 10 minutes
5. Connect your BoldTrail account
6. See real data!

### Option 2: Run Locally (15 minutes)

**Requires Python on Windows**

1. Open: **`START_HERE.md`**
2. Install Python
3. Run setup
4. Start backend
5. Connect BoldTrail

---

## 📂 Project Structure

```
agentassist/
├── frontend/          # Next.js web application
│   ├── app/          # Pages (dashboard, settings, etc.)
│   └── components/   # React components
├── backend/          # FastAPI server + AI agents
│   ├── app/         # Application code
│   │   ├── api/     # API routes
│   │   ├── crm/     # CRM integrations
│   │   └── services/# Business logic
│   └── database/    # SQL schemas
└── docs/            # Documentation
```

---

## 🎯 Features

### ✅ Smart Lead Follow-Up
- AI-generated personalized messages
- Manual approval or auto-pilot mode
- Logs activity back to CRM
- Email & SMS support

### ✅ The Hunter (FSBO Scraper)
- Automated FSBO & expired listing finder
- Daily scans of Zillow, Craigslist
- Contact enrichment via Skip Trace
- AI-generated icebreaker messages

### ✅ Listing Launchpad
- Upload property photos
- AI vision analysis (GPT-4o)
- Generate 3 description styles
- Create social media captions
- Output flyer-ready data

### ✅ Team Mode
- Round-robin lead assignment
- Response timeout monitoring
- Auto-reassignment if no response
- SMS notifications to agents
- Performance tracking

---

## 🔌 Supported CRMs

1. **Follow Up Boss** ✅ (Fully Implemented)
2. **BoldTrail** ✅ (Fully Implemented)
3. kvCORE (Coming Soon)
4. LionDesk (Coming Soon)
5. Salesforce (Coming Soon)
6. HubSpot (Coming Soon)
7. BoomTown (Coming Soon)

---

## 🏗️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- TypeScript

**Backend:**
- Python 3.12
- FastAPI
- PostgreSQL (Supabase)
- Celery (background jobs)

**AI/ML:**
- OpenAI GPT-4 (message generation)
- GPT-4o Vision (image analysis)
- Anthropic Claude (optional)

**Infrastructure:**
- Docker (containerization)
- Railway/Render (deployment)
- GitHub Actions (CI/CD)

---

## 🔐 Security

- AES-256-GCM encryption for CRM credentials
- JWT authentication
- Row-level security (PostgreSQL RLS)
- HTTPS/SSL by default
- Environment variable secrets
- Password hashing with bcrypt

---

## 📊 Current Status

✅ **Complete:**
- Frontend (all pages)
- Backend (all APIs)
- BoldTrail integration
- Follow Up Boss integration
- The Hunter scraper
- Database schema
- Deployment configs
- Documentation

🔲 **In Progress:**
- Additional CRM providers
- AI message generation (OpenAI integration)
- Social media posting
- Celery background jobs

---

## 📚 Documentation

| File | Description |
|------|-------------|
| `DEPLOY_NOW.md` | 🚀 **START HERE** - Deploy to cloud |
| `START_HERE.md` | Local setup guide |
| `DEPLOY_TO_RAILWAY.md` | Railway deployment (detailed) |
| `DEPLOY_TO_RENDER.md` | Render deployment (detailed) |
| `CONNECT_BOLDTRAIL.md` | BoldTrail setup guide |
| `PROJECT_STATUS.md` | Implementation checklist |
| `CURRENT_STATUS.md` | What's working now |

---

## 🎨 Screenshots

### Dashboard
Professional dark blue theme with real-time stats and pending actions.

### The Hunter
FSBO leads table with property details and AI-generated icebreakers.

### CRM Settings
Connect your CRM with one click - encrypted and secure.

### Listing Launchpad
Upload photos, get instant AI-generated marketing content.

---

## 💰 Pricing

**Development (Free):**
- Deploy on Render (free tier)
- Free PostgreSQL
- $0/month

**Production (Paid):**
- Railway: $5-20/month
- Render: $7-25/month
- OpenAI API: Pay-as-you-go
- Skip Trace API: Optional

---

## 🚀 Deployment Options

### 1. Railway
- ✅ $5 credit/month free
- ✅ Fast deployments
- ✅ Always-on
- 👉 See: `DEPLOY_TO_RAILWAY.md`

### 2. Render
- ✅ 100% free tier
- ✅ PostgreSQL included
- ⚠️ Sleeps after 15min
- 👉 See: `DEPLOY_TO_RENDER.md`

### 3. Local (Windows)
- ✅ Full control
- ⚠️ Requires Python
- 👉 See: `START_HERE.md`

---

## 🧪 Testing

**Test frontend:**
```bash
cd frontend
npm run dev
# Visit http://localhost:3000
```

**Test backend (local):**
```bash
cd backend
python startup.py
# Visit http://localhost:8000
```

**Test BoldTrail connection:**
```bash
cd backend
python test_boldtrail.py
```

---

## 🔄 Development Workflow

1. Make changes to code
2. Test locally
3. Commit to GitHub
4. Push to repository
5. Railway/Render auto-deploys
6. Changes live in ~3 minutes

---

## 🆘 Support

**Common Issues:**
- Backend won't start → Check `.env` file
- CRM connection fails → Verify API key
- Frontend shows mock data → Backend not connected
- Deployment fails → Check logs in Railway/Render

**Documentation:**
- Read relevant `.md` file in project root
- Check `PROJECT_STATUS.md` for feature status
- See `CURRENT_STATUS.md` for current state

---

## 📈 Roadmap

**Phase 1: Core Features** ✅
- CRM integration framework
- Basic UI/UX
- Lead management

**Phase 2: AI Features** 🔄
- Message generation
- The Hunter scraper
- Vision AI for listings

**Phase 3: Team Features** 🔜
- Round-robin routing
- Team analytics
- Multi-agent support

**Phase 4: Advanced** 🔮
- Calendar integration
- Advanced analytics
- Mobile app
- White-label option

---

## 🤝 Contributing

This is a private project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

Proprietary - AgentAssist Platform

---

## 🎉 Get Started

**Ready to deploy?**

👉 Open **`DEPLOY_NOW.md`** and choose your platform!

**Questions?**

👉 Check the documentation files or deployment guides.

---

Built with ❤️ using OpenClaw AI
