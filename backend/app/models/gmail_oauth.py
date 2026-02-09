"""
Gmail OAuth Token Storage
Securely store user Gmail access tokens
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from datetime import datetime

from app.core.database import Base

class GmailToken(Base):
    __tablename__ = "gmail_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True, index=True)
    
    # OAuth tokens
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_uri = Column(String, default="https://oauth2.googleapis.com/token")
    
    # Token metadata
    scopes = Column(Text, nullable=False)  # JSON array as string
    expiry = Column(DateTime, nullable=True)
    
    # Gmail info
    email_address = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    
    def to_dict(self):
        """Convert to dictionary for API responses (without tokens)"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email_address': self.email_address,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None
        }
