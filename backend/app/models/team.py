"""
Team Management Models
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class TaskType(str, enum.Enum):
    OPTIONAL = "optional"
    MANDATORY = "mandatory"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COMPLETED = "completed"

class TaskCategory(str, enum.Enum):
    MANUAL = "manual"
    AUTO = "auto"  # AI automated
    TEAM = "team"  # Team-wide

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tasks = relationship("Task", back_populates="team")
    
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
    task_type = Column(Enum(TaskType), default=TaskType.OPTIONAL)
    task_category = Column(Enum(TaskCategory), default=TaskCategory.MANUAL)
    
    # Scheduling
    scheduled_for = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    
    # Visibility
    share_with_team = Column(Boolean, default=True)
    is_private = Column(Boolean, default=False)  # Only for team leaders
    
    # Google Calendar integration
    google_calendar_event_id = Column(String, nullable=True)
    
    # Foreign keys
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    team = relationship("Team", back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type.value if self.task_type else None,
            'task_category': self.task_category.value if self.task_category else None,
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
    
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    
    # Response tracking
    responded_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="assignments")
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'assignee_id': self.assignee_id,
            'status': self.status.value if self.status else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DailyUpdate(Base):
    __tablename__ = "daily_updates"
    
    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    # Update content (JSON stored as text)
    ai_messages_sent = Column(Text, nullable=True)  # JSON array of message summaries
    pending_messages_count = Column(Integer, default=0)
    responses_received = Column(Text, nullable=True)  # JSON array of responses
    
    # Market stats
    homes_sold_count = Column(Integer, default=0)
    average_price = Column(Integer, nullable=True)
    stats_period = Column(String, default="weekly")  # weekly, monthly, yearly
    
    # Settings
    preferred_time = Column(String, default="08:00")  # HH:MM format
    
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'team_id': self.team_id,
            'ai_messages_sent': self.ai_messages_sent,
            'pending_messages_count': self.pending_messages_count,
            'responses_received': self.responses_received,
            'homes_sold_count': self.homes_sold_count,
            'average_price': self.average_price,
            'stats_period': self.stats_period,
            'preferred_time': self.preferred_time,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None
        }
