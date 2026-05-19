"""Admin routes — user management, subscriptions, logs."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func

from app.api.deps import AdminUser, DbSession
from app.models.user import Organization, Subscription, User

router = APIRouter()


class UpdateSubscriptionRequest(BaseModel):
    plan: Optional[str] = None  # free, pro, enterprise
    status: Optional[str] = None  # active, inactive, suspended
    max_agents: Optional[int] = None
    max_tasks_per_day: Optional[int] = None
    notes: Optional[str] = None


class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None


# --- User Management ---

@router.get("/users")
async def list_users(
    admin: AdminUser,
    db: DbSession,
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    """List all users (admin only)."""
    query = select(User)

    if search:
        query = query.where(
            User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "org_id": u.org_id,
                "is_active": u.is_active,
                "last_login_at": str(u.last_login_at) if u.last_login_at else None,
                "created_at": str(u.created_at),
            }
            for u in users
        ],
        "total": total,
    }


@router.patch("/users/{user_id}")
async def update_user(user_id: str, body: UpdateUserRequest, admin: AdminUser, db: DbSession):
    """Update a user's role or status (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.role is not None:
        if body.role not in ("user", "admin"):
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active

    await db.flush()
    return {"id": user.id, "role": user.role, "is_active": user.is_active, "updated": True}


# --- Subscription Management ---

@router.get("/subscriptions")
async def list_subscriptions(admin: AdminUser, db: DbSession):
    """List all organization subscriptions (admin only)."""
    result = await db.execute(
        select(Subscription, Organization)
        .join(Organization, Subscription.org_id == Organization.id)
        .order_by(Subscription.created_at.desc())
    )
    rows = result.all()

    return [
        {
            "id": sub.id,
            "org_id": sub.org_id,
            "org_name": org.name,
            "plan": sub.plan,
            "status": sub.status,
            "max_agents": sub.max_agents,
            "max_tasks_per_day": sub.max_tasks_per_day,
            "notes": sub.notes,
            "activated_at": str(sub.activated_at) if sub.activated_at else None,
            "expires_at": str(sub.expires_at) if sub.expires_at else None,
        }
        for sub, org in rows
    ]


@router.patch("/subscriptions/{org_id}")
async def update_subscription(
    org_id: str, body: UpdateSubscriptionRequest, admin: AdminUser, db: DbSession
):
    """Update an organization's subscription (admin only)."""
    result = await db.execute(select(Subscription).where(Subscription.org_id == org_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if body.plan is not None:
        if body.plan not in ("free", "pro", "enterprise"):
            raise HTTPException(status_code=400, detail="Invalid plan")
        sub.plan = body.plan
        # Update limits based on plan
        if body.plan == "free":
            sub.max_agents = body.max_agents or 1
            sub.max_tasks_per_day = body.max_tasks_per_day or 50
        elif body.plan == "pro":
            sub.max_agents = body.max_agents or 5
            sub.max_tasks_per_day = body.max_tasks_per_day or 500
        elif body.plan == "enterprise":
            sub.max_agents = body.max_agents or 20
            sub.max_tasks_per_day = body.max_tasks_per_day or 5000

    if body.status is not None:
        if body.status not in ("active", "inactive", "suspended"):
            raise HTTPException(status_code=400, detail="Invalid status")
        sub.status = body.status
    if body.max_agents is not None:
        sub.max_agents = body.max_agents
    if body.max_tasks_per_day is not None:
        sub.max_tasks_per_day = body.max_tasks_per_day
    if body.notes is not None:
        sub.notes = body.notes

    await db.flush()
    return {"org_id": org_id, "plan": sub.plan, "status": sub.status, "updated": True}


# --- System Stats ---

@router.get("/stats")
async def get_system_stats(admin: AdminUser, db: DbSession):
    """Get system-wide statistics (admin only)."""
    from app.models.agent import AIEmployee, Task

    users_count = await db.execute(select(func.count()).select_from(User))
    orgs_count = await db.execute(select(func.count()).select_from(Organization))
    agents_count = await db.execute(select(func.count()).select_from(AIEmployee))
    tasks_count = await db.execute(select(func.count()).select_from(Task))
    active_agents = await db.execute(
        select(func.count()).select_from(AIEmployee).where(AIEmployee.status == "active")
    )

    return {
        "total_users": users_count.scalar(),
        "total_organizations": orgs_count.scalar(),
        "total_agents": agents_count.scalar(),
        "active_agents": active_agents.scalar(),
        "total_tasks": tasks_count.scalar(),
    }
