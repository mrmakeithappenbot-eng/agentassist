"""
Team Management API Routes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.team_simple import Team, Task, TaskAssignment
from app.api.routes.auth import get_current_user

router = APIRouter()

# Request/Response Models
class CreateTeamRequest(BaseModel):
    name: str
    description: Optional[str] = None

class InviteMemberRequest(BaseModel):
    email: str
    team_id: int

class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: str = "optional"  # optional or mandatory
    task_category: str = "manual"  # manual, auto, or team
    due_date: Optional[str] = None
    share_with_team: bool = True
    is_private: bool = False
    team_id: Optional[int] = None

class AssignTaskRequest(BaseModel):
    task_id: int
    assignee_ids: List[int]

class UpdateTaskStatusRequest(BaseModel):
    assignment_id: int
    status: str  # pending, accepted, declined, completed
    notes: Optional[str] = None

@router.post("/create")
async def create_team(
    request: CreateTeamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new team (user becomes team leader)"""
    
    try:
        # Create team
        new_team = Team(
            name=request.name,
            description=request.description,
            leader_id=current_user.id
        )
        
        db.add(new_team)
        db.commit()
        db.refresh(new_team)
        
        # Make user a team leader
        current_user.is_team_leader = True
        current_user.team_id = new_team.id
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating team: {str(e)}"
        )
    
    return {
        "success": True,
        "team": new_team.to_dict()
    }

@router.post("/invite")
async def invite_member(
    request: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invite a user to join team"""
    
    # Check if current user is team leader
    if not current_user.is_team_leader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can invite members"
        )
    
    # Find team
    team = db.query(Team).filter(Team.id == request.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if current user leads this team
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't lead this team"
        )
    
    # Find user to invite
    user_to_invite = db.query(User).filter(User.email == request.email).first()
    if not user_to_invite:
        raise HTTPException(status_code=404, detail=f"User with email {request.email} not found")
    
    # Add to team
    user_to_invite.team_id = team.id
    db.commit()
    
    return {
        "success": True,
        "message": f"{user_to_invite.email} added to team {team.name}"
    }

@router.get("/my-team")
async def get_my_team(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's team"""
    
    if not current_user.team_id:
        return {
            "success": True,
            "team": None,
            "message": "Not part of any team"
        }
    
    team = db.query(Team).filter(Team.id == current_user.team_id).first()
    if not team:
        return {
            "success": True,
            "team": None
        }
    
    # Get team members
    members = db.query(User).filter(User.team_id == team.id).all()
    
    return {
        "success": True,
        "team": team.to_dict(),
        "members": [
            {
                'id': m.id,
                'email': m.email,
                'full_name': m.full_name,
                'is_team_leader': m.is_team_leader
            } for m in members
        ],
        "is_leader": team.leader_id == current_user.id
    }

@router.post("/tasks/create")
async def create_task(
    request: CreateTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task"""
    
    # Parse due date if provided
    due_date = None
    if request.due_date:
        try:
            due_date = datetime.fromisoformat(request.due_date.replace('Z', '+00:00'))
        except:
            pass
    
    # Create task
    new_task = Task(
        title=request.title,
        description=request.description,
        task_type=request.task_type,
        task_category=request.task_category,
        due_date=due_date,
        share_with_team=request.share_with_team,
        is_private=request.is_private,
        creator_id=current_user.id,
        team_id=request.team_id or current_user.team_id
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Auto-assign task to creator so it shows in my-tasks
    assignment = TaskAssignment(
        task_id=new_task.id,
        assignee_id=current_user.id,
        status="accepted"  # Creator auto-accepts their own task
    )
    db.add(assignment)
    db.commit()
    
    return {
        "success": True,
        "task": new_task.to_dict()
    }

@router.post("/tasks/assign")
async def assign_task(
    request: AssignTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign task to team members"""
    
    # Find task
    task = db.query(Task).filter(Task.id == request.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check permissions (creator or team leader)
    if task.creator_id != current_user.id and not current_user.is_team_leader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to assign this task"
        )
    
    # Create assignments
    assignments_created = []
    for assignee_id in request.assignee_ids:
        # Check if already assigned
        existing = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == request.task_id,
            TaskAssignment.assignee_id == assignee_id
        ).first()
        
        if not existing:
            assignment = TaskAssignment(
                task_id=request.task_id,
                assignee_id=assignee_id,
                status="pending"
            )
            db.add(assignment)
            assignments_created.append(assignee_id)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Task assigned to {len(assignments_created)} members",
        "assigned_to": assignments_created
    }

