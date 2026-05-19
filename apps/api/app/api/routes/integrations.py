"""Integration (connected platform) routes."""

from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.security import encrypt_token, decrypt_token
from app.models.agent import ConnectedPlatform

router = APIRouter()


class ConnectPlatformRequest(BaseModel):
    platform: str  # gmail, instagram, linkedin, shopify
    access_token: str
    refresh_token: Optional[str] = None
    account_name: Optional[str] = None
    account_id: Optional[str] = None
    scopes: Optional[list[str]] = None


@router.get("/")
async def list_integrations(user: CurrentUser, db: DbSession):
    """List all connected platforms for the user's organization."""
    if not user.org_id:
        return []

    result = await db.execute(
        select(ConnectedPlatform)
        .where(ConnectedPlatform.org_id == user.org_id)
        .order_by(ConnectedPlatform.created_at.desc())
    )
    platforms = result.scalars().all()
    return [
        {
            "id": p.id,
            "platform": p.platform,
            "account_name": p.account_name,
            "account_id": p.account_id,
            "is_active": p.is_active,
            "scopes": p.scopes,
            "connected_at": str(p.connected_at),
        }
        for p in platforms
    ]


@router.post("/connect", status_code=status.HTTP_201_CREATED)
async def connect_platform(body: ConnectPlatformRequest, user: CurrentUser, db: DbSession):
    """Connect a new platform via OAuth tokens."""
    if not user.org_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    if body.platform not in ("gmail", "instagram", "linkedin", "shopify"):
        raise HTTPException(status_code=400, detail="Invalid platform")

    # Encrypt tokens before storage
    encrypted_access = encrypt_token(body.access_token)
    encrypted_refresh = encrypt_token(body.refresh_token) if body.refresh_token else None

    platform = ConnectedPlatform(
        id=str(uuid4()),
        org_id=user.org_id,
        platform=body.platform,
        account_name=body.account_name,
        account_id=body.account_id,
        access_token_encrypted=encrypted_access,
        refresh_token_encrypted=encrypted_refresh,
        scopes=body.scopes,
        is_active=True,
    )
    db.add(platform)
    await db.flush()

    return {"id": platform.id, "platform": platform.platform, "connected": True}


@router.delete("/{platform_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_platform(platform_id: str, user: CurrentUser, db: DbSession):
    """Disconnect a platform."""
    result = await db.execute(
        select(ConnectedPlatform).where(
            ConnectedPlatform.id == platform_id,
            ConnectedPlatform.org_id == user.org_id,
        )
    )
    platform = result.scalar_one_or_none()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    await db.delete(platform)


@router.get("/{platform_id}/status")
async def check_platform_status(platform_id: str, user: CurrentUser, db: DbSession):
    """Check if a connected platform's token is still valid."""
    result = await db.execute(
        select(ConnectedPlatform).where(
            ConnectedPlatform.id == platform_id,
            ConnectedPlatform.org_id == user.org_id,
        )
    )
    platform = result.scalar_one_or_none()
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    return {
        "id": platform.id,
        "platform": platform.platform,
        "is_active": platform.is_active,
        "token_expires_at": str(platform.token_expires_at) if platform.token_expires_at else None,
    }
