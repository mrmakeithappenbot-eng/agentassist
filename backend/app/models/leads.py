"""
Lead Database Models
Persistent storage for imported leads
"""

from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Boolean
from datetime import datetime

# Import shared Base from database.py
from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    
    # Status and categorization
    status = Column(String, default="New")
    tags = Column(JSON, default=[])  # Array of tags
    
    # Location and property preferences
    location = Column(String, nullable=True)  # General area (e.g., "Downtown", "Westside")
    address = Column(String, nullable=True)   # Specific property address
    price_min = Column(Integer, nullable=True)
    price_max = Column(Integer, nullable=True)
    
    # BoldTrail specific fields
    notes = Column(Text, nullable=True)
    deal_type = Column(String, nullable=True)
    source = Column(String, nullable=True)
    rating = Column(String, nullable=True)
    business_type = Column(String, nullable=True)
    
    # Assignment
    assigned_to = Column(Integer, nullable=True)  # User ID assigned to
    assigned_at = Column(DateTime, nullable=True)
    
    # Metadata
    imported_from = Column(String, default="CSV")  # CSV, API, Manual
    imported_by = Column(Integer, nullable=True)  # User ID who imported
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_contact_at = Column(DateTime, nullable=True)  # Last interaction date
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': str(self.id),
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'status': self.status,
            'tags': self.tags or [],
            'location': self.location,
            'address': self.address,
            'price_range_min': self.price_min,
            'price_range_max': self.price_max,
            'notes': self.notes,
            'deal_type': self.deal_type,
            'source': self.source,
            'rating': self.rating,
            'business_type': self.business_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
