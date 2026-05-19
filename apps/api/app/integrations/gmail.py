"""Gmail connector — send, read, draft emails via Google API."""

from typing import Optional

import httpx

from app.integrations.base import BaseConnector

GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1"


class GmailConnector(BaseConnector):
    """Connector for Gmail / Google Workspace email operations."""

    async def verify_connection(self) -> bool:
        """Check if the Gmail token is valid."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GMAIL_API_BASE}/users/me/profile",
                headers={"Authorization": f"Bearer {self.access_token}"},
            )
            return response.status_code == 200

    async def refresh_access_token(self) -> Optional[str]:
        """Refresh Gmail OAuth token."""
        if not self.refresh_token:
            return None

        from app.core.config import settings

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                return self.access_token
            return None

    async def get_account_info(self) -> dict:
        """Get Gmail account profile."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GMAIL_API_BASE}/users/me/profile",
                headers={"Authorization": f"Bearer {self.access_token}"},
            )
            if response.status_code == 200:
                return response.json()
            return {}

    async def list_messages(self, query: str = "", max_results: int = 10) -> list[dict]:
        """List messages matching a query."""
        async with httpx.AsyncClient() as client:
            params = {"maxResults": max_results}
            if query:
                params["q"] = query

            response = await client.get(
                f"{GMAIL_API_BASE}/users/me/messages",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params=params,
            )
            if response.status_code == 200:
                return response.json().get("messages", [])
            return []

    async def get_message(self, message_id: str) -> dict:
        """Get a specific email message."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GMAIL_API_BASE}/users/me/messages/{message_id}",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params={"format": "full"},
            )
            if response.status_code == 200:
                return response.json()
            return {}

    async def send_email(self, to: str, subject: str, body: str) -> dict:
        """Send an email."""
        import base64
        from email.mime.text import MIMEText

        message = MIMEText(body, "html")
        message["to"] = to
        message["subject"] = subject
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GMAIL_API_BASE}/users/me/messages/send",
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json",
                },
                json={"raw": raw},
            )
            if response.status_code == 200:
                return response.json()
            return {"error": response.text}

    async def create_draft(self, to: str, subject: str, body: str) -> dict:
        """Create an email draft."""
        import base64
        from email.mime.text import MIMEText

        message = MIMEText(body, "html")
        message["to"] = to
        message["subject"] = subject
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GMAIL_API_BASE}/users/me/drafts",
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json",
                },
                json={"message": {"raw": raw}},
            )
            if response.status_code == 200:
                return response.json()
            return {"error": response.text}
