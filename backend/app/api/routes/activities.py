"""
Lead Activity API Routes - Multi-User Support
Track interactions with leads
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.activity import LeadActivity
from app.models.leads import Lead
from app.models.user import User
from app.api.routes.auth import get_current_user

router = APIRouter()

class ActivityCreate(BaseModel):
    activity_type: str  # note, call, email, showing, meeting, other
    title: Optional[str] = None
    content: str

class ActivityUpdate(BaseModel):
    activity_type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None

class ActivityResponse(BaseModel):
    id: int
    lead_id: int
    activity_type: str
    title: Optional[str]
    content: str
    created_at: str
    updated_at: str

@router.post("/{lead_id}/activities")
async def create_activity(
    lead_id: int,
    activity: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add an activity/note to a lead (requires authentication)
    """
    try:
        # Verify lead exists and belongs to current user
        lead = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.user_id == current_user.id
        ).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Validate activity type
        valid_types = ["note", "call", "email", "showing", "meeting", "other"]
        if activity.activity_type.lower() not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid activity type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Create activity
        db_activity = LeadActivity(
            lead_id=lead_id,
            activity_type=activity.activity_type.lower(),
            title=activity.title,
            content=activity.content
        )
        db.add(db_activity)
        
        # Update lead's last contact date
        lead.last_contact_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_activity)
        
        return {
            "success": True,
            "message": "Activity added successfully",
            "activity": ActivityResponse(
                id=db_activity.id,
                lead_id=db_activity.lead_id,
                activity_type=db_activity.activity_type,
                title=db_activity.title,
                content=db_activity.content,
                created_at=db_activity.created_at.isoformat(),
                updated_at=db_activity.updated_at.isoformat()
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{lead_id}/activities")
async def get_activities(
    lead_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get activity timeline for a lead (requires authentication)
    """
    try:
        # Verify lead exists and belongs to current user
        lead = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.user_id == current_user.id
        ).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Get activities
        activities = db.query(LeadActivity)\
            .filter(LeadActivity.lead_id == lead_id)\
            .order_by(LeadActivity.created_at.desc())\
            .limit(limit)\
            .all()
        
        return {
            "success": True,
            "count": len(activities),
            "activities": [
                ActivityResponse(
                    id=a.id,
                    lead_id=a.lead_id,
                    activity_type=a.activity_type,
                    title=a.title,
                    content=a.content,
                    created_at=a.created_at.isoformat(),
                    updated_at=a.updated_at.isoformat()
                )
                for a in activities
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{lead_id}/activities/{activity_id}")
async def update_activity(
    lead_id: int, 
    activity_id: int, 
    activity_update: ActivityUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an activity (requires authentication)
    """
    try:
        # Verify lead belongs to current user
        lead = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.user_id == current_user.id
        ).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Find the activity
        db_activity = db.query(LeadActivity)\
            .filter(LeadActivity.id == activity_id, LeadActivity.lead_id == lead_id)\
            .first()
        
        if not db_activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        # Update fields
        if activity_update.activity_type is not None:
            db_activity.activity_type = activity_update.activity_type.lower()
        if activity_update.title is not None:
            db_activity.title = activity_update.title
        if activity_update.content is not None:
            db_activity.content = activity_update.content
        
        db.commit()
        db.refresh(db_activity)
        
        return {
            "success": True,
            "message": "Activity updated successfully",
            "activity": ActivityResponse(
                id=db_activity.id,
                lead_id=db_activity.lead_id,
                activity_type=db_activity.activity_type,
                title=db_activity.title,
                content=db_activity.content,
                created_at=db_activity.created_at.isoformat(),
                updated_at=db_activity.updated_at.isoformat()
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{lead_id}/activities/{activity_id}")
async def delete_activity(
    lead_id: int,
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an activity (requires authentication)
    """
    try:
        # Verify lead belongs to current user
        lead = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.user_id == current_user.id
        ).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Find the activity
        db_activity = db.query(LeadActivity)\
            .filter(LeadActivity.id == activity_id, LeadActivity.lead_id == lead_id)\
            .first()
        
        if not db_activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        # Delete the activity
        db.delete(db_activity)
        db.commit()
        
        return {
            "success": True,
            "message": "Activity deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
