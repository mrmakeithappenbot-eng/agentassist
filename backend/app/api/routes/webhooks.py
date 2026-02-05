"""
Webhook Routes
Receives data from external services (Zapier, etc.)
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
import hmac
import hashlib

router = APIRouter()

@router.post("/boldtrail")
async def boldtrail_webhook(request: Request):
    """
    Receive leads from BoldTrail via Zapier
    
    Setup in Zapier:
    1. Trigger: BoldTrail (New Lead, Updated Contact, etc.)
    2. Action: Webhooks by Zapier → POST
    3. URL: https://agentassist-1.onrender.com/api/webhooks/boldtrail
    4. Send lead data as JSON
    """
    try:
        # Get the JSON payload
        data = await request.json()
        
        # Log the incoming lead
        print(f"📥 Received BoldTrail lead via Zapier:")
        print(f"   {data}")
        
        # Extract lead information
        lead_info = {
            "first_name": data.get("first_name") or data.get("firstName"),
            "last_name": data.get("last_name") or data.get("lastName"),
            "email": data.get("email"),
            "phone": data.get("phone") or data.get("phoneNumber"),
            "status": data.get("status") or "New",
            "source": "BoldTrail (Zapier)",
            "raw_data": data
        }
        
        # TODO: Store in database
        # TODO: Trigger AI message generation
        # TODO: Assign to team member
        
        return {
            "success": True,
            "message": "Lead received successfully",
            "lead_id": data.get("id") or "new-lead"
        }
        
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/boldtrail/test")
async def test_boldtrail_webhook():
    """
    Test endpoint - returns instructions
    """
    return {
        "message": "BoldTrail webhook endpoint is active!",
        "webhook_url": "https://agentassist-1.onrender.com/api/webhooks/boldtrail",
        "instructions": {
            "step_1": "Go to zapier.com and create a new Zap",
            "step_2": "Trigger: Search for 'BoldTrail' and select your trigger event",
            "step_3": "Connect your BoldTrail account with your Zapier API key",
            "step_4": "Action: Choose 'Webhooks by Zapier' → 'POST'",
            "step_5": "URL: https://agentassist-1.onrender.com/api/webhooks/boldtrail",
            "step_6": "Method: POST",
            "step_7": "Data: Map BoldTrail fields to JSON",
            "step_8": "Test it and turn on your Zap!"
        }
    }

@router.post("/test")
async def test_webhook(request: Request):
    """
    Generic test webhook - accepts any data
    """
    data = await request.json()
    print(f"📥 Test webhook received: {data}")
    return {
        "success": True,
        "received": data
    }
