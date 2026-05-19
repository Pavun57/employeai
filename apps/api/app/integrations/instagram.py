"""Instagram connector — Meta Graph API for messaging and content."""

from typing import Optional

import httpx

from app.integrations.base import BaseConnector

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


class InstagramConnector(BaseConnector):
    """Connector for Instagram via Meta Business API."""

    async def verify_connection(self) -> bool:
        """Verify Instagram token validity."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GRAPH_API_BASE}/me",
                params={"access_token": self.access_token, "fields": "id,name"},
            )
            return response.status_code == 200

    async def refresh_access_token(self) -> Optional[str]:
        """Refresh long-lived Instagram token."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GRAPH_API_BASE}/oauth/access_token",
                params={
                    "grant_type": "ig_refresh_token",
                    "access_token": self.access_token,
                },
            )
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                return self.access_token
            return None

    async def get_account_info(self) -> dict:
        """Get Instagram business account info."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GRAPH_API_BASE}/me",
                params={
                    "access_token": self.access_token,
                    "fields": "id,name,username,followers_count,media_count",
                },
            )
            if response.status_code == 200:
                return response.json()
            return {}

    async def get_conversations(self, limit: int = 10) -> list[dict]:
        """Get Instagram DM conversations."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GRAPH_API_BASE}/me/conversations",
                params={
                    "access_token": self.access_token,
                    "platform": "instagram",
                    "limit": limit,
                },
            )
            if response.status_code == 200:
                return response.json().get("data", [])
            return []

    async def send_message(self, recipient_id: str, message: str) -> dict:
        """Send an Instagram DM."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GRAPH_API_BASE}/me/messages",
                params={"access_token": self.access_token},
                json={
                    "recipient": {"id": recipient_id},
                    "message": {"text": message},
                },
            )
            if response.status_code == 200:
                return response.json()
            return {"error": response.text}

    async def publish_media(self, image_url: str, caption: str) -> dict:
        """Publish an image post to Instagram."""
        async with httpx.AsyncClient() as client:
            # Step 1: Create media container
            container_resp = await client.post(
                f"{GRAPH_API_BASE}/me/media",
                params={
                    "access_token": self.access_token,
                    "image_url": image_url,
                    "caption": caption,
                },
            )
            if container_resp.status_code != 200:
                return {"error": container_resp.text}

            container_id = container_resp.json()["id"]

            # Step 2: Publish the container
            publish_resp = await client.post(
                f"{GRAPH_API_BASE}/me/media_publish",
                params={
                    "access_token": self.access_token,
                    "creation_id": container_id,
                },
            )
            if publish_resp.status_code == 200:
                return publish_resp.json()
            return {"error": publish_resp.text}

    async def get_media_insights(self, media_id: str) -> dict:
        """Get insights for a specific media post."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GRAPH_API_BASE}/{media_id}/insights",
                params={
                    "access_token": self.access_token,
                    "metric": "impressions,reach,engagement,saved",
                },
            )
            if response.status_code == 200:
                return response.json()
            return {}
