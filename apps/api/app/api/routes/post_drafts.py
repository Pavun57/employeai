"""Post Draft routes — LinkedIn post approval workflow."""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func

from app.api.deps import CurrentUser, DbSession
from app.models.agent import PostDraft, AIEmployee, ConnectedPlatform

router = APIRouter()


@router.get("/")
async def list_drafts(
    user: CurrentUser,
    db: DbSession,
    status_filter: Optional[str] = Query(None, alias="status"),
    agent_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    """List post drafts for the user's organization."""
    if not user.org_id:
        return {"drafts": [], "total": 0}

    query = select(PostDraft).where(PostDraft.org_id == user.org_id)

    if status_filter:
        query = query.where(PostDraft.status == status_filter)
    if agent_id:
        query = query.where(PostDraft.agent_id == agent_id)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(PostDraft.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    drafts = result.scalars().all()

    return {
        "drafts": [
            {
                "id": d.id,
                "agent_id": d.agent_id,
                "content": d.content,
                "topics": d.topics,
                "status": d.status,
                "scheduled_for": str(d.scheduled_for) if d.scheduled_for else None,
                "approved_at": str(d.approved_at) if d.approved_at else None,
                "posted_at": str(d.posted_at) if d.posted_at else None,
                "created_at": str(d.created_at),
            }
            for d in drafts
        ],
        "total": total,
    }


@router.get("/{draft_id}")
async def get_draft(draft_id: str, user: CurrentUser, db: DbSession):
    """Get a specific post draft."""
    result = await db.execute(
        select(PostDraft).where(PostDraft.id == draft_id, PostDraft.org_id == user.org_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    return {
        "id": draft.id,
        "agent_id": draft.agent_id,
        "content": draft.content,
        "topics": draft.topics,
        "status": draft.status,
        "scheduled_for": str(draft.scheduled_for) if draft.scheduled_for else None,
        "approved_at": str(draft.approved_at) if draft.approved_at else None,
        "posted_at": str(draft.posted_at) if draft.posted_at else None,
        "linkedin_post_id": draft.linkedin_post_id,
        "created_at": str(draft.created_at),
    }


@router.post("/{draft_id}/approve")
async def approve_draft(draft_id: str, user: CurrentUser, db: DbSession):
    """Approve a post draft and publish to LinkedIn."""
    result = await db.execute(
        select(PostDraft).where(PostDraft.id == draft_id, PostDraft.org_id == user.org_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.status not in ("pending_approval", "draft"):
        raise HTTPException(status_code=400, detail="Draft is not pending approval")

    draft.approved_at = datetime.now(timezone.utc)
    draft.approved_by = user.id
    draft.status = "approved"

    # Try to post to LinkedIn
    platform_result = await db.execute(
        select(ConnectedPlatform).where(
            ConnectedPlatform.org_id == user.org_id,
            ConnectedPlatform.platform == "linkedin",
            ConnectedPlatform.is_active == True,
        )
    )
    linkedin_platform = platform_result.scalar_one_or_none()

    if linkedin_platform:
        from app.services.linkedin_service import post_to_linkedin
        try:
            post_id = await post_to_linkedin(linkedin_platform, draft.content)
            draft.linkedin_post_id = post_id
            draft.posted_at = datetime.now(timezone.utc)
            draft.status = "posted"
        except Exception as e:
            # Still mark as approved even if posting fails
            draft.status = "approved"
            await db.flush()
            return {"id": draft.id, "status": "approved", "post_error": str(e)}
    else:
        await db.flush()
        return {"id": draft.id, "status": "approved", "message": "LinkedIn not connected. Connect LinkedIn to auto-post."}

    await db.flush()
    return {"id": draft.id, "status": draft.status, "posted": True, "linkedin_post_id": draft.linkedin_post_id}


@router.post("/{draft_id}/reject")
async def reject_draft(draft_id: str, user: CurrentUser, db: DbSession):
    """Reject a post draft."""
    result = await db.execute(
        select(PostDraft).where(PostDraft.id == draft_id, PostDraft.org_id == user.org_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.status in ("posted", "rejected"):
        raise HTTPException(status_code=400, detail="Draft cannot be rejected")

    draft.status = "rejected"
    await db.flush()
    return {"id": draft.id, "status": "rejected"}


class EditDraftRequest(BaseModel):
    content: str


@router.patch("/{draft_id}")
async def edit_draft(draft_id: str, body: EditDraftRequest, user: CurrentUser, db: DbSession):
    """Edit a draft's content before approving."""
    result = await db.execute(
        select(PostDraft).where(PostDraft.id == draft_id, PostDraft.org_id == user.org_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if draft.status in ("posted",):
        raise HTTPException(status_code=400, detail="Cannot edit a posted draft")

    draft.content = body.content
    draft.status = "pending_approval"
    await db.flush()
    return {"id": draft.id, "updated": True}


@router.delete("/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_draft(draft_id: str, user: CurrentUser, db: DbSession):
    """Delete a post draft."""
    result = await db.execute(
        select(PostDraft).where(PostDraft.id == draft_id, PostDraft.org_id == user.org_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    await db.delete(draft)
