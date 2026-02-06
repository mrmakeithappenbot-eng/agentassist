"""
Authentication API Routes (Simplified - In-Memory)
User registration, login, and profile management
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.security import create_access_token, verify_token, hash_password, verify_password
from app.storage import users_storage

router = APIRouter()
security = HTTPBearer()

# Request/Response Models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    is_team_leader: bool
    created_at: str

# Dependency to get current user from JWT token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Get current user from JWT token
    Use as dependency in protected routes
    """
    token = credentials.credentials
    email = verify_token(token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = users_storage.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """
    Register a new user
    
    Creates account and returns JWT token
    """
    # Check if user already exists
    existing_user = users_storage.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_pw = hash_password(request.password)
    new_user = users_storage.create_user(
        email=request.email,
        hashed_password=hashed_pw,
        full_name=request.full_name
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user['email']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            'id': new_user['id'],
            'email': new_user['email'],
            'full_name': new_user['full_name'],
            'is_team_leader': new_user['is_team_leader'],
            'is_active': new_user['is_active'],
            'created_at': new_user['created_at']
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Login user
    
    Verifies credentials and returns JWT token
    """
    # Find user
    user = users_storage.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if active
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user['email']})
    
    return {
        "access_token": access_token,
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

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user profile
    
    Requires valid JWT token in Authorization header
    """
    return UserResponse(
        id=current_user['id'],
        email=current_user['email'],
        full_name=current_user['full_name'],
        is_team_leader=current_user['is_team_leader'],
        created_at=current_user['created_at']
    )
