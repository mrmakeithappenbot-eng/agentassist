"""
Minimal Authentication - Works without any dependencies
TEMPORARY - Uses plain text passwords (INSECURE but gets it working)
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter()

# In-memory storage
_users = {}

class RegisterRequest(BaseModel):
    email: str  # Changed from EmailStr to avoid email-validator dependency
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str  # Changed from EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """Register a new user"""
    
    # Check if exists
    if request.email in _users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = {
        'id': str(uuid.uuid4()),
        'email': request.email,
        'password': request.password,  # Plain text for now (TEMPORARY)
        'full_name': request.full_name,
        'is_team_leader': False,
        'is_active': True,
        'created_at': datetime.utcnow().isoformat()
    }
    _users[request.email] = user
    
    # Return fake token (just the email for now)
    return {
        "access_token": f"token_{user['id']}",
        "token_type": "bearer",
        "user": {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'is_team_leader': user['is_team_leader'],
            'is_active': user['is_active'],
            'created_at': user['created_at']
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login user"""
    
    # Find user
    user = _users.get(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check password (plain text comparison for now)
    if user['password'] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Return token
    return {
        "access_token": f"token_{user['id']}",
        "token_type": "bearer",
        "user": {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'is_team_leader': user['is_team_leader'],
            'is_active': user['is_active'],
            'created_at': user['created_at']
        }
    }

@router.get("/me")
async def get_me():
    """Get current user - returns first user for now"""
    if not _users:
        raise HTTPException(status_code=401, detail="No users")
    
    user = list(_users.values())[0]
    return {
        'id': user['id'],
        'email': user['email'],
        'full_name': user['full_name'],
        'is_team_leader': user['is_team_leader'],
        'created_at': user['created_at']
    }
