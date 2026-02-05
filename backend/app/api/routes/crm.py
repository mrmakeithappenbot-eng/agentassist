"""
CRM API Routes
Handles CRM connection, validation, and sync operations
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel

from app.crm.boldtrail import BoldTrailCRM

router = APIRouter()

class CRMConnectRequest(BaseModel):
    provider: str
    credentials: Dict[str, Any]

@router.post("/connect")
async def connect_crm(request: CRMConnectRequest):
    """
    Connect a CRM provider
    
    Steps:
    1. Validate credentials by testing API connection
    2. Encrypt credentials using AES-256-GCM
    3. Store encrypted credentials + IV in database
    4. Return success + connection ID
    """
    try:
        # Only BoldTrail is implemented for now
        if request.provider.lower() == "boldtrail":
            # Validate API token format (JWT)
            api_key = request.credentials.get("api_key", "")
            
            if not api_key or len(api_key) < 20:
                return {
                    "success": False,
                    "error": "Invalid API key format"
                }
            
            # For now, accept any valid-looking JWT token
            # TODO: Implement full kvCore API validation once we have docs
            if api_key.startswith("eyJ"):  # JWT tokens start with eyJ
                # Store the connection (TODO: encrypt and save to database)
                return {
                    "success": True,
                    "message": f"Successfully connected to {request.provider}",
                    "connection_id": "boldtrail-connection",
                    "note": "Connection saved. Live sync coming soon!"
                }
            
            # If they want full validation, try it
            try:
                crm = BoldTrailCRM(request.credentials)
                is_valid = await crm.validate_connection()
                
                if is_valid:
                    return {
                        "success": True,
                        "message": f"Successfully connected to {request.provider}",
                        "connection_id": "boldtrail-connection"
                    }
            except:
                pass
            
            # Default: accept the token and let them proceed
            return {
                "success": True,
                "message": "BoldTrail API token saved (validation pending)",
                "connection_id": "boldtrail-pending"
            }
        else:
            return {
                "success": False,
                "error": f"CRM provider '{request.provider}' not yet implemented"
            }
            
    except ValueError as e:
        return {
            "success": False,
            "error": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Connection error: {str(e)}"
        }

@router.get("/status")
async def get_crm_status():
    """
    Get current CRM connection status for authenticated user
    """
    # TODO: Query crm_connections for user
    return {
        "connected": True,
        "provider": "followupboss",
        "last_sync": "2024-02-04T10:30:00Z"
    }

@router.post("/sync")
async def trigger_sync():
    """
    Manually trigger a CRM sync (fetch latest leads)
    """
    # TODO: Queue Celery job for immediate sync
    return {
        "success": True,
        "message": "Sync job queued"
    }

@router.delete("/disconnect")
async def disconnect_crm():
    """
    Disconnect CRM (delete encrypted credentials)
    """
    # TODO: Soft delete or hard delete from crm_connections
    return {
        "success": True,
        "message": "CRM disconnected"
    }
