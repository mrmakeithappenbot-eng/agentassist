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
    due_date = Column(DateTime, nullable=True)
    
    # Visibility
    share_with_team = Column(Boolean, default=True)
    is_private = Column(Boolean, default=False)  # Only for team leaders
    
    # Relationships
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    creator = relationship("User", foreign_keys=[creator_id])
    team = relationship("Team", back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    
    # Relationships
    task = relationship("Task", back_populates="assignments")
    assignee = relationship("User", foreign_keys=[assignee_id])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
