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

def migrate_add_column(table_name: str, column_name: str, column_type: str = "TEXT"):
    """
    Add a column to an existing table if it doesn't exist.
    Simple migration helper for SQLite.
    """
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check if column exists
            result = conn.execute(text(f"PRAGMA table_info({table_name})"))
            columns = [row[1] for row in result]
            
            if column_name not in columns:
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
                conn.commit()
                print(f"✅ Added column '{column_name}' to '{table_name}'")
            else:
                print(f"ℹ️ Column '{column_name}' already exists in '{table_name}'")
    except Exception as e:
        print(f"⚠️ Migration warning: {e}")

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
        from app.models.team_simple import Team, Task as TeamTask, TaskAssignment
        from app.models.tasks import Task as UserTask
        from app.models.campaigns import Campaign, CampaignStep, CampaignEnrollment
        from app.models.gmail_oauth import GmailToken
        
        # Create all tables (only creates missing ones)
        Base.metadata.create_all(bind=engine)
        
        # List tables created
        table_names = list(Base.metadata.tables.keys())
        print(f"✅ Database initialized with tables: {', '.join(table_names)}")
        
        # Run migrations for new columns on existing tables
        migrate_add_column("users", "phone", "TEXT")
        migrate_add_column("leads", "address", "TEXT")
        
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
    from app.models.user import User
    from app.models.team_simple import Team, Task, TaskAssignment
    from app.models.leads import Lead
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("⚠️ Database reset complete")
