"""
Core configuration management
Uses pydantic-settings for environment variable loading
"""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "AgentAssist"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = "change-me-in-production"  # For JWT signing
    ENCRYPTION_KEY: str = "change-me-in-production"  # For AES-256 encryption of CRM credentials (32 bytes base64)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./agentassist.db"  # SQLite for now (switch to PostgreSQL later)
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "*",  # Allow all origins for now (tighten in production)
    ]
    
    # AI/LLM
    OPENAI_API_KEY: str = "sk-placeholder"
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_AI_MODEL: str = "gpt-4-turbo"
    VISION_MODEL: str = "gpt-4o"  # For image analysis
    SCRAPER_MODEL: str = "gpt-3.5-turbo"  # Cheap model for scraping tasks
    
    # Redis (for Celery background jobs)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CRM API Keys (for OAuth callbacks)
    FOLLOWUPBOSS_API_KEY: str = ""
    KVCORE_API_KEY: str = ""
    LIONDESK_CLIENT_ID: str = ""
    LIONDESK_CLIENT_SECRET: str = ""
    SALESFORCE_CLIENT_ID: str = ""
    SALESFORCE_CLIENT_SECRET: str = ""
    HUBSPOT_CLIENT_ID: str = ""
    HUBSPOT_CLIENT_SECRET: str = ""
    BOOMTOWN_API_KEY: str = ""
    BOLDTRAIL_API_KEY: str = ""
    
    # Social Media APIs
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    
    # Skip Trace API (for "The Hunter")
    SKIP_TRACE_API_KEY: str = ""
    SKIP_TRACE_API_URL: str = "https://api.skiptrace.example.com"
    
    # Scraper settings
    HUNTER_CRON_TIME: str = "8:00"  # Daily at 8:00 AM
    SCRAPER_USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    
    # Team routing
    LEAD_RESPONSE_TIMEOUT_MINUTES: int = 5  # Re-assign if no response in 5 min
    
    # SMS/Notifications
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
