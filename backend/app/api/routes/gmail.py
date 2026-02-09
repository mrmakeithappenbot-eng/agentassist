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
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from google.auth.transport.requests import Request as GoogleRequest
    GMAIL_AVAILABLE = True
except ImportError:
    GMAIL_AVAILABLE = False

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

CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
REDIRECT_URI = os.getenv('GMAIL_REDIRECT_URI', 'https://agentassist-1.onrender.com/api/gmail/oauth/callback')

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
    """
    try:
        if not GMAIL_AVAILABLE:
            raise HTTPException(
                status_code=500,
                detail="Gmail libraries not installed. Run: pip install google-auth-oauthlib google-api-python-client"
            )
        
        # Build OAuth URL
        scope_string = " ".join(SCOPES)
        oauth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={CLIENT_ID}&"
            f"redirect_uri={REDIRECT_URI}&"
            f"response_type=code&"
            f"scope={scope_string}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={current_user.id}"
        )
        
        return {
            "success": True,
            "oauth_url": oauth_url
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
        
        if not GMAIL_AVAILABLE:
            return RedirectResponse(
                url="https://frontend-eta-amber-58.vercel.app/dashboard/settings?gmail=error&msg=libraries_missing",
                status_code=302
            )
        
        # Exchange authorization code for tokens
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "redirect_uris": [REDIRECT_URI],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Get user's email address
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()
        email_address = user_info.get('email')
        
        # Store or update token in database
        existing_token = db.query(GmailToken).filter(
            GmailToken.user_id == user_id
        ).first()
        
        if existing_token:
            # Update existing token
            existing_token.access_token = credentials.token
            existing_token.refresh_token = credentials.refresh_token or existing_token.refresh_token
            existing_token.scopes = json.dumps(list(credentials.scopes))
            existing_token.expiry = credentials.expiry
            existing_token.email_address = email_address
            existing_token.is_active = True
            existing_token.updated_at = datetime.utcnow()
        else:
            # Create new token
            new_token = GmailToken(
                user_id=user_id,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_uri=credentials.token_uri,
                scopes=json.dumps(list(credentials.scopes)),
                expiry=credentials.expiry,
                email_address=email_address,
                is_active=True
            )
            db.add(new_token)
        
        db.commit()
        
        return RedirectResponse(
            url=f"https://frontend-eta-amber-58.vercel.app/dashboard/settings?gmail=connected&email={email_address}",
            status_code=302
        )
        
    except Exception as e:
        print(f"Gmail OAuth error: {e}")
        return RedirectResponse(
            url=f"https://frontend-eta-amber-58.vercel.app/dashboard/settings?gmail=error&msg={str(e)[:100]}",
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
            # Actually delete the token to allow fresh reconnection
            db.delete(token)
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
        if not GMAIL_AVAILABLE:
            raise HTTPException(
                status_code=500,
                detail="Gmail libraries not installed"
            )
        
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
        
        # Refresh token if expired
        credentials = Credentials(
            token=token.access_token,
            refresh_token=token.refresh_token,
            token_uri=token.token_uri,
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            scopes=json.loads(token.scopes)
        )
        
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(GoogleRequest())
            # Update token in database
            token.access_token = credentials.token
            token.expiry = credentials.expiry
            token.updated_at = datetime.utcnow()
            db.commit()
        
        # Build email message
        if email.html:
            message = MIMEMultipart('alternative')
            message['to'] = email.to
            message['subject'] = email.subject
            text_part = MIMEText(email.body, 'plain')
            html_part = MIMEText(email.body, 'html')
            message.attach(text_part)
            message.attach(html_part)
        else:
            message = MIMEText(email.body)
            message['to'] = email.to
            message['subject'] = email.subject
        
        # Encode message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        # Send via Gmail API
        service = build('gmail', 'v1', credentials=credentials)
        send_result = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        
        # Update last used timestamp
        token.last_used_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": "Email sent successfully",
            "message_id": send_result.get('id'),
            "thread_id": send_result.get('threadId')
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
