"""
Reset database - create all tables
Run this once to fix missing tables
"""

import os
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'sqlite:///./agentassist.db')

from app.core.database import Base, engine
from app.models.user import User
from app.models.leads import Lead
from app.models.team import Team, Task, TaskAssignment

print("🔄 Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("✨ Creating all tables...")
Base.metadata.create_all(bind=engine)

print("✅ Database reset complete!")
print(f"Tables created: {', '.join(Base.metadata.tables.keys())}")