@router.post("/tasks/update-status")
async def update_task_status(
    request: UpdateTaskStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update task assignment status"""
    
    # Find assignment
    assignment = db.query(TaskAssignment).filter(
        TaskAssignment.id == request.assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if current user is the assignee
    if assignment.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own assignments"
        )
    
    # Update status
    assignment.status = request.status
    assignment.responded_at = datetime.utcnow()
    
    if request.status == "completed":
        assignment.completed_at = datetime.utcnow()
    
    if request.notes:
        assignment.notes = request.notes
    
    db.commit()
    
    return {
        "success": True,
        "assignment": assignment.to_dict()
    }

@router.get("/tasks/my-tasks")
async def get_my_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tasks assigned to current user"""
    
    assignments = db.query(TaskAssignment).filter(
        TaskAssignment.assignee_id == current_user.id
    ).all()
    
    tasks_with_status = []
    for assignment in assignments:
        # Manually fetch the task (no relationship in simple model)
        task = db.query(Task).filter(Task.id == assignment.task_id).first()
        if task:
            tasks_with_status.append({
                'assignment_id': assignment.id,
                'task': task.to_dict(),
                'status': assignment.status,
                'responded_at': assignment.responded_at.isoformat() if assignment.responded_at else None,
                'completed_at': assignment.completed_at.isoformat() if assignment.completed_at else None,
                'notes': assignment.notes
            })
    
    return {
        "success": True,
        "tasks": tasks_with_status
    }

@router.get("/tasks/team-tasks")
async def get_team_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tasks for current user's team"""
    
    if not current_user.team_id:
        return {
            "success": True,
            "tasks": [],
            "message": "Not part of any team"
        }
    
    tasks = db.query(Task).filter(
        Task.team_id == current_user.team_id,
        Task.share_with_team == True
    ).all()
    
    tasks_data = []
    for task in tasks:
        # Get assignments for this task
        assignments = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == task.id
        ).all()
        
        tasks_data.append({
            'task': task.to_dict(),
            'assignments': [a.to_dict() for a in assignments]
        })
    
    return {
        "success": True,
        "tasks": tasks_data
    }

@router.get("/dashboard")
async def get_team_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get team dashboard with analytics"""
    
    if not current_user.team_id:
        return {
            "success": True,
            "message": "Not part of any team",
            "dashboard": None
        }
    
    team = db.query(Team).filter(Team.id == current_user.team_id).first()
    members = db.query(User).filter(User.team_id == current_user.team_id).all()
    
    # Get task stats
    total_tasks = db.query(Task).filter(Task.team_id == current_user.team_id).count()
    
    pending_assignments = db.query(TaskAssignment).join(Task).filter(
        Task.team_id == current_user.team_id,
        TaskAssignment.status == "pending"
    ).count()
    
    completed_assignments = db.query(TaskAssignment).join(Task).filter(
        Task.team_id == current_user.team_id,
        TaskAssignment.status == "completed"
    ).count()
    
    # Get lead stats
    from app.models.leads import Lead
    total_leads = db.query(Lead).count()
    
    return {
        "success": True,
        "dashboard": {
            "team": team.to_dict() if team else None,
            "member_count": len(members),
            "stats": {
                "total_tasks": total_tasks,
                "pending_tasks": pending_assignments,
                "completed_tasks": completed_assignments,
                "total_leads": total_leads
            },
            "is_leader": team.leader_id == current_user.id if team else False
        }
    }
