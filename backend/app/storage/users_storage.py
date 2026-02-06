"""
Temporary in-memory storage for users
TODO: Replace with database storage
"""

from typing import Dict, Optional
import uuid
from datetime import datetime

# In-memory user storage
_users: Dict[str, dict] = {}

def create_user(email: str, hashed_password: str, full_name: Optional[str] = None) -> dict:
    """Create a new user"""
    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'email': email,
        'hashed_password': hashed_password,
        'full_name': full_name,
        'is_active': True,
        'is_team_leader': False,
        'created_at': datetime.utcnow().isoformat()
    }
    _users[email] = user
    return user

def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email"""
    return _users.get(email)

def get_all_users() -> list:
    """Get all users"""
    return list(_users.values())
