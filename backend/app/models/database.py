"""
Database Models for AgentAssist Team Calendar System
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEAM_LEADER = "team_leader"
    AGENT = "agent"

class TaskType(str, enum.Enum):
    OPTIONAL = "optional"
    MANDATORY = "mandatory"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COMPLETED = "completed"

class TaskCategory(str, enum.Enum):
    AUTO = "auto"  # AI automated
    MANUAL = "manual"  # Requires human action
    TEAM = "team"  # Team assignment

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.AGENT)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    # Google Calendar Integration
    google_calendar_id = Column(String, nullable=True)
    google_refresh_token = Column(String, nullable=True)
    google_access_token = Column(String, nullable=True)
    
    # Morning Digest Settings
    morning_digest_enabled = Column(Boolean, default=True)
    morning_digest_time = Column(String, default="08:00")  # HH:MM format
    timezone = Column(String, default="America/Los_Angeles")
    
    # Relationships
    team = relationship("Team", back_populates="members")
    created_tasks = relationship("Task", foreign_keys="Task.creator_id", back_populates="creator")
    assigned_tasks = relationship("TaskAssignment", back_populates="assignee")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    members = relationship("User", back_populates="team")
    tasks = relationship("Task", back_populates="team")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


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
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    
    # Visibility
    share_with_team = Column(Boolean, default=True)
    is_private = Column(Boolean, default=False)  # Only for team leaders
    
    # Google Calendar
    google_event_id = Column(String, nullable=True)
    
    # Relationships
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    team = relationship("Team", back_populates="tasks")
    assignments = relationship("TaskAssignment", back_populates="task", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


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
    assignee = relationship("User", back_populates="assigned_tasks")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MorningDigest(Base):
    __tablename__ = "morning_digests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sent_date = Column(DateTime, nullable=False)
    
    # Digest content (stored as JSON)
    ai_messaged_leads = Column(JSON, default=[])
    pending_messages = Column(Integer, default=0)
    client_responses = Column(JSON, default=[])
    homes_sold_this_week = Column(Integer, default=0)
    average_home_price = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class MarketStats(Base):
    __tablename__ = "market_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    area = Column(String, nullable=False)  # e.g., "Los Angeles, CA"
    
    # Time period
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    period_type = Column(String, default="weekly")  # weekly, monthly, quarterly, yearly
    
    # Stats
    homes_sold = Column(Integer, default=0)
    average_price = Column(Integer, nullable=True)
    median_price = Column(Integer, nullable=True)
    total_volume = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
