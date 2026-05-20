"""Integration (connected platform) routes — Gmail + LinkedIn only."""

from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.security import encrypt_token, decrypt_token
from app.models.agent import ConnectedPlatform

router = APIRouter()


# === OAuth initiation endpoints ===

@router.get("/oauth/{platform}/authorize")
async def oauth_authorize(platform: str, request: Request):
    """Redirect user to the OAuth provider's authorization page."""
    if platform == "gmail":
        if not settings.google_client_id:
            raise HTTPException(status_code=400, detail="Google OAuth not configured")
        params = urlencode({
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
            "access_type": "offline",
            "prompt": "consent",
        })
        return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")

    elif platform == "linkedin":
        if not settings.linkedin_client_id:
            raise HTTPException(status_code=400, detail="LinkedIn OAuth not configured")
        params = urlencode({
            "client_id": settings.linkedin_client_id,
            "redirect_uri": settings.linkedin_redirect_uri,
            "response_type": "code",
            "scope": "openid profile w_member_social",
        })
        return RedirectResponse(f"https://www.linkedin.com/oauth/v2/authorization?{params}")

    raise HTTPException(status_code=400, detail="Invalid platform. Only 'gmail' and 'linkedin' are supported.")


@router.get("/oauth/{platform}/callback")
async def oauth_callback(platform: str, request: Request, db: DbSession):
    """Handle OAuth callback — exchange code for tokens and store them."""
    import httpx

    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code received")

    async with httpx.AsyncClient() as client:
        if platform == "gmail":
            resp = await client.post("https://oauth2.googleapis.com/token", data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            })
        elif platform == "linkedin":
            resp = await client.post("https://www.linkedin.com/oauth/v2/accessToken", data={
                "client_id": settings.linkedin_client_id,
                "client_secret": settings.linkedin_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.linkedin_redirect_uri,
            })
        else:
            raise HTTPException(status_code=400, detail="Invalid platform")

    if resp.status_code != 200:
        return RedirectResponse(f"{settings.app_url}/dashboard/integrations?error=oauth_failed&platform={platform}")

    token_data = resp.json()
    access_token = token_data.get("access_token", "")
    refresh_token = token_data.get("refresh_token", "")

    # Store encrypted tokens
    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None

    # Get org from state param or fallback to first org
    from app.models.user import Organization
    org_result = await db.execute(select(Organization).limit(1))
    org = org_result.scalar_one_or_none()

    if org:
        existing = await db.execute(
            select(ConnectedPlatform).where(
                ConnectedPlatform.org_id == org.id,
                ConnectedPlatform.platform == platform,
            )
        )
        existing_platform = existing.scalar_one_or_none()

        if existing_platform:
            existing_platform.access_token_encrypted = encrypted_access
            existing_platform.refresh_token_encrypted = encrypted_refresh
            existing_platform.is_active = True
            existing_platform.connected_at = datetime.now(timezone.utc)
        else:
            new_platform = ConnectedPlatform(
                id=str(uuid4()),
                org_id=org.id,
                platform=platform,
                account_name=token_data.get("email", platform.title()),
                access_token_encrypted=encrypted_access,
                refresh_token_encrypted=encrypted_refresh,
                is_active=True,
                connected_at=datetime.now(timezone.utc),
            )
            db.add(new_platform)

    return RedirectResponse(f"{settings.app_url}/dashboard/integrations?connected={platform}")


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
