"""
Tasks API Routes - Database-backed
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.tasks import Task
from app.models.user import User
from app.api.routes.auth import get_current_user

router = APIRouter()

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str  # call, email, text, meeting, other
    dueDate: str
    dueTime: Optional[str] = None
    priority: str = "medium"
    leadName: Optional[str] = None
    leadId: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    dueDate: Optional[str] = None
    dueTime: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None
    leadName: Optional[str] = None
    leadId: Optional[int] = None

@router.get("/")
async def get_tasks(
    filter: Optional[str] = None,
    completed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all tasks for current user
    """
    try:
        query = db.query(Task).filter(Task.user_id == current_user.id)
        
        # Filter by completion status
        if completed is not None:
            query = query.filter(Task.completed == completed)
        
        # Filter by date range
        if filter:
            today = datetime.now().strftime('%Y-%m-%d')
            if filter == 'today':
                query = query.filter(Task.due_date == today)
            elif filter == 'week':
                # Get tasks for next 7 days
                pass  # Add date range logic if needed
        
        # Order by due date, then time
        query = query.order_by(Task.due_date, Task.due_time)
        
        tasks = query.all()
        
        return {
            "success": True,
            "count": len(tasks),
            "tasks": [task.to_dict() for task in tasks]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new task
    """
    try:
        db_task = Task(
            user_id=current_user.id,
            title=task.title,
            description=task.description,
            task_type=task.type,
            due_date=task.dueDate,
            due_time=task.dueTime,
            priority=task.priority,
            lead_name=task.leadName,
            lead_id=task.leadId,
            completed=False
        )
        
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        
        return {
            "success": True,
            "message": "Task created successfully",
            "task": db_task.to_dict()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{task_id}")
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a task
    """
    try:
        db_task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == current_user.id
        ).first()
        
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update fields
        if task_update.title is not None:
            db_task.title = task_update.title
        if task_update.description is not None:
            db_task.description = task_update.description
        if task_update.type is not None:
            db_task.task_type = task_update.type
        if task_update.dueDate is not None:
            db_task.due_date = task_update.dueDate
        if task_update.dueTime is not None:
            db_task.due_time = task_update.dueTime
        if task_update.priority is not None:
            db_task.priority = task_update.priority
        if task_update.completed is not None:
            db_task.completed = task_update.completed
            if task_update.completed:
                db_task.completed_at = datetime.utcnow()
            else:
                db_task.completed_at = None
        if task_update.leadName is not None:
            db_task.lead_name = task_update.leadName
        if task_update.leadId is not None:
            db_task.lead_id = task_update.leadId
        
        db.commit()
        db.refresh(db_task)
        
        return {
            "success": True,
            "message": "Task updated successfully",
            "task": db_task.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a task
    """
    try:
        db_task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == current_user.id
        ).first()
        
        if not db_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        db.delete(db_task)
        db.commit()
        
        return {
            "success": True,
            "message": "Task deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
