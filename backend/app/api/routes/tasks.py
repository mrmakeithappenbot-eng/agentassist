"""
Task Management API Routes
Team leader task creation, assignment, and tracking
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.team import Task, TaskAssignment, TaskType, TaskStatus, TaskCategory
from app.models.user import User

router = APIRouter()

# Request/Response Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: str = "optional"  # optional, mandatory
    task_category: str = "manual"  # auto, manual, team
    due_date: Optional[datetime] = None
    scheduled_for: Optional[datetime] = None
    share_with_team: bool = True
    is_private: bool = False
    assign_to: List[int] = []  # List of user IDs
    team_id: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    task_type: str
    task_category: str
    due_date: Optional[datetime]
    scheduled_for: Optional[datetime]
    share_with_team: bool
    is_private: bool
    creator_id: int
    creator_name: Optional[str]
    team_id: Optional[int]
    assignments: List[dict]
    google_calendar_event_id: Optional[str]
    created_at: datetime

class TaskStatusUpdate(BaseModel):
    status: str  # accepted, declined, completed
    notes: Optional[str] = None

@router.post("/")
async def create_task(task: TaskCreate, user_id: int, db: Session = Depends(get_db)):
    """
    Create a new task and optionally assign to team members
    
    Required query param: user_id (creator)
    
    If share_with_team=True and team assigned, syncs to Google Calendar (future)
    """
    try:
        # Create task
        new_task = Task(
            title=task.title,
            description=task.description,
            task_type=TaskType(task.task_type),
            task_category=TaskCategory(task.task_category),
            due_date=task.due_date,
            scheduled_for=task.scheduled_for,
            share_with_team=task.share_with_team,
            is_private=task.is_private,
            creator_id=user_id,
            team_id=task.team_id
        )
        
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        
        # Create assignments for specified users
        assignments_created = []
        for assignee_id in task.assign_to:
            assignment = TaskAssignment(
                task_id=new_task.id,
                assignee_id=assignee_id,
                status=TaskStatus.PENDING
            )
            db.add(assignment)
            assignments_created.append(assignee_id)
        
        db.commit()
        
        return {
            "success": True,
            "task_id": new_task.id,
            "message": f"Task created and assigned to {len(assignments_created)} team member(s)",
            "google_synced": False  # Future: implement Google Calendar sync
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@router.get("/")
async def get_tasks(
    user_id: int,
    team_id: Optional[int] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get tasks filtered by user, team, category, or status
    
    Returns tasks where user is either:
    - The creator
    - Assigned to the task
    """
    try:
        # Base query: tasks created by user OR assigned to user
        query = db.query(Task).join(
            TaskAssignment, 
            Task.id == TaskAssignment.task_id,
            isouter=True
        ).filter(
            (Task.creator_id == user_id) | (TaskAssignment.assignee_id == user_id)
        )
        
        # Apply filters
        if team_id:
            query = query.filter(Task.team_id == team_id)
        
        if category:
            query = query.filter(Task.task_category == category)
        
        # Get tasks
        tasks = query.distinct().all()
        
        # Format response
        tasks_list = []
        for task in tasks:
            # Get creator name
            creator = db.query(User).filter(User.id == task.creator_id).first()
            creator_name = creator.email if creator else "Unknown"
            
            # Get assignments
            assignments = db.query(TaskAssignment).filter(
                TaskAssignment.task_id == task.id
            ).all()
            
            # Filter by status if specified
            if status:
                assignments = [a for a in assignments if a.status.value == status]
                if not assignments and task.creator_id != user_id:
                    continue  # Skip if no matching assignments for non-creator
            
            tasks_list.append({
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "task_type": task.task_type.value,
                "task_category": task.task_category.value,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "scheduled_for": task.scheduled_for.isoformat() if task.scheduled_for else None,
                "share_with_team": task.share_with_team,
                "is_private": task.is_private,
                "creator_id": task.creator_id,
                "creator_name": creator_name,
                "team_id": task.team_id,
                "assignments": [a.to_dict() for a in assignments],
                "created_at": task.created_at.isoformat() if task.created_at else None
            })
        
        return {
            "success": True,
            "tasks": tasks_list,
            "count": len(tasks_list)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tasks: {str(e)}")

@router.get("/calendar")
async def get_calendar_view(
    user_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get unified calendar view showing:
    - Personal tasks
    - Team tasks
    - AI automated activities
    - Manual tasks
    
    Color coding:
    - AUTO (sparkle): AI automated
    - MANUAL (user icon): Requires human action
    - TEAM (group): Team assignment
    
    Task type:
    - MANDATORY (red dot)
    - OPTIONAL (green dot)
    """
    try:
        # Get tasks for user (created by or assigned to)
        query = db.query(Task).join(
            TaskAssignment,
            Task.id == TaskAssignment.task_id,
            isouter=True
        ).filter(
            (Task.creator_id == user_id) | (TaskAssignment.assignee_id == user_id)
        )
        
        # Filter by date range if provided
        if start_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Task.scheduled_for >= start)
        
        if end_date:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Task.scheduled_for <= end)
        
        tasks = query.distinct().all()
        
        # Format as calendar events
        events = []
        for task in tasks:
            # Get user's assignment status if applicable
            assignment = db.query(TaskAssignment).filter(
                TaskAssignment.task_id == task.id,
                TaskAssignment.assignee_id == user_id
            ).first()
            
            user_status = assignment.status.value if assignment else None
            
            # Get creator name
            creator = db.query(User).filter(User.id == task.creator_id).first()
            
            events.append({
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "start": task.scheduled_for.isoformat() if task.scheduled_for else task.due_date.isoformat() if task.due_date else None,
                "category": task.task_category.value,
                "task_type": task.task_type.value,
                "user_status": user_status,
                "creator_name": creator.email if creator else "Unknown",
                "is_creator": task.creator_id == user_id
            })
        
        return {
            "success": True,
            "events": events,
            "count": len(events)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar: {str(e)}")

@router.patch("/{task_id}/status")
async def update_task_status(
    task_id: int, 
    update: TaskStatusUpdate, 
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Update task status (accept, decline, complete)
    
    Required query param: user_id (the person responding)
    """
    try:
        # Find the assignment
        assignment = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == task_id,
            TaskAssignment.assignee_id == user_id
        ).first()
        
        if not assignment:
            raise HTTPException(status_code=404, detail="Task assignment not found for this user")
        
        # Update status
        assignment.status = TaskStatus(update.status)
        assignment.responded_at = datetime.utcnow()
        assignment.notes = update.notes
        
        if update.status == "completed":
            assignment.completed_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "task_id": task_id,
            "status": update.status,
            "message": f"Task {update.status}"
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {update.status}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@router.get("/{task_id}")
async def get_task(task_id: int, db: Session = Depends(get_db)):
    """
    Get single task details with all assignments
    """
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Get creator
        creator = db.query(User).filter(User.id == task.creator_id).first()
        
        # Get assignments
        assignments = db.query(TaskAssignment).filter(
            TaskAssignment.task_id == task_id
        ).all()
        
        return {
            "success": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "task_type": task.task_type.value,
                "task_category": task.task_category.value,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "scheduled_for": task.scheduled_for.isoformat() if task.scheduled_for else None,
                "share_with_team": task.share_with_team,
                "is_private": task.is_private,
                "creator_id": task.creator_id,
                "creator_name": creator.email if creator else "Unknown",
                "team_id": task.team_id,
                "assignments": [a.to_dict() for a in assignments],
                "created_at": task.created_at.isoformat() if task.created_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch task: {str(e)}")

@router.post("/{task_id}/request-add")
async def request_task_addition(
    task_id: int, 
    user_id: int, 
    reason: str,
    db: Session = Depends(get_db)
):
    """
    Team member requests leader to add task to their calendar
    """
    # TODO: Create notification for team leader
    # For now, just return success
    
    return {
        "success": True,
        "message": "Request sent to team leader"
    }

@router.get("/stats/team")
async def get_task_stats(team_id: int, db: Session = Depends(get_db)):
    """
    Get task completion stats for team
    """
    try:
        # Get all tasks for team
        tasks = db.query(Task).filter(Task.team_id == team_id).all()
        
        # Count statuses across all assignments
        total_assignments = 0
        completed = 0
        pending = 0
        declined = 0
        overdue = 0
        
        now = datetime.utcnow()
        
        for task in tasks:
            assignments = db.query(TaskAssignment).filter(
                TaskAssignment.task_id == task.id
            ).all()
            
            for assignment in assignments:
                total_assignments += 1
                
                if assignment.status == TaskStatus.COMPLETED:
                    completed += 1
                elif assignment.status == TaskStatus.PENDING:
                    pending += 1
                    # Check if overdue
                    if task.due_date and task.due_date < now:
                        overdue += 1
                elif assignment.status == TaskStatus.DECLINED:
                    declined += 1
        
        completion_rate = int((completed / total_assignments * 100)) if total_assignments > 0 else 0
        
        return {
            "success": True,
            "stats": {
                "total_tasks": len(tasks),
                "total_assignments": total_assignments,
                "completed": completed,
                "pending": pending,
                "declined": declined,
                "overdue": overdue,
                "completion_rate": completion_rate
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")
