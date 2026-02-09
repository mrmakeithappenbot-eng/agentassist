"""
Migration: Add user_id column to leads table
Run this once to update the database schema
"""

from app.core.database import engine, SessionLocal
from app.models.leads import Lead
from sqlalchemy import text

def migrate():
    """Add user_id column to existing leads table"""
    db = SessionLocal()
    try:
        print("🔄 Starting migration: Add user_id to leads...")
        
        # Check if user_id column already exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='leads' AND column_name='user_id'
        """))
        
        if result.fetchone():
            print("✅ user_id column already exists, skipping migration")
            return
        
        # Add user_id column (nullable first)
        print("   Adding user_id column...")
        db.execute(text("ALTER TABLE leads ADD COLUMN user_id INTEGER"))
        db.commit()
        
        # For existing leads with no user, we have two options:
        # Option 1: Delete them (clean slate)
        # Option 2: Assign to first user
        
        # Let's check if there are any existing leads
        result = db.execute(text("SELECT COUNT(*) FROM leads"))
        lead_count = result.fetchone()[0]
        
        if lead_count > 0:
            print(f"   Found {lead_count} existing leads")
            
            # Get first user ID
            result = db.execute(text("SELECT id FROM users ORDER BY id LIMIT 1"))
            first_user = result.fetchone()
            
            if first_user:
                first_user_id = first_user[0]
                print(f"   Assigning existing leads to user ID {first_user_id}...")
                db.execute(text(f"UPDATE leads SET user_id = {first_user_id} WHERE user_id IS NULL"))
                db.commit()
            else:
                print("   No users found, deleting existing leads...")
                db.execute(text("DELETE FROM leads"))
                db.commit()
        
        # Now make user_id NOT NULL
        print("   Making user_id NOT NULL...")
        db.execute(text("ALTER TABLE leads ALTER COLUMN user_id SET NOT NULL"))
        db.commit()
        
        # Add index
        print("   Adding index on user_id...")
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads (user_id)"))
        db.commit()
        
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
