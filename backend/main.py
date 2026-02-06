"""
AgentAssist - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import test, auth, teams, team_leads, activities
from app.api.routes import leads as leads_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup - initialize database
    print(f"🚀 AgentAssist API starting on {settings.ENVIRONMENT} environment")
    try:
        init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization error: {e}")
    
    yield
    
    # Shutdown
    print("👋 AgentAssist API shutting down")

app = FastAPI(
    title="AgentAssist API",
    description="Real Estate AI Automation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(test.router, prefix="/api/test", tags=["Test"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(leads_routes.router, prefix="/api/leads", tags=["Leads"])
app.include_router(activities.router, prefix="/api/leads", tags=["Activities"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(team_leads.router, prefix="/api/team-leads", tags=["Team Leads"])

@app.get("/")
async def root():
    return {
        "app": "AgentAssist API",
        "version": "1.0.0",
        "status": "operational",
        "environment": settings.ENVIRONMENT
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get port from environment (for Railway/Render deployment)
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG
    )
