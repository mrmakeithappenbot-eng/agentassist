"""
Database Connection and Session Management
PostgreSQL connection using SQLAlchemy
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://localhost/agentassist"
)

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,
    max_overflow=10
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI routes to get database session
    
    Usage:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database - create all tables
    Call this on startup
    """
    from app.models import database  # Import all models
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def reset_db():
    """
    Drop and recreate all tables (USE WITH CAUTION!)
    Only for development
    """
    from app.models import database
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("⚠️ Database reset complete")
