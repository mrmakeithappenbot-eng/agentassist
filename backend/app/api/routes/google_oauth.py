"""
Google OAuth Routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
import httpx
import os
import traceback

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
    if not GOOGLE_CLIENT_ID:
        return JSONResponse(
            status_code=500,
            content={"detail": "GOOGLE_CLIENT_ID not configured"}
        )
    
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
    
    try:
        # Check config
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            print("❌ Google OAuth not configured - missing CLIENT_ID or CLIENT_SECRET")
            return JSONResponse(
                status_code=500,
                content={"detail": "Google OAuth not configured on server"}
            )
        
        print(f"🔐 Google OAuth callback received, exchanging code...")
        
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
                error_detail = token_response.text
                print(f"❌ Token exchange failed: {error_detail}")
                return JSONResponse(
                    status_code=400,
                    content={"detail": f"Failed to get access token: {error_detail}"}
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            print(f"✅ Got access token from Google")
            
            # Get user info from Google
            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_info_response.status_code != 200:
                print(f"❌ Failed to get user info: {user_info_response.text}")
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Failed to get user info from Google"}
                )
            
            user_info = user_info_response.json()
            email = user_info.get("email")
            name = user_info.get("name")
            print(f"✅ Got user info: {email}")
        
        # Check if user exists
        try:
            user = db.query(User).filter(User.email == email).first()
            print(f"📊 User lookup complete, exists: {user is not None}")
        except Exception as db_error:
            print(f"❌ Database query error: {db_error}")
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"detail": f"Database error: {str(db_error)}"}
            )
        
        if not user:
            # Create new user
            try:
                user = User(
                    email=email,
                    full_name=name,
                    hashed_password="",  # No password for OAuth users
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"✅ Created new user: {email}")
            except Exception as create_error:
                print(f"❌ User creation error: {create_error}")
                traceback.print_exc()
                db.rollback()
                return JSONResponse(
                    status_code=500,
                    content={"detail": f"Failed to create user: {str(create_error)}"}
                )
        else:
            # Update last login
            try:
                user.last_login = datetime.utcnow()
                db.commit()
                print(f"✅ Updated last login for: {email}")
            except Exception as update_error:
                print(f"❌ Update error: {update_error}")
                db.rollback()
        
        # Create access token
        try:
            jwt_token = create_token(user.id)
            print(f"✅ Created JWT token for user {user.id}")
        except Exception as token_error:
            print(f"❌ Token creation error: {token_error}")
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"detail": f"Failed to create session token: {str(token_error)}"}
            )
        
        # Redirect to frontend callback page with token
        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
        print(f"✅ Redirecting to: {FRONTEND_URL}/auth/callback")
        return RedirectResponse(redirect_url)
        
    except Exception as e:
        print(f"❌ Unexpected error in Google OAuth callback: {e}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Unexpected error: {str(e)}"}
        )
