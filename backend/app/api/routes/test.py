"""
Simple test route - no dependencies
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/ping")
async def ping():
    """Simple health check"""
    return {"message": "pong", "status": "ok"}
