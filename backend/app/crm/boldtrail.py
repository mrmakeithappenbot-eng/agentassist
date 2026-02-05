"""
BoldTrail CRM Integration
API Documentation: https://developer.boldtrail.com/
"""

import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.crm.base import CRM_Handler, CRMLead, CRMProvider

class BoldTrailCRM(CRM_Handler):
    """
    BoldTrail CRM implementation
    Authentication: API Key (passed in headers)
    """
    
    BASE_URL = "https://api.boldtrail.com/v1"
    
    def __init__(self, credentials: Dict[str, Any]):
        super().__init__(credentials)
        self.provider = CRMProvider.BOLDTRAIL
        self.api_key = credentials.get("api_key")
        
        if not self.api_key:
            raise ValueError("BoldTrail requires 'api_key' in credentials")
        
        # API key goes in headers
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def validate_connection(self) -> bool:
        """Test the API connection by fetching account info"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/account",
                    headers=self.headers,
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception as e:
            print(f"BoldTrail connection validation failed: {e}")
            return False
    
    async def get_leads(
        self,
        statuses: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[CRMLead]:
        """
        Fetch leads from BoldTrail
        
        Note: Adjust the API endpoint and response parsing based on 
        actual BoldTrail API documentation
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "limit": limit,
                    "sort": "-created_at"
                }
                
                # Add filters if provided
                if statuses:
                    params["status"] = ",".join(statuses)
                
                if tags:
                    params["tags"] = ",".join(tags)
                
                response = await client.get(
                    f"{self.BASE_URL}/contacts",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"BoldTrail API error: {response.status_code} - {response.text}")
                    return []
                
                data = response.json()
                leads = []
                
                # Parse contacts (adjust based on actual API structure)
                for contact in data.get("contacts", []):
                    lead = self._map_contact_to_lead(contact)
                    
                    # Filter by status if provided
                    if statuses:
                        if lead.status and lead.status.lower() in [s.lower() for s in statuses]:
                            leads.append(lead)
                    else:
                        leads.append(lead)
                
                return leads
                
        except Exception as e:
            print(f"Error fetching BoldTrail leads: {e}")
            return []
    
    def _map_contact_to_lead(self, contact: Dict[str, Any]) -> CRMLead:
        """Convert BoldTrail contact to CRMLead"""
        
        # Extract basic info
        first_name = contact.get("first_name")
        last_name = contact.get("last_name")
        
        # Extract contact methods
        email = contact.get("email")
        phone = contact.get("phone")
        
        # Extract tags
        tags = contact.get("tags", [])
        
        # Extract status
        status = contact.get("status") or contact.get("lead_status")
        
        # Extract location
        address = contact.get("address", {})
        location = None
        if address:
            city = address.get("city", "")
            state = address.get("state", "")
            location = f"{city}, {state}".strip(", ")
        
        # Extract price range
        price_min = contact.get("price_min") or contact.get("budget_min")
        price_max = contact.get("price_max") or contact.get("budget_max")
        
        # Extract last activity
        last_activity = contact.get("last_activity_at") or contact.get("updated_at")
        last_activity_dt = None
        if last_activity:
            try:
                last_activity_dt = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
            except:
                pass
        
        # Extract custom fields
        custom_fields = contact.get("custom_fields", {})
        
        return CRMLead(
            crm_lead_id=str(contact.get("id")),
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            status=status,
            tags=tags,
            price_range_min=price_min,
            price_range_max=price_max,
            location=location,
            last_activity_at=last_activity_dt,
            custom_fields=custom_fields
        )
    
    async def get_lead_by_id(self, lead_id: str) -> Optional[CRMLead]:
        """Fetch a single lead by ID"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/contacts/{lead_id}",
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code != 200:
                    return None
                
                contact = response.json()
                return self._map_contact_to_lead(contact)
                
        except Exception as e:
            print(f"Error fetching BoldTrail lead {lead_id}: {e}")
            return None
    
    async def send_email(
        self,
        lead_id: str,
        subject: str,
        body: str
    ) -> Dict[str, Any]:
        """
        Send an email via BoldTrail
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "contact_id": lead_id,
                    "subject": subject,
                    "body": body,
                    "type": "email"
                }
                
                response = await client.post(
                    f"{self.BASE_URL}/activities",
                    headers=self.headers,
                    json=payload,
                    timeout=15.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    return {
                        "success": True,
                        "message_id": str(data.get("id"))
                    }
                else:
                    return {
                        "success": False,
                        "error": f"BoldTrail API error: {response.status_code}"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_sms(
        self,
        lead_id: str,
        body: str
    ) -> Dict[str, Any]:
        """
        Send an SMS via BoldTrail
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "contact_id": lead_id,
                    "body": body,
                    "type": "sms"
                }
                
                response = await client.post(
                    f"{self.BASE_URL}/activities",
                    headers=self.headers,
                    json=payload,
                    timeout=15.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    return {
                        "success": True,
                        "message_id": str(data.get("id"))
                    }
                else:
                    return {
                        "success": False,
                        "error": f"BoldTrail API error: {response.status_code}"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_note(
        self,
        lead_id: str,
        note_text: str
    ) -> Dict[str, Any]:
        """
        Create a note in BoldTrail
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "contact_id": lead_id,
                    "body": note_text,
                    "type": "note"
                }
                
                response = await client.post(
                    f"{self.BASE_URL}/activities",
                    headers=self.headers,
                    json=payload,
                    timeout=15.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    return {
                        "success": True,
                        "note_id": str(data.get("id"))
                    }
                else:
                    return {
                        "success": False,
                        "error": f"BoldTrail API error: {response.status_code}"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def update_lead_status(
        self,
        lead_id: str,
        new_status: str
    ) -> bool:
        """
        Update the status of a lead
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "status": new_status
                }
                
                response = await client.patch(
                    f"{self.BASE_URL}/contacts/{lead_id}",
                    headers=self.headers,
                    json=payload,
                    timeout=10.0
                )
                
                return response.status_code in [200, 204]
                
        except Exception as e:
            print(f"Error updating BoldTrail lead status: {e}")
            return False
    
    async def add_lead_tag(
        self,
        lead_id: str,
        tag: str
    ) -> bool:
        """
        Add a tag to a lead
        """
        try:
            # First fetch the lead to get existing tags
            lead = await self.get_lead_by_id(lead_id)
            if not lead:
                return False
            
            # Add new tag
            existing_tags = lead.tags or []
            if tag not in existing_tags:
                existing_tags.append(tag)
            
            async with httpx.AsyncClient() as client:
                payload = {
                    "tags": existing_tags
                }
                
                response = await client.patch(
                    f"{self.BASE_URL}/contacts/{lead_id}",
                    headers=self.headers,
                    json=payload,
                    timeout=10.0
                )
                
                return response.status_code in [200, 204]
                
        except Exception as e:
            print(f"Error adding tag to BoldTrail lead: {e}")
            return False
    
    async def create_lead(self, lead_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new lead in BoldTrail
        Used by "The Hunter" to add FSBO/Expired leads
        """
        try:
            async with httpx.AsyncClient() as client:
                # Map lead_data to BoldTrail contact format
                payload = {
                    "first_name": lead_data.get("first_name"),
                    "last_name": lead_data.get("last_name"),
                    "email": lead_data.get("email"),
                    "phone": lead_data.get("phone"),
                    "tags": lead_data.get("tags", []),
                    "status": lead_data.get("status", "New"),
                    "source": "AgentAssist - The Hunter"
                }
                
                # Add address if provided
                if lead_data.get("address"):
                    payload["address"] = {
                        "street": lead_data.get("address"),
                        "city": lead_data.get("city"),
                        "state": lead_data.get("state"),
                        "zip": lead_data.get("zip")
                    }
                
                # Add custom fields
                if lead_data.get("custom_fields"):
                    payload["custom_fields"] = lead_data.get("custom_fields")
                
                response = await client.post(
                    f"{self.BASE_URL}/contacts",
                    headers=self.headers,
                    json=payload,
                    timeout=15.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    return str(data.get("id"))
                else:
                    print(f"BoldTrail create lead error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            print(f"Error creating BoldTrail lead: {e}")
            return None
