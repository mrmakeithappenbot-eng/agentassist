"""
Campaigns API Routes - Database-backed drip campaigns
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.campaigns import Campaign, CampaignStep, CampaignEnrollment
from app.models.user import User
from app.api.routes.auth import get_current_user

router = APIRouter()

class CampaignStepData(BaseModel):
    step_order: int
    delay_days: int = 0
    type: str  # email or sms
    subject: Optional[str] = None
    body: str

class CampaignCreate(BaseModel):
    name: str
    type: str  # email, sms, both
    target_tags: List[str] = []
    target_status: List[str] = []
    steps: List[CampaignStepData] = []

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    target_tags: Optional[List[str]] = None
    target_status: Optional[List[str]] = None
    gmail_enabled: Optional[bool] = None

@router.get("/")
async def get_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all campaigns for current user
    """
    try:
        campaigns = db.query(Campaign).filter(
            Campaign.user_id == current_user.id
        ).all()
        
        return {
            "success": True,
            "count": len(campaigns),
            "campaigns": [campaign.to_dict() for campaign in campaigns]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single campaign with all steps
    """
    try:
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return {
            "success": True,
            "campaign": campaign.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new campaign with steps
    """
    try:
        # Create campaign
        db_campaign = Campaign(
            user_id=current_user.id,
            name=campaign.name,
            campaign_type=campaign.type,
            status="draft",
            target_tags=campaign.target_tags,
            target_status=campaign.target_status
        )
        
        db.add(db_campaign)
        db.flush()  # Get campaign ID
        
        # Create steps
        for step_data in campaign.steps:
            db_step = CampaignStep(
                campaign_id=db_campaign.id,
                step_order=step_data.step_order,
                delay_days=step_data.delay_days,
                step_type=step_data.type,
                subject=step_data.subject,
                body=step_data.body
            )
            db.add(db_step)
        
        db.commit()
        db.refresh(db_campaign)
        
        return {
            "success": True,
            "message": "Campaign created successfully",
            "campaign": db_campaign.to_dict()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{campaign_id}")
async def update_campaign(
    campaign_id: int,
    campaign_update: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a campaign
    """
    try:
        db_campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not db_campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Update fields
        if campaign_update.name is not None:
            db_campaign.name = campaign_update.name
        if campaign_update.type is not None:
            db_campaign.campaign_type = campaign_update.type
        if campaign_update.status is not None:
            db_campaign.status = campaign_update.status
            if campaign_update.status == "active" and not db_campaign.started_at:
                db_campaign.started_at = datetime.utcnow()
        if campaign_update.target_tags is not None:
            db_campaign.target_tags = campaign_update.target_tags
        if campaign_update.target_status is not None:
            db_campaign.target_status = campaign_update.target_status
        if campaign_update.gmail_enabled is not None:
            db_campaign.gmail_enabled = campaign_update.gmail_enabled
        
        db.commit()
        db.refresh(db_campaign)
        
        return {
            "success": True,
            "message": "Campaign updated successfully",
            "campaign": db_campaign.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a campaign
    """
    try:
        db_campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not db_campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        db.delete(db_campaign)
        db.commit()
        
        return {
            "success": True,
            "message": "Campaign deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{campaign_id}/steps")
async def add_campaign_step(
    campaign_id: int,
    step: CampaignStepData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a step to a campaign
    """
    try:
        # Verify campaign ownership
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Create step
        db_step = CampaignStep(
            campaign_id=campaign_id,
            step_order=step.step_order,
            delay_days=step.delay_days,
            step_type=step.type,
            subject=step.subject,
            body=step.body
        )
        
        db.add(db_step)
        db.commit()
        db.refresh(db_step)
        
        return {
            "success": True,
            "message": "Step added successfully",
            "step": db_step.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{campaign_id}/steps/{step_id}")
async def delete_campaign_step(
    campaign_id: int,
    step_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a campaign step
    """
    try:
        # Verify campaign ownership
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Delete step
        db_step = db.query(CampaignStep).filter(
            CampaignStep.id == step_id,
            CampaignStep.campaign_id == campaign_id
        ).first()
        
        if not db_step:
            raise HTTPException(status_code=404, detail="Step not found")
        
        db.delete(db_step)
        db.commit()
        
        return {
            "success": True,
            "message": "Step deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
