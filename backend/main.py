"""
AgentAssist - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import auth, crm, messages, social, webhooks
from app.api.routes import leads as leads_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print(f"🚀 AgentAssist API starting on {settings.ENVIRONMENT} environment")
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
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(crm.router, prefix="/api/crm", tags=["CRM"])
app.include_router(leads_routes.router, prefix="/api/leads", tags=["Leads"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(social.router, prefix="/api/social", tags=["Social Media"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])

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
