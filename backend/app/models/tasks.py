"""
Task Database Model
Daily tasks for real estate agents
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from datetime import datetime

from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # Owner
    
    # Task details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String, nullable=False)  # call, email, text, meeting, other
    
    # Scheduling
    due_date = Column(String, nullable=False)  # YYYY-MM-DD
    due_time = Column(String, nullable=True)   # HH:MM
    priority = Column(String, default="medium")  # low, medium, high
    
    # Status
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Lead association
    lead_name = Column(String, nullable=True)
    lead_id = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'type': self.task_type,
            'dueDate': self.due_date,
            'dueTime': self.due_time,
            'priority': self.priority,
            'completed': self.completed,
            'completedAt': self.completed_at.isoformat() if self.completed_at else None,
            'leadName': self.lead_name,
            'leadId': self.lead_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
