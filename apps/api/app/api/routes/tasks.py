"""Task routes — view and manage agent tasks."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func

from app.api.deps import CurrentUser, DbSession
from app.models.agent import Task

router = APIRouter()


@router.get("/")
async def list_tasks(
    user: CurrentUser,
    db: DbSession,
    status: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    """List tasks for the user's organization with optional filters."""
    if not user.org_id:
        return {"tasks": [], "total": 0}

    query = select(Task).where(Task.org_id == user.org_id)

    if status:
        query = query.where(Task.status == status)
    if agent_id:
        query = query.where(Task.agent_id == agent_id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Fetch page
    query = query.order_by(Task.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return {
        "tasks": [
            {
                "id": t.id,
                "agent_id": t.agent_id,
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "platform": t.platform,
                "requires_approval": t.requires_approval,
                "created_at": str(t.created_at),
                "completed_at": str(t.completed_at) if t.completed_at else None,
            }
            for t in tasks
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{task_id}")
async def get_task(task_id: str, user: CurrentUser, db: DbSession):
    """Get details of a specific task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.org_id == user.org_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "id": task.id,
        "agent_id": task.agent_id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "platform": task.platform,
        "input_data": task.input_data,
        "output_data": task.output_data,
        "error_message": task.error_message,
        "requires_approval": task.requires_approval,
        "approved_at": str(task.approved_at) if task.approved_at else None,
        "started_at": str(task.started_at) if task.started_at else None,
        "completed_at": str(task.completed_at) if task.completed_at else None,
        "created_at": str(task.created_at),
    }


@router.post("/{task_id}/approve")
async def approve_task(task_id: str, user: CurrentUser, db: DbSession):
    """Approve a pending task for execution."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.org_id == user.org_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.requires_approval:
        raise HTTPException(status_code=400, detail="Task does not require approval")

    if task.status != "pending":
        raise HTTPException(status_code=400, detail="Task is not in pending state")

    task.approved_by = user.id
    from datetime import datetime, timezone
    task.approved_at = datetime.now(timezone.utc)
    task.status = "running"

    await db.flush()
    return {"id": task.id, "status": "running", "approved": True}


@router.post("/{task_id}/cancel")
async def cancel_task(task_id: str, user: CurrentUser, db: DbSession):
    """Cancel a pending or running task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.org_id == user.org_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Task cannot be cancelled")

    task.status = "cancelled"
    await db.flush()
    return {"id": task.id, "status": "cancelled"}
