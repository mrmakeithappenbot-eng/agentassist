"""
Authentication API Routes
"""

from fastapi import APIRouter

router = APIRouter()

@router.post("/register")
async def register(email: str, password: str, first_name: str, last_name: str):
    """Register a new user"""
    # TODO: Hash password, create user, return JWT token
    return {"token": "jwt-token-placeholder"}

@router.post("/login")
async def login(email: str, password: str):
    """Login user"""
    # TODO: Verify password, return JWT token
    return {"token": "jwt-token-placeholder"}

@router.get("/me")
async def get_current_user():
    """Get current user profile"""
    # TODO: Decode JWT, fetch user from DB
    return {"email": "user@example.com", "first_name": "John"}
