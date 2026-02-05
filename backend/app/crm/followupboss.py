"""
Follow Up Boss CRM Integration
API Documentation: https://api.followupboss.com/docs
"""

import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.crm.base import CRM_Handler, CRMLead, CRMProvider

class FollowUpBossCRM(CRM_Handler):
    """
    Follow Up Boss CRM implementation
    Authentication: API Key (passed as HTTP Basic Auth with key as username)
    """
    
    BASE_URL = "https://api.followupboss.com/v1"
    
    def __init__(self, credentials: Dict[str, Any]):
        super().__init__(credentials)
        self.provider = CRMProvider.FOLLOWUPBOSS
        self.api_key = credentials.get("api_key")
        
        if not self.api_key:
            raise ValueError("Follow Up Boss requires 'api_key' in credentials")
        
        # HTTP Basic Auth: API key as username, empty password
        self.auth = httpx.BasicAuth(self.api_key, "")
    
    async def validate_connection(self) -> bool:
        """Test the API connection by fetching account info"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/users",
                    auth=self.auth,
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception as e:
            print(f"Follow Up Boss connection validation failed: {e}")
            return False
    
    async def get_leads(
        self,
        statuses: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[CRMLead]:
        """
        Fetch leads from Follow Up Boss
        
        FUB API Notes:
        - Leads are called "people" in their API
        - Statuses are stored in custom fields or stages
        - Tags are in the 'tags' array
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "limit": limit,
                    "sort": "-created",  # Most recent first
                }
                
                # Add tag filter if provided
                if tags:
                    params["tags"] = ",".join(tags)
                
                response = await client.get(
                    f"{self.BASE_URL}/people",
                    auth=self.auth,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"FUB API error: {response.status_code} - {response.text}")
                    return []
                
                data = response.json()
                leads = []
                
                for person in data.get("people", []):
                    # Map FUB data to CRMLead
                    lead = self._map_person_to_lead(person)
                    
                    # Filter by status if provided
                    if statuses:
                        if lead.status and lead.status.lower() in [s.lower() for s in statuses]:
                            leads.append(lead)
                    else:
                        leads.append(lead)
                
                return leads
                
        except Exception as e:
            print(f"Error fetching Follow Up Boss leads: {e}")
            return []
    
    def _map_person_to_lead(self, person: Dict[str, Any]) -> CRMLead:
        """Convert FUB 'person' object to CRMLead"""
        
        # Extract name
        first_name = person.get("firstName")
        last_name = person.get("lastName")
        
        # Extract contact info
        emails = person.get("emails", [])
        email = emails[0] if emails else None
        
        phones = person.get("phones", [])
        phone = phones[0].get("value") if phones else None
        
        # Extract tags
        tags = person.get("tags", [])
        
        # Extract status (FUB uses 'stage')
        status = person.get("stage")
        
        # Extract location info
        addresses = person.get("addresses", [])
        location = None
        if addresses:
            addr = addresses[0]
            location = f"{addr.get('city', '')}, {addr.get('state', '')}".strip(", ")
        
        # Extract price range from custom fields
        custom_fields = person.get("customFields", {})
        price_min = custom_fields.get("priceRangeMin")
        price_max = custom_fields.get("priceRangeMax")
        
        # Last activity
        last_activity = person.get("updated")
        last_activity_dt = None
        if last_activity:
            try:
                last_activity_dt = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
            except:
                pass
        
        return CRMLead(
            crm_lead_id=str(person.get("id")),
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
                    f"{self.BASE_URL}/people/{lead_id}",
                    auth=self.auth,
                    timeout=10.0
                )
                
                if response.status_code != 200:
                    return None
                
                person = response.json()
                return self._map_person_to_lead(person)
                
        except Exception as e:
            print(f"Error fetching FUB lead {lead_id}: {e}")
            return None
    
    async def send_email(
        self,
        lead_id: str,
        subject: str,
        body: str
    ) -> Dict[str, Any]:
        """
        Send an email via Follow Up Boss
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "personId": lead_id,
                    "subject": subject,
                    "body": body,
                    "type": "Email"
                }
                
                response = await client.post(
                    f"{self.BASE_URL}/events",
                    auth=self.auth,
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
                        "error": f"FUB API error: {response.status_code}"
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
        Send an SMS via Follow Up Boss
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "personId": lead_id,
                    "body": body,
                    "type": "Text"
                }
                
                response = await client.post(
                    f"{self.BASE_URL}/events",
                    auth=self.auth,
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
                        "error": f"FUB API error: {response.status_code}"
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
        Create a note in Follow Up Boss
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "personId": lead_id,
                    "body": note_text,
                    "type": "Note"
                }
                
                response = await client.post(
                    f"{self.BASE_URL}/events",
                    auth=self.auth,
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
                        "error": f"FUB API error: {response.status_code}"
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
        Update the stage/status of a lead
        """
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "stage": new_status
                }
                
                response = await client.put(
                    f"{self.BASE_URL}/people/{lead_id}",
                    auth=self.auth,
                    json=payload,
                    timeout=10.0
                )
                
                return response.status_code in [200, 204]
                
        except Exception as e:
            print(f"Error updating FUB lead status: {e}")
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
                
                response = await client.put(
                    f"{self.BASE_URL}/people/{lead_id}",
                    auth=self.auth,
                    json=payload,
                    timeout=10.0
                )
                
                return response.status_code in [200, 204]
                
        except Exception as e:
            print(f"Error adding tag to FUB lead: {e}")
            return False
    
    async def create_lead(self, lead_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new lead in Follow Up Boss
        Used by "The Hunter" to add FSBO/Expired leads
        """
        try:
            async with httpx.AsyncClient() as client:
                # Map lead_data to FUB person format
                payload = {
                    "firstName": lead_data.get("first_name"),
                    "lastName": lead_data.get("last_name"),
                    "emails": [lead_data.get("email")] if lead_data.get("email") else [],
                    "phones": [{"value": lead_data.get("phone")}] if lead_data.get("phone") else [],
                    "tags": lead_data.get("tags", []),
                    "stage": lead_data.get("status", "New"),
                    "source": "AgentAssist - The Hunter"
                }
                
                # Add address if provided
                if lead_data.get("address"):
                    payload["addresses"] = [{
                        "street": lead_data.get("address"),
                        "city": lead_data.get("city"),
                        "state": lead_data.get("state"),
                        "zip": lead_data.get("zip")
                    }]
                
                response = await client.post(
                    f"{self.BASE_URL}/people",
                    auth=self.auth,
                    json=payload,
                    timeout=15.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    return str(data.get("id"))
                else:
                    print(f"FUB create lead error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            print(f"Error creating FUB lead: {e}")
            return None
