"""
Leads API Routes
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_leads(status: str = None, source: str = None):
    """Get leads for current user"""
    # TODO: Query leads table, filter by status/source
    return []

@router.get("/{lead_id}")
async def get_lead(lead_id: str):
    """Get single lead details"""
    # TODO: Fetch from database
    return {}

@router.post("/{lead_id}/status")
async def update_lead_status(lead_id: str, new_status: str):
    """Update lead status"""
    # TODO: Update in database + sync to CRM
    return {"success": True}
