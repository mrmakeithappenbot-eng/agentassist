"""
Google OAuth Routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime
import httpx
import os

from app.core.database import get_db
from app.models.user import User
from app.api.routes.auth import create_token

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://agentassist-1.onrender.com/api/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://frontend-eta-amber-58.vercel.app")

@router.get("/google/login")
async def google_login():
    """Redirect to Google OAuth"""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"access_type=offline"
    )
    return RedirectResponse(google_auth_url)

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        # Get user info from Google
        user_info_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_info_response.json()
    
    # Check if user exists
    email = user_info.get("email")
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create new user
        user = User(
            email=email,
            full_name=user_info.get("name"),
            hashed_password="",  # No password for OAuth users
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
    
    # Create access token
    access_token = create_token(user.id)
    
    # Redirect to frontend callback page with token
    return RedirectResponse(
        f"{FRONTEND_URL}/auth/callback?token={access_token}"
    )
