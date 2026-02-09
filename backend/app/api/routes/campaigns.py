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


# ===== ENROLLMENT ENDPOINTS =====

class EnrollLeadRequest(BaseModel):
    lead_ids: List[int]

@router.post("/{campaign_id}/enroll")
async def enroll_leads(
    campaign_id: int,
    request: EnrollLeadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enroll one or more leads into a campaign
    """
    from app.models.leads import Lead
    
    try:
        # Verify campaign ownership
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        enrolled = []
        already_enrolled = []
        not_found = []
        
        for lead_id in request.lead_ids:
            # Verify lead ownership
            lead = db.query(Lead).filter(
                Lead.id == lead_id,
                Lead.user_id == current_user.id
            ).first()
            
            if not lead:
                not_found.append(lead_id)
                continue
            
            # Check if already enrolled
            existing = db.query(CampaignEnrollment).filter(
                CampaignEnrollment.campaign_id == campaign_id,
                CampaignEnrollment.lead_id == lead_id
            ).first()
            
            if existing:
                already_enrolled.append(lead_id)
                continue
            
            # Create enrollment
            enrollment = CampaignEnrollment(
                campaign_id=campaign_id,
                lead_id=lead_id,
                status="active",
                current_step=0
            )
            db.add(enrollment)
            enrolled.append(lead_id)
        
        # Update campaign stats
        campaign.leads_count = db.query(CampaignEnrollment).filter(
            CampaignEnrollment.campaign_id == campaign_id,
            CampaignEnrollment.status == "active"
        ).count() + len(enrolled)
        
        db.commit()
        
        return {
            "success": True,
            "enrolled": enrolled,
            "already_enrolled": already_enrolled,
            "not_found": not_found,
            "message": f"Enrolled {len(enrolled)} lead(s) into campaign"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}/enrollments")
async def get_enrollments(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all leads enrolled in a campaign
    """
    from app.models.leads import Lead
    
    try:
        # Verify campaign ownership
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Get enrollments with lead info
        enrollments = db.query(CampaignEnrollment).filter(
            CampaignEnrollment.campaign_id == campaign_id
        ).all()
        
        result = []
        for enrollment in enrollments:
            lead = db.query(Lead).filter(Lead.id == enrollment.lead_id).first()
            result.append({
                **enrollment.to_dict(),
                "lead": lead.to_dict() if lead else None
            })
        
        return {
            "success": True,
            "count": len(result),
            "enrollments": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{campaign_id}/enrollments/{lead_id}")
async def unenroll_lead(
    campaign_id: int,
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a lead from a campaign
    """
    try:
        # Verify campaign ownership
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        enrollment = db.query(CampaignEnrollment).filter(
            CampaignEnrollment.campaign_id == campaign_id,
            CampaignEnrollment.lead_id == lead_id
        ).first()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Lead not enrolled in this campaign")
        
        db.delete(enrollment)
        
        # Update campaign count
        campaign.leads_count = db.query(CampaignEnrollment).filter(
            CampaignEnrollment.campaign_id == campaign_id,
            CampaignEnrollment.status == "active"
        ).count()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Lead removed from campaign"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ===== EMAIL SENDING ENDPOINTS =====

@router.post("/{campaign_id}/send")
async def send_campaign_emails(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process and send pending campaign emails for all enrolled leads.
    Checks each enrollment's current_step and sends the next email if due.
    """
    from app.models.leads import Lead
    from app.models.gmail_oauth import GmailToken
    import json
    import base64
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from google.auth.transport.requests import Request as GoogleRequest
        import os
    except ImportError:
        raise HTTPException(status_code=500, detail="Gmail libraries not installed")
    
    try:
        # Verify campaign ownership and get campaign
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        if campaign.status != "active":
            raise HTTPException(status_code=400, detail="Campaign is not active. Set status to 'active' first.")
        
        # Get Gmail token
        gmail_token = db.query(GmailToken).filter(
            GmailToken.user_id == current_user.id,
            GmailToken.is_active == True
        ).first()
        
        if not gmail_token:
            raise HTTPException(status_code=400, detail="Gmail not connected. Connect Gmail in Settings first.")
        
        # Build Gmail credentials
        CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
        CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
        
        credentials = Credentials(
            token=gmail_token.access_token,
            refresh_token=gmail_token.refresh_token,
            token_uri=gmail_token.token_uri,
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            scopes=json.loads(gmail_token.scopes)
        )
        
        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(GoogleRequest())
            gmail_token.access_token = credentials.token
            gmail_token.expiry = credentials.expiry
            db.commit()
        
        # Build Gmail service
        service = build('gmail', 'v1', credentials=credentials)
        
        # Get campaign steps ordered
        steps = db.query(CampaignStep).filter(
            CampaignStep.campaign_id == campaign_id
        ).order_by(CampaignStep.step_order).all()
        
        if not steps:
            raise HTTPException(status_code=400, detail="Campaign has no steps. Add email steps first.")
        
        # Get active enrollments
        enrollments = db.query(CampaignEnrollment).filter(
            CampaignEnrollment.campaign_id == campaign_id,
            CampaignEnrollment.status == "active"
        ).all()
        
        sent_count = 0
        errors = []
        results = []
        
        for enrollment in enrollments:
            # Get the lead
            lead = db.query(Lead).filter(Lead.id == enrollment.lead_id).first()
            if not lead or not lead.email:
                continue
            
            # Determine which step to send
            current_step_num = enrollment.current_step
            
            # Find the next step to send
            next_step = None
            for step in steps:
                if step.step_order == current_step_num + 1:
                    next_step = step
                    break
            
            if not next_step:
                # No more steps, mark completed
                enrollment.status = "completed"
                enrollment.completed_at = datetime.utcnow()
                continue
            
            # Check delay (if not first step and has delay)
            if enrollment.last_sent_at and next_step.delay_days > 0:
                from datetime import timedelta
                next_send_date = enrollment.last_sent_at + timedelta(days=next_step.delay_days)
                if datetime.utcnow() < next_send_date:
                    # Not yet time to send
                    continue
            
            # Personalize the email
            subject = next_step.subject or "Message from AgentAssist"
            body = next_step.body
            
            # Replace placeholders
            replacements = {
                "{{first_name}}": lead.first_name or "",
                "{{last_name}}": lead.last_name or "",
                "{{email}}": lead.email or "",
                "{{phone}}": lead.phone or "",
                "{{location}}": lead.location or "",
                "{{address}}": lead.address or "",
            }
            
            for placeholder, value in replacements.items():
                subject = subject.replace(placeholder, value)
                body = body.replace(placeholder, value)
            
            # Build email
            message = MIMEMultipart('alternative')
            message['to'] = lead.email
            message['subject'] = subject
            
            # Add both plain text and HTML
            text_part = MIMEText(body, 'plain')
            html_part = MIMEText(body.replace('\n', '<br>'), 'html')
            message.attach(text_part)
            message.attach(html_part)
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            try:
                # Send email
                send_result = service.users().messages().send(
                    userId='me',
                    body={'raw': raw_message}
                ).execute()
                
                # Update enrollment
                enrollment.current_step = next_step.step_order
                enrollment.last_sent_at = datetime.utcnow()
                
                # Update step stats
                next_step.sent_count += 1
                
                sent_count += 1
                results.append({
                    "lead_id": lead.id,
                    "lead_name": f"{lead.first_name} {lead.last_name}",
                    "email": lead.email,
                    "step": next_step.step_order,
                    "status": "sent",
                    "message_id": send_result.get('id')
                })
                
            except Exception as send_error:
                errors.append({
                    "lead_id": lead.id,
                    "error": str(send_error)
                })
        
        # Update campaign sent count
        campaign.sent_count += sent_count
        gmail_token.last_used_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "sent_count": sent_count,
            "results": results,
            "errors": errors,
            "message": f"Sent {sent_count} email(s)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{campaign_id}/send-test")
async def send_test_email(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a test email of step 1 to yourself
    """
    from app.models.gmail_oauth import GmailToken
    import json
    import base64
    from email.mime.text import MIMEText
    
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from google.auth.transport.requests import Request as GoogleRequest
        import os
    except ImportError:
        raise HTTPException(status_code=500, detail="Gmail libraries not installed")
    
    try:
        # Verify campaign ownership
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id
        ).first()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Get first step
        first_step = db.query(CampaignStep).filter(
            CampaignStep.campaign_id == campaign_id,
            CampaignStep.step_order == 1
        ).first()
        
        if not first_step:
            raise HTTPException(status_code=400, detail="Campaign has no steps")
        
        # Get Gmail token
        gmail_token = db.query(GmailToken).filter(
            GmailToken.user_id == current_user.id,
            GmailToken.is_active == True
        ).first()
        
        if not gmail_token:
            raise HTTPException(status_code=400, detail="Gmail not connected")
        
        # Build credentials
        CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
        CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
        
        credentials = Credentials(
            token=gmail_token.access_token,
            refresh_token=gmail_token.refresh_token,
            token_uri=gmail_token.token_uri,
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            scopes=json.loads(gmail_token.scopes)
        )
        
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(GoogleRequest())
            gmail_token.access_token = credentials.token
            gmail_token.expiry = credentials.expiry
            db.commit()
        
        service = build('gmail', 'v1', credentials=credentials)
        
        # Build test email
        subject = f"[TEST] {first_step.subject or 'Campaign Email'}"
        body = f"--- TEST EMAIL ---\n\n{first_step.body}\n\n--- This is a test. Placeholders not replaced. ---"
        
        message = MIMEText(body)
        message['to'] = gmail_token.email_address
        message['subject'] = subject
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        send_result = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        
        return {
            "success": True,
            "message": f"Test email sent to {gmail_token.email_address}",
            "message_id": send_result.get('id')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
