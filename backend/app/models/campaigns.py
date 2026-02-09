"""
Campaign Database Models
Drip email/SMS campaigns for lead nurturing
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # Owner
    
    # Campaign details
    name = Column(String, nullable=False)
    campaign_type = Column(String, nullable=False)  # email, sms, both
    status = Column(String, default="draft")  # draft, active, paused, completed
    
    # Targeting
    target_tags = Column(JSON, default=[])  # Filter leads by tags
    target_status = Column(JSON, default=[])  # Filter leads by status
    
    # Stats
    leads_count = Column(Integer, default=0)  # Leads enrolled
    sent_count = Column(Integer, default=0)  # Total messages sent
    open_rate = Column(Integer, default=0)  # Percentage
    reply_rate = Column(Integer, default=0)  # Percentage
    
    # Gmail integration
    gmail_enabled = Column(Boolean, default=False)  # Use Gmail API
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    
    # Relationships
    steps = relationship("CampaignStep", back_populates="campaign", cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'name': self.name,
            'type': self.campaign_type,
            'status': self.status,
            'target_tags': self.target_tags or [],
            'target_status': self.target_status or [],
            'leads_count': self.leads_count,
            'sent_count': self.sent_count,
            'open_rate': self.open_rate,
            'reply_rate': self.reply_rate,
            'gmail_enabled': self.gmail_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'steps': [step.to_dict() for step in self.steps] if self.steps else []
        }


class CampaignStep(Base):
    __tablename__ = "campaign_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaigns.id'), nullable=False)
    
    # Step details
    step_order = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    delay_days = Column(Integer, default=0)  # Days after previous step (0 = immediate)
    
    # Message content
    step_type = Column(String, nullable=False)  # email, sms
    subject = Column(String, nullable=True)  # Email only
    body = Column(Text, nullable=False)
    
    # Stats
    sent_count = Column(Integer, default=0)
    open_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="steps")
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'step_order': self.step_order,
            'delay_days': self.delay_days,
            'type': self.step_type,
            'subject': self.subject,
            'body': self.body,
            'sent_count': self.sent_count,
            'open_count': self.open_count,
            'click_count': self.click_count,
            'reply_count': self.reply_count
        }


class CampaignEnrollment(Base):
    """Track which leads are enrolled in which campaigns"""
    __tablename__ = "campaign_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaigns.id'), nullable=False)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
    
    # Status
    status = Column(String, default="active")  # active, paused, completed, unsubscribed
    current_step = Column(Integer, default=0)  # Which step they're on
    
    # Engagement tracking
    last_sent_at = Column(DateTime, nullable=True)
    last_opened_at = Column(DateTime, nullable=True)
    last_clicked_at = Column(DateTime, nullable=True)
    replied = Column(Boolean, default=False)  # Pause campaign if they reply
    
    # Timestamps
    enrolled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'lead_id': self.lead_id,
            'status': self.status,
            'current_step': self.current_step,
            'last_sent_at': self.last_sent_at.isoformat() if self.last_sent_at else None,
            'replied': self.replied,
            'enrolled_at': self.enrolled_at.isoformat() if self.enrolled_at else None
        }
