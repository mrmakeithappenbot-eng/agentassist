"""
Messages API Routes
Handles pending message approvals and sending
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/pending")
async def get_pending_messages():
    """Get all pending approval messages for current user"""
    # TODO: Query pending_messages table where status='pending'
    return []

@router.post("/{message_id}/approve")
async def approve_message(message_id: str, edited_body: str = None):
    """
    Approve a pending message
    
    If edited_body provided, update the message first
    Then send via CRM API and log
    """
    # TODO: Update message, send via CRM, create log entry
    return {"success": True}

@router.post("/{message_id}/reject")
async def reject_message(message_id: str):
    """Reject a pending message"""
    # TODO: Update status to 'rejected'
    return {"success": True}

@router.get("/history")
async def get_message_history(lead_id: str = None):
    """Get sent message history"""
    # TODO: Query message_log table
    return []
