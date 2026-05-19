"""LinkedIn connector — content publishing and profile management."""

from typing import Optional

import httpx

from app.integrations.base import BaseConnector

LINKEDIN_API_BASE = "https://api.linkedin.com/v2"


class LinkedInConnector(BaseConnector):
    """Connector for LinkedIn content publishing and analytics."""

    async def verify_connection(self) -> bool:
        """Verify LinkedIn token validity."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{LINKEDIN_API_BASE}/userinfo",
                headers={"Authorization": f"Bearer {self.access_token}"},
            )
            return response.status_code == 200

    async def refresh_access_token(self) -> Optional[str]:
        """Refresh LinkedIn OAuth token."""
        if not self.refresh_token:
            return None

        from app.core.config import settings

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": self.refresh_token,
                    "client_id": settings.linkedin_client_id,
                    "client_secret": settings.linkedin_client_secret,
                },
            )
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                return self.access_token
            return None

    async def get_account_info(self) -> dict:
        """Get LinkedIn profile info."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{LINKEDIN_API_BASE}/userinfo",
                headers={"Authorization": f"Bearer {self.access_token}"},
            )
            if response.status_code == 200:
                return response.json()
            return {}

    async def get_person_urn(self) -> Optional[str]:
        """Get the LinkedIn person URN for the authenticated user."""
        info = await self.get_account_info()
        if sub := info.get("sub"):
            return f"urn:li:person:{sub}"
        return None

    async def create_post(self, text: str, media_url: Optional[str] = None) -> dict:
        """Create a LinkedIn post."""
        person_urn = await self.get_person_urn()
        if not person_urn:
            return {"error": "Could not determine user identity"}

        post_body: dict = {
            "author": person_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": text},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{LINKEDIN_API_BASE}/ugcPosts",
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0",
                },
                json=post_body,
            )
            if response.status_code in (200, 201):
                return response.json()
            return {"error": response.text}
