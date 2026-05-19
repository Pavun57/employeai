"""Agent (AI Employee) routes."""

from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.agent import AIEmployee

router = APIRouter()


class CreateAgentRequest(BaseModel):
    name: str
    agent_type: str  # marketing, support, social_media
    description: Optional[str] = None
    goals: Optional[list[str]] = None


class UpdateAgentRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    goals: Optional[list[str]] = None
    config: Optional[dict] = None


class AgentResponse(BaseModel):
    id: str
    name: str
    agent_type: str
    status: str
    description: Optional[str]
    goals: Optional[list[str]]
    config: Optional[dict]
    created_at: str

    class Config:
        from_attributes = True


@router.get("/")
async def list_agents(user: CurrentUser, db: DbSession):
    """List all AI employees for the user's organization."""
    if not user.org_id:
        return []

    result = await db.execute(
        select(AIEmployee).where(AIEmployee.org_id == user.org_id).order_by(AIEmployee.created_at.desc())
    )
    agents = result.scalars().all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "agent_type": a.agent_type,
            "status": a.status,
            "description": a.description,
            "goals": a.goals,
            "created_at": str(a.created_at),
        }
        for a in agents
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_agent(body: CreateAgentRequest, user: CurrentUser, db: DbSession):
    """Create a new AI employee."""
    if not user.org_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    if body.agent_type not in ("marketing", "support", "social_media"):
        raise HTTPException(status_code=400, detail="Invalid agent type")

    agent = AIEmployee(
        id=str(uuid4()),
        org_id=user.org_id,
        name=body.name,
        agent_type=body.agent_type,
        description=body.description,
        goals=body.goals or [],
        created_by=user.id,
        status="configuring",
    )
    db.add(agent)
    await db.flush()

    return {"id": agent.id, "name": agent.name, "status": agent.status}


@router.get("/{agent_id}")
async def get_agent(agent_id: str, user: CurrentUser, db: DbSession):
    """Get details of a specific AI employee."""
    result = await db.execute(
        select(AIEmployee).where(AIEmployee.id == agent_id, AIEmployee.org_id == user.org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return {
        "id": agent.id,
        "name": agent.name,
        "agent_type": agent.agent_type,
        "status": agent.status,
        "description": agent.description,
        "goals": agent.goals,
        "config": agent.config,
        "system_prompt": agent.system_prompt,
        "created_at": str(agent.created_at),
        "activated_at": str(agent.activated_at) if agent.activated_at else None,
    }


@router.patch("/{agent_id}")
async def update_agent(agent_id: str, body: UpdateAgentRequest, user: CurrentUser, db: DbSession):
    """Update an AI employee's configuration."""
    result = await db.execute(
        select(AIEmployee).where(AIEmployee.id == agent_id, AIEmployee.org_id == user.org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if body.name is not None:
        agent.name = body.name
    if body.status is not None:
        if body.status not in ("active", "paused", "configuring"):
            raise HTTPException(status_code=400, detail="Invalid status")
        agent.status = body.status
    if body.description is not None:
        agent.description = body.description
    if body.goals is not None:
        agent.goals = body.goals
    if body.config is not None:
        agent.config = body.config

    await db.flush()
    return {"id": agent.id, "status": agent.status, "updated": True}


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(agent_id: str, user: CurrentUser, db: DbSession):
    """Delete an AI employee."""
    result = await db.execute(
        select(AIEmployee).where(AIEmployee.id == agent_id, AIEmployee.org_id == user.org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    await db.delete(agent)
