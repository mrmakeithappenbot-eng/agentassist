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
    "sqlite:///./agentassist.db"  # Default to SQLite for simplicity
)

# Create engine with appropriate settings for SQLite or PostgreSQL
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # Needed for SQLite
    )
else:
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
    try:
        # Import all models to register them with Base
        from app.models.user import User
        from app.models.leads import Lead
        from app.models.activity import LeadActivity
        from app.models.team_simple import Team, Task, TaskAssignment
        
        # Create all tables (only creates missing ones)
        Base.metadata.create_all(bind=engine)
        
        # List tables created
        table_names = list(Base.metadata.tables.keys())
        print(f"✅ Database initialized with tables: {', '.join(table_names)}")
        
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        import traceback
        traceback.print_exc()
        # Try to continue anyway
        pass

def reset_db():
    """
    Drop and recreate all tables (USE WITH CAUTION!)
    Only for development
    """
    # Import all models
    from app.models.database import User, Team, Task, TaskAssignment, MorningDigest, MarketStats
    from app.models.leads import Lead
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("⚠️ Database reset complete")
