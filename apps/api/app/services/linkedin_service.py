"""LinkedIn service — post content to LinkedIn via API."""

import httpx

from app.core.security import decrypt_token
from app.models.agent import ConnectedPlatform


LINKEDIN_API_BASE = "https://api.linkedin.com/v2"


async def get_linkedin_profile_id(token: str) -> str:
    """Get the LinkedIn member's profile URN."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{LINKEDIN_API_BASE}/userinfo",
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            raise Exception(f"Failed to get LinkedIn profile: {resp.text}")
        data = resp.json()
        return data.get("sub", "")


async def post_to_linkedin(platform: ConnectedPlatform, content: str) -> str:
    """Post content to LinkedIn and return the post ID."""
    token = decrypt_token(platform.access_token_encrypted)

    # Get profile URN
    profile_id = await get_linkedin_profile_id(token)
    if not profile_id:
        raise Exception("Could not retrieve LinkedIn profile ID")

    author_urn = f"urn:li:person:{profile_id}"

    # Create post using LinkedIn UGC API
    post_data = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{LINKEDIN_API_BASE}/ugcPosts",
            json=post_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )

        if resp.status_code not in (200, 201):
            raise Exception(f"LinkedIn post failed: {resp.status_code} - {resp.text}")

        # Return the post ID
        return resp.headers.get("x-restli-id", resp.json().get("id", ""))
