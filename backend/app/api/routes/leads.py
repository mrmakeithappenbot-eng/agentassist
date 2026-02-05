"""
Leads API Routes
Fetch and manage leads from connected CRM
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.crm.boldtrail import BoldTrailCRM

router = APIRouter()

class LeadResponse(BaseModel):
    id: str
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    status: Optional[str]
    tags: List[str] = []
    location: Optional[str]
    price_range_min: Optional[int]
    price_range_max: Optional[int]

@router.get("/")
async def get_leads(
    status: Optional[str] = None,
    limit: int = 100
):
    """
    Fetch leads from connected CRM
    
    For now, uses hardcoded BoldTrail credentials
    TODO: Get from authenticated user's stored connection
    """
    try:
        # TODO: Get from database based on authenticated user
        # For now, use the Zapier key that was provided
        credentials = {
            "zapier_key": "N2M3MTUzZjY3YTJmNjE0NDk0ZWI1ZDI3NTMwYTUwMjE6YS0yMDM0NDY2",
            "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjIwMzQ0NjYsImlhdCI6MTc3MDMyNjcyOCwiZXhwIjoxODAxODYyNzI4LCJuYmYiOjE3NzAzMjY3MjgsImF1ZCI6IioiLCJhY3QiOjM3NywianRpIjoiOTc5OWZkN2MzMmNhNTI1NmM3NzIxY2FkNzdkZDZiNTAifQ.XoPrAddcLyV5t2xWnhZ1sU0EVe9FJccCkZD_VtG35HA"
        }
        
        crm = BoldTrailCRM(credentials)
        
        # Fetch leads
        statuses = [status] if status else None
        leads = await crm.get_leads(statuses=statuses, limit=limit)
        
        # Convert to response format
        response_leads = []
        for lead in leads:
            response_leads.append(LeadResponse(
                id=lead.crm_lead_id,
                first_name=lead.first_name,
                last_name=lead.last_name,
                email=lead.email,
                phone=lead.phone,
                status=lead.status,
                tags=lead.tags or [],
                location=lead.location,
                price_range_min=lead.price_range_min,
                price_range_max=lead.price_range_max
            ))
        
        return {
            "success": True,
            "count": len(response_leads),
            "leads": response_leads
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_lead_stats():
    """
    Get lead statistics
    """
    try:
        credentials = {
            "zapier_key": "N2M3MTUzZjY3YTJmNjE0NDk0ZWI1ZDI3NTMwYTUwMjE6YS0yMDM0NDY2",
            "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjIwMzQ0NjYsImlhdCI6MTc3MDMyNjcyOCwiZXhwIjoxODAxODYyNzI4LCJuYmYiOjE3NzAzMjY3MjgsImF1ZCI6IjoiLCJhY3QiOjM3NywianRpIjoiOTc5OWZkN2MzMmNhNTI1NmM3NzIxY2FkNzdkZDZiNTAifQ.XoPrAddcLyV5t2xWnhZ1sU0EVe9FJccCkZD_VtG35HA"
        }
        
        crm = BoldTrailCRM(credentials)
        leads = await crm.get_leads(limit=1000)
        
        # Calculate stats
        total = len(leads)
        active = sum(1 for l in leads if l.status and 'active' in l.status.lower())
        
        return {
            "success": True,
            "stats": {
                "total_leads": total,
                "active_leads": active,
                "new_today": 0,  # TODO: Filter by date
                "response_rate": 0  # TODO: Calculate from messages
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "stats": {
                "total_leads": 0,
                "active_leads": 0,
                "new_today": 0,
                "response_rate": 0
            }
        }
