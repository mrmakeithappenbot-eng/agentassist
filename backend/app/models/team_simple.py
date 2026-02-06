"""
Simplified Team Models - No Foreign Keys or Relationships
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from datetime import datetime
from app.core.database import Base

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    leader_id = Column(Integer, nullable=False)  # References users.id (no foreign key)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'leader_id': self.leader_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Task properties
    task_type = Column(String, default="optional")  # optional or mandatory
    task_category = Column(String, default="manual")  # manual, auto, or team
    
    # Scheduling
    due_date = Column(DateTime, nullable=True)
    
    # Visibility
    share_with_team = Column(Boolean, default=True)
    is_private = Column(Boolean, default=False)
    
    # References (no foreign keys)
    creator_id = Column(Integer, nullable=False)  # References users.id
    team_id = Column(Integer, nullable=True)  # References teams.id
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type,
            'task_category': self.task_category,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'share_with_team': self.share_with_team,
            'is_private': self.is_private,
            'creator_id': self.creator_id,
            'team_id': self.team_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TaskAssignment(Base):
    __tablename__ = "task_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    task_id = Column(Integer, nullable=False)  # References tasks.id
    assignee_id = Column(Integer, nullable=False)  # References users.id
    
    status = Column(String, default="pending")  # pending, accepted, declined, completed
    
    # Response tracking
    responded_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'assignee_id': self.assignee_id,
            'status': self.status,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
