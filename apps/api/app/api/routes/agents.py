"""Agent (AI Employee) routes — Support + LinkedIn Poster."""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func

from app.api.deps import CurrentUser, DbSession
from app.models.agent import AIEmployee, Task, LinkedInAgentConfig, PostDraft
from app.models.user import Subscription

router = APIRouter()


class CreateAgentRequest(BaseModel):
    name: str
    agent_type: str  # support, linkedin_poster
    description: Optional[str] = None
    goals: Optional[list[str]] = None


class UpdateAgentRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    goals: Optional[list[str]] = None
    config: Optional[dict] = None


class LinkedInConfigRequest(BaseModel):
    topics: list[str] = []
    posting_style: str = "professional"
    tone: str = "informative"
    posting_frequency: str = "daily"
    preferred_time: Optional[str] = None
    include_hashtags: bool = True
    max_length: int = 1300


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
            "config": a.config,
            "created_at": str(a.created_at),
        }
        for a in agents
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_agent(body: CreateAgentRequest, user: CurrentUser, db: DbSession):
    """Create a new AI employee."""
    if not user.org_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    if body.agent_type not in ("support", "linkedin_poster"):
        raise HTTPException(status_code=400, detail="Invalid agent type. Must be 'support' or 'linkedin_poster'")

    # Check plan limits
    sub_result = await db.execute(
        select(Subscription).where(Subscription.org_id == user.org_id)
    )
    subscription = sub_result.scalar_one_or_none()
    max_agents = subscription.max_agents if subscription else 1

    agent_count_result = await db.execute(
        select(func.count()).where(AIEmployee.org_id == user.org_id)
    )
    current_count = agent_count_result.scalar() or 0

    if current_count >= max_agents:
        plan_name = subscription.plan if subscription else "free"
        raise HTTPException(
            status_code=403,
            detail=f"Agent limit reached. Your {plan_name} plan allows {max_agents} agent(s). Upgrade to add more.",
        )

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

    # Create default LinkedIn config for linkedin_poster agents
    if body.agent_type == "linkedin_poster":
        config = LinkedInAgentConfig(
            id=str(uuid4()),
            agent_id=agent.id,
        )
        db.add(config)
        await db.flush()

    return {"id": agent.id, "name": agent.name, "status": agent.status, "agent_type": agent.agent_type}


