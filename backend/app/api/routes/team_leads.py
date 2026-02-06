"""
Team Lead Management Routes
Assign leads to team members and track performance
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.leads import Lead
from app.models.team_simple import Team
from app.api.routes.auth import get_current_user

router = APIRouter()

class AssignLeadRequest(BaseModel):
    lead_id: int
    assignee_id: int

class AssignMultipleLeadsRequest(BaseModel):
    lead_ids: List[int]
    assignee_id: int

@router.post("/assign-lead")
async def assign_lead_to_member(
    request: AssignLeadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign a lead to a team member"""
    
    # Check if user is team leader
    if not current_user.is_team_leader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can assign leads"
        )
    
    # Get lead
    lead = db.query(Lead).filter(Lead.id == request.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get assignee and verify they're on the same team
    assignee = db.query(User).filter(User.id == request.assignee_id).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found")
    
    if assignee.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only assign to members of your team"
        )
    
    # Assign lead
    lead.assigned_to = request.assignee_id
    lead.assigned_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "message": f"Lead assigned to {assignee.full_name or assignee.email}"
    }

@router.post("/assign-multiple-leads")
async def assign_multiple_leads(
    request: AssignMultipleLeadsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign multiple leads to a team member"""
    
    # Check if user is team leader
    if not current_user.is_team_leader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can assign leads"
        )
    
    # Get assignee
    assignee = db.query(User).filter(User.id == request.assignee_id).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found")
    
    if assignee.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only assign to members of your team"
        )
    
    # Assign all leads
    assigned_count = 0
    for lead_id in request.lead_ids:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if lead:
            lead.assigned_to = request.assignee_id
            lead.assigned_at = datetime.utcnow()
            assigned_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "assigned_count": assigned_count,
        "message": f"Assigned {assigned_count} leads to {assignee.full_name or assignee.email}"
    }

@router.get("/my-assigned-leads")
async def get_my_assigned_leads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get leads assigned to current user"""
    
    leads = db.query(Lead).filter(
        Lead.assigned_to == current_user.id
    ).order_by(Lead.assigned_at.desc()).all()
    
    return {
        "success": True,
        "count": len(leads),
        "leads": [lead.to_dict() for lead in leads]
    }

@router.get("/unassigned-leads")
async def get_unassigned_leads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unassigned leads (team leaders only)"""
    
    if not current_user.is_team_leader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can view unassigned leads"
        )
    
    leads = db.query(Lead).filter(
        Lead.assigned_to.is_(None)
    ).order_by(Lead.created_at.desc()).all()
    
    return {
        "success": True,
        "count": len(leads),
        "leads": [lead.to_dict() for lead in leads]
    }

@router.get("/team-performance")
async def get_team_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get team performance metrics"""
    
    if not current_user.team_id:
        return {
            "success": True,
            "message": "Not part of any team",
            "performance": []
        }
    
    # Get all team members
    members = db.query(User).filter(User.team_id == current_user.team_id).all()
    
    performance = []
    for member in members:
        # Count assigned leads
        assigned_leads = db.query(Lead).filter(
            Lead.assigned_to == member.id
        ).count()
        
        # Count completed tasks
        from app.models.team_simple import TaskAssignment
        completed_tasks = db.query(TaskAssignment).filter(
            TaskAssignment.assignee_id == member.id,
            TaskAssignment.status == "completed"
        ).count()
        
        # Count pending tasks
        pending_tasks = db.query(TaskAssignment).filter(
            TaskAssignment.assignee_id == member.id,
            TaskAssignment.status == "pending"
        ).count()
        
        performance.append({
            'user_id': member.id,
            'name': member.full_name or member.email,
            'email': member.email,
            'is_leader': member.is_team_leader,
            'assigned_leads': assigned_leads,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks
        })
    
    return {
        "success": True,
        "performance": performance
    }

@router.get("/team-activity")
async def get_team_activity(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent team activity feed"""
    
    if not current_user.team_id:
        return {
            "success": True,
            "message": "Not part of any team",
            "activity": []
        }
    
    activity = []
    
    # Recent lead assignments
    recent_assignments = db.query(Lead).filter(
        Lead.assigned_to.isnot(None),
        Lead.assigned_at.isnot(None)
    ).order_by(Lead.assigned_at.desc()).limit(10).all()
    
    for lead in recent_assignments:
        assignee = db.query(User).filter(User.id == lead.assigned_to).first()
        if assignee and assignee.team_id == current_user.team_id:
            activity.append({
                'type': 'lead_assigned',
                'timestamp': lead.assigned_at.isoformat() if lead.assigned_at else None,
                'message': f"{assignee.full_name or assignee.email} was assigned lead: {lead.first_name} {lead.last_name}",
                'user_name': assignee.full_name or assignee.email
            })
    
    # Recent task completions
    from app.models.team_simple import TaskAssignment, Task
    recent_completions = db.query(TaskAssignment).filter(
        TaskAssignment.status == "completed",
        TaskAssignment.completed_at.isnot(None)
    ).order_by(TaskAssignment.completed_at.desc()).limit(10).all()
    
    for assignment in recent_completions:
        task = db.query(Task).filter(Task.id == assignment.task_id).first()
        assignee = db.query(User).filter(User.id == assignment.assignee_id).first()
        
        if task and assignee and assignee.team_id == current_user.team_id:
            activity.append({
                'type': 'task_completed',
                'timestamp': assignment.completed_at.isoformat() if assignment.completed_at else None,
                'message': f"{assignee.full_name or assignee.email} completed task: {task.title}",
                'user_name': assignee.full_name or assignee.email
            })
    
    # Sort by timestamp
    activity.sort(key=lambda x: x['timestamp'] or '', reverse=True)
    
    return {
        "success": True,
        "activity": activity[:limit]
    }
