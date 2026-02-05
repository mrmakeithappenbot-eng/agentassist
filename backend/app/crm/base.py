"""
CRM_Handler Base Class
Standard interface for all CRM integrations
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class CRMProvider(str, Enum):
    """Supported CRM providers"""
    FOLLOWUPBOSS = "followupboss"
    KVCORE = "kvcore"
    LIONDESK = "liondesk"
    SALESFORCE = "salesforce"
    HUBSPOT = "hubspot"
    BOOMTOWN = "boomtown"
    BOLDTRAIL = "boldtrail"

class LeadStatus(str, Enum):
    """Standard lead statuses across CRMs"""
    NEW = "new"
    ATTEMPTED_CONTACT = "attempted_contact"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    APPOINTMENT_SET = "appointment_set"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

class CRMLead:
    """Standardized lead object across all CRMs"""
    
    def __init__(
        self,
        crm_lead_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        status: Optional[str] = None,
        tags: Optional[List[str]] = None,
        price_range_min: Optional[int] = None,
        price_range_max: Optional[int] = None,
        location: Optional[str] = None,
        last_activity_at: Optional[datetime] = None,
        notes: Optional[str] = None,
        custom_fields: Optional[Dict[str, Any]] = None
    ):
        self.crm_lead_id = crm_lead_id
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.phone = phone
        self.status = status
        self.tags = tags or []
        self.price_range_min = price_range_min
        self.price_range_max = price_range_max
        self.location = location
        self.last_activity_at = last_activity_at
        self.notes = notes
        self.custom_fields = custom_fields or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage"""
        return {
            "crm_lead_id": self.crm_lead_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "status": self.status,
            "tags": self.tags,
            "price_range_min": self.price_range_min,
            "price_range_max": self.price_range_max,
            "location": self.location,
            "last_activity_at": self.last_activity_at.isoformat() if self.last_activity_at else None,
            "notes": self.notes,
            "custom_fields": self.custom_fields
        }

class CRM_Handler(ABC):
    """
    Abstract base class for all CRM integrations
    Each CRM provider must implement these methods
    """
    
    def __init__(self, credentials: Dict[str, Any]):
        """
        Initialize the CRM handler with decrypted credentials
        
        Args:
            credentials: Dictionary containing API keys, tokens, etc.
        """
        self.credentials = credentials
        self.provider = None  # Set by subclass
    
    @abstractmethod
    async def validate_connection(self) -> bool:
        """
        Test the API connection and credentials
        Returns True if valid, False otherwise
        """
        pass
    
    @abstractmethod
    async def get_leads(
        self,
        statuses: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[CRMLead]:
        """
        Fetch leads from the CRM
        
        Args:
            statuses: Filter by lead status (e.g., ["New", "Attempted Contact"])
            tags: Filter by tags (e.g., ["Zillow Lead"])
            limit: Maximum number of leads to return
        
        Returns:
            List of CRMLead objects
        """
        pass
    
    @abstractmethod
    async def get_lead_by_id(self, lead_id: str) -> Optional[CRMLead]:
        """
        Fetch a single lead by CRM ID
        """
        pass
    
    @abstractmethod
    async def send_email(
        self,
        lead_id: str,
        subject: str,
        body: str
    ) -> Dict[str, Any]:
        """
        Send an email to a lead via the CRM
        
        Returns:
            Dictionary with 'success' (bool) and 'message_id' (str)
        """
        pass
    
    @abstractmethod
    async def send_sms(
        self,
        lead_id: str,
        body: str
    ) -> Dict[str, Any]:
        """
        Send an SMS to a lead via the CRM
        
        Returns:
            Dictionary with 'success' (bool) and 'message_id' (str)
        """
        pass
    
    @abstractmethod
    async def create_note(
        self,
        lead_id: str,
        note_text: str
    ) -> Dict[str, Any]:
        """
        Create a note/activity in the CRM for audit trail
        
        Returns:
            Dictionary with 'success' (bool) and 'note_id' (str)
        """
        pass
    
    @abstractmethod
    async def update_lead_status(
        self,
        lead_id: str,
        new_status: str
    ) -> bool:
        """
        Update the status of a lead
        """
        pass
    
    @abstractmethod
    async def add_lead_tag(
        self,
        lead_id: str,
        tag: str
    ) -> bool:
        """
        Add a tag to a lead
        """
        pass
    
    async def create_lead(self, lead_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new lead in the CRM (used by "The Hunter")
        
        Returns:
            CRM lead ID if successful, None otherwise
        """
        # Optional - not all CRMs may support this via API
        raise NotImplementedError(f"{self.provider} does not support lead creation via API")