@router.get("/{agent_id}")
async def get_agent(agent_id: str, user: CurrentUser, db: DbSession):
    """Get details of a specific AI employee."""
    result = await db.execute(
        select(AIEmployee).where(AIEmployee.id == agent_id, AIEmployee.org_id == user.org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    response = {
        "id": agent.id,
        "name": agent.name,
        "agent_type": agent.agent_type,
        "status": agent.status,
        "description": agent.description,
        "goals": agent.goals,
        "config": agent.config,
        "created_at": str(agent.created_at),
        "activated_at": str(agent.activated_at) if agent.activated_at else None,
    }

    # Include LinkedIn config if applicable
    if agent.agent_type == "linkedin_poster":
        config_result = await db.execute(
            select(LinkedInAgentConfig).where(LinkedInAgentConfig.agent_id == agent.id)
        )
        li_config = config_result.scalar_one_or_none()
        if li_config:
            response["linkedin_config"] = {
                "topics": li_config.topics or [],
                "posting_style": li_config.posting_style,
                "tone": li_config.tone,
                "posting_frequency": li_config.posting_frequency,
                "preferred_time": str(li_config.preferred_time) if li_config.preferred_time else None,
                "include_hashtags": li_config.include_hashtags,
                "max_length": li_config.max_length,
            }

    return response


@router.patch("/{agent_id}")
async def update_agent(agent_id: str, body: UpdateAgentRequest, user: CurrentUser, db: DbSession):
    """Update an AI employee's configuration."""
    result = await db.execute(
        select(AIEmployee).where(AIEmployee.id == agent_id, AIEmployee.org_id == user.org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    was_inactive = agent.status != "active"

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

    # When activating an agent, set activated_at
    if body.status == "active" and was_inactive:
        agent.activated_at = datetime.now(timezone.utc)

    await db.flush()
    return {"id": agent.id, "status": agent.status, "updated": True}


@router.put("/{agent_id}/linkedin-config")
async def update_linkedin_config(agent_id: str, body: LinkedInConfigRequest, user: CurrentUser, db: DbSession):
    """Update LinkedIn poster agent configuration."""
    result = await db.execute(
        select(AIEmployee).where(AIEmployee.id == agent_id, AIEmployee.org_id == user.org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.agent_type != "linkedin_poster":
        raise HTTPException(status_code=400, detail="Agent is not a LinkedIn poster")

    config_result = await db.execute(
        select(LinkedInAgentConfig).where(LinkedInAgentConfig.agent_id == agent.id)
    )
    config = config_result.scalar_one_or_none()

    if not config:
        config = LinkedInAgentConfig(id=str(uuid4()), agent_id=agent.id)
        db.add(config)

    config.topics = body.topics
    config.posting_style = body.posting_style
    config.tone = body.tone
    config.posting_frequency = body.posting_frequency
    if body.preferred_time:
        from datetime import time as dt_time
        parts = body.preferred_time.split(":")
        config.preferred_time = dt_time(int(parts[0]), int(parts[1]))
    config.include_hashtags = body.include_hashtags
    config.max_length = body.max_length

    await db.flush()
    return {"updated": True}


@router.post("/{agent_id}/generate-post")
async def generate_post(agent_id: str, user: CurrentUser, db: DbSession):
    """Generate a LinkedIn post draft using AI."""
    result = await db.execute(
        select(AIEmployee).where(AIEmployee.id == agent_id, AIEmployee.org_id == user.org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.agent_type != "linkedin_poster":
        raise HTTPException(status_code=400, detail="Agent is not a LinkedIn poster")
    if agent.status != "active":
        raise HTTPException(status_code=400, detail="Agent must be active")

    # Get LinkedIn config
    config_result = await db.execute(
        select(LinkedInAgentConfig).where(LinkedInAgentConfig.agent_id == agent.id)
    )
    li_config = config_result.scalar_one_or_none()

    topics = li_config.topics if li_config and li_config.topics else ["industry insights"]
    style = li_config.posting_style if li_config else "professional"
    tone = li_config.tone if li_config else "informative"
    max_length = li_config.max_length if li_config else 1300
    include_hashtags = li_config.include_hashtags if li_config else True

    # Generate post using Groq LLM
    from app.llm.provider import generate_text
    prompt = f"""Create a LinkedIn post about one of these topics: {', '.join(topics)}.

Style: {style}
Tone: {tone}
Max length: {max_length} characters
Include hashtags: {'Yes' if include_hashtags else 'No'}

Write an engaging, professional LinkedIn post that encourages interaction. Do not include any preamble or explanation, just the post content."""

    content = await generate_text(prompt)

    # Create post draft
    draft = PostDraft(
        id=str(uuid4()),
        org_id=agent.org_id,
        agent_id=agent.id,
        content=content,
        topics=topics,
        status="pending_approval",
    )
    db.add(draft)
    await db.flush()

    return {
        "id": draft.id,
        "content": draft.content,
        "status": draft.status,
        "topics": draft.topics,
    }


@router.post("/{agent_id}/run")
async def run_agent(agent_id: str, user: CurrentUser, db: DbSession):
    """Manually trigger an agent to perform its task."""
    result = await db.execute(
        select(AIEmployee).where(AIEmployee.id == agent_id, AIEmployee.org_id == user.org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.status != "active":
        raise HTTPException(status_code=400, detail="Agent must be active to run")

    if agent.agent_type == "support":
        # Trigger email processing
        from app.services.gmail_service import process_inbox
        result_data = await process_inbox(agent, db)
        return {"id": agent.id, "message": "Inbox processed", "result": result_data}

    elif agent.agent_type == "linkedin_poster":
        # Generate a post draft
        config_result = await db.execute(
            select(LinkedInAgentConfig).where(LinkedInAgentConfig.agent_id == agent.id)
        )
        li_config = config_result.scalar_one_or_none()
        topics = li_config.topics if li_config and li_config.topics else ["industry insights"]
        style = li_config.posting_style if li_config else "professional"
        tone = li_config.tone if li_config else "informative"
        max_length = li_config.max_length if li_config else 1300
        include_hashtags = li_config.include_hashtags if li_config else True

        from app.llm.provider import generate_text
        prompt = f"""Create a LinkedIn post about one of these topics: {', '.join(topics)}.

Style: {style}
Tone: {tone}
Max length: {max_length} characters
Include hashtags: {'Yes' if include_hashtags else 'No'}

Write an engaging, professional LinkedIn post that encourages interaction. Do not include any preamble or explanation, just the post content."""

        content = await generate_text(prompt)
        draft = PostDraft(
            id=str(uuid4()),
            org_id=agent.org_id,
            agent_id=agent.id,
            content=content,
            topics=topics,
            status="pending_approval",
        )
        db.add(draft)
        await db.flush()
        return {"id": agent.id, "message": "Post draft created for approval", "draft_id": draft.id}

    return {"id": agent.id, "message": "Agent run completed"}


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
