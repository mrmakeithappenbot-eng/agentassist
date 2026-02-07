"""
User Model for Database
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from passlib.context import CryptContext
from app.core.database import Base

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_team_leader = Column(Boolean, default=False)
    
    # Team ID (no foreign key to avoid creation order issues)
    team_id = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # Note: Relationships removed to work with team_simple.py (no foreign keys)
    # If you need relationships, ensure the referenced models exist and have matching columns
    
    def verify_password(self, password: str) -> bool:
        """Check if provided password matches hash"""
        return pwd_context.verify(password, self.hashed_password)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': str(self.id),
            'email': self.email,
            'full_name': self.full_name,
            'is_active': self.is_active,
            'is_team_leader': self.is_team_leader,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
