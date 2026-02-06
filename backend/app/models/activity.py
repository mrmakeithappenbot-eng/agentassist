"""
Lead Activity Database Model
Track all interactions with leads
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime

from app.core.database import Base

class LeadActivity(Base):
    __tablename__ = "lead_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to lead
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    
    # Activity details
    activity_type = Column(String, nullable=False)  # note, call, email, showing, meeting, other
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    
    # Metadata
    created_by = Column(Integer, nullable=True)  # User ID who created this
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'activity_type': self.activity_type,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
