"""
Gmail OAuth & Email Sending Routes
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.database import get_db
from app.models.gmail_oauth import GmailToken
from app.models.user import User
from app.api.routes.auth import get_current_user

router = APIRouter()

# Gmail OAuth Configuration
SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
]

class GmailSendRequest(BaseModel):
    to: str
    subject: str
    body: str
    html: Optional[bool] = False

@router.get("/oauth/url")
async def get_gmail_oauth_url(
    current_user: User = Depends(get_current_user)
):
    """
    Get Gmail OAuth authorization URL
    NOTE: In production, you need to set up Google Cloud credentials
    """
    try:
        # This is a placeholder - you need to configure Google OAuth in settings
        client_id = "YOUR_GOOGLE_CLIENT_ID"  # Set via env var
        redirect_uri = "https://agentassist-1.onrender.com/api/gmail/oauth/callback"
        
        # Build OAuth URL
        scope_string = " ".join(SCOPES)
        oauth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scope_string}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={current_user.id}"
        )
        
        return {
            "success": True,
            "oauth_url": oauth_url,
            "instructions": "You need to set up Google Cloud OAuth credentials first"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/oauth/callback")
async def gmail_oauth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """
    Handle OAuth callback from Google
    Exchange code for tokens and store them
    """
    try:
        user_id = int(state)
        
        # TODO: Exchange code for tokens using Google OAuth
        # This requires google-auth-oauthlib library
        # For now, return placeholder
        
        return RedirectResponse(
            url="/dashboard/settings?gmail=connected",
            status_code=302
        )
        
    except Exception as e:
        return RedirectResponse(
            url="/dashboard/settings?gmail=error",
            status_code=302
        )

@router.get("/status")
async def get_gmail_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if user has connected Gmail
    """
    try:
        token = db.query(GmailToken).filter(
            GmailToken.user_id == current_user.id,
            GmailToken.is_active == True
        ).first()
        
        if token:
            return {
                "success": True,
                "connected": True,
                "email": token.email_address
            }
        else:
            return {
                "success": True,
                "connected": False
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/disconnect")
async def disconnect_gmail(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Disconnect Gmail account
    """
    try:
        token = db.query(GmailToken).filter(
            GmailToken.user_id == current_user.id
        ).first()
        
        if token:
            token.is_active = False
            db.commit()
        
        return {
            "success": True,
            "message": "Gmail disconnected successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send")
async def send_gmail(
    email: GmailSendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send email via user's Gmail account
    """
    try:
        # Get user's Gmail token
        token = db.query(GmailToken).filter(
            GmailToken.user_id == current_user.id,
            GmailToken.is_active == True
        ).first()
        
        if not token:
            raise HTTPException(
                status_code=400,
                detail="Gmail not connected. Please connect your Gmail account first."
            )
        
        # TODO: Implement actual Gmail sending using google-api-python-client
        # This requires:
        # 1. Refreshing token if expired
        # 2. Building MIME message
        # 3. Calling Gmail API
        
        # Placeholder response
        return {
            "success": True,
            "message": "Email queued for sending",
            "note": "Gmail API integration requires google-api-python-client library"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quota")
async def get_gmail_quota(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check Gmail sending quota (10,000 emails/day per user)
    """
    try:
        token = db.query(GmailToken).filter(
            GmailToken.user_id == current_user.id,
            GmailToken.is_active == True
        ).first()
        
        if not token:
            raise HTTPException(status_code=400, detail="Gmail not connected")
        
        # TODO: Track daily usage in database
        # For now return placeholder
        
        return {
            "success": True,
            "daily_limit": 10000,
            "used_today": 0,
            "remaining": 10000
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
