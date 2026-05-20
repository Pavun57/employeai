"""Gmail service — reads inbox, detects inquiries, generates auto-replies."""

import base64
import logging
from email.mime.text import MIMEText
from typing import Optional

import httpx
from sqlalchemy import select

from app.core.config import settings
from app.core.security import decrypt_token, encrypt_token
from app.models.agent import AIEmployee, ConnectedPlatform, KnowledgeBase, Conversation, Message


logger = logging.getLogger(__name__)
GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"


async def get_gmail_token(org_id: str, db) -> Optional[str]:
    """Get valid Gmail access token, refreshing if expired."""
    result = await db.execute(
        select(ConnectedPlatform).where(
            ConnectedPlatform.org_id == org_id,
            ConnectedPlatform.platform == "gmail",
            ConnectedPlatform.is_active == True,
        )
    )
    platform = result.scalar_one_or_none()
    if not platform or not platform.access_token_encrypted:
        logger.error(f"Gmail not connected for org {org_id}")
        return None

    access_token = decrypt_token(platform.access_token_encrypted)

    # Test if current token works
    async with httpx.AsyncClient() as client:
        test_resp = await client.get(
            f"{GMAIL_API_BASE}/profile",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if test_resp.status_code == 200:
        return access_token

    # Token expired — try refresh
    logger.info(f"Gmail access token expired for org {org_id}, attempting refresh...")

    if not platform.refresh_token_encrypted:
        logger.error(f"No refresh token available for org {org_id}")
        return None

    refresh_token = decrypt_token(platform.refresh_token_encrypted)
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://oauth2.googleapis.com/token", data={
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        })

    if resp.status_code != 200:
        logger.error(f"Gmail token refresh failed: {resp.status_code} - {resp.text}")
        return None

    token_data = resp.json()
    new_access_token = token_data.get("access_token", "")
    if not new_access_token:
        logger.error("Gmail refresh response missing access_token")
        return None

    # Update stored token
    platform.access_token_encrypted = encrypt_token(new_access_token)
    # If a new refresh token is issued, update it too
    if token_data.get("refresh_token"):
        platform.refresh_token_encrypted = encrypt_token(token_data["refresh_token"])

    await db.flush()
    logger.info(f"Gmail token refreshed successfully for org {org_id}")
    return new_access_token


async def get_knowledge_base_context(org_id: str, db) -> str:
    """Get all active knowledge base entries as context for LLM."""
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.org_id == org_id,
            KnowledgeBase.is_active == True,
        )
    )
    entries = result.scalars().all()
    if not entries:
        return "No knowledge base entries available. Reply politely that you'll get back to them."

    context_parts = []
    for entry in entries:
        context_parts.append(f"### {entry.title}\n{entry.content}")

    return "\n\n".join(context_parts)


async def fetch_unread_emails(token: str, max_results: int = 10) -> list[dict]:
    """Fetch unread emails from Gmail inbox."""
    async with httpx.AsyncClient() as client:
        # Get unread messages
        resp = await client.get(
            f"{GMAIL_API_BASE}/messages",
            params={"q": "is:unread in:inbox category:primary", "maxResults": max_results},
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            logger.error(f"Gmail messages list failed: {resp.status_code} - {resp.text}")
            return []

        messages_list = resp.json().get("messages", [])
        logger.info(f"Found {len(messages_list)} unread messages in inbox")

        if not messages_list:
            return []

        emails = []

        for msg_ref in messages_list:
            msg_resp = await client.get(
                f"{GMAIL_API_BASE}/messages/{msg_ref['id']}",
                params={"format": "full"},
                headers={"Authorization": f"Bearer {token}"},
            )
            if msg_resp.status_code != 200:
                logger.warning(f"Failed to fetch message {msg_ref['id']}: {msg_resp.status_code}")
                continue

            msg_data = msg_resp.json()
            headers = {h["name"].lower(): h["value"] for h in msg_data.get("payload", {}).get("headers", [])}

            # Extract body
            body = _extract_body(msg_data.get("payload", {}))

            emails.append({
                "id": msg_ref["id"],
                "thread_id": msg_data.get("threadId"),
                "from": headers.get("from", ""),
                "to": headers.get("to", ""),
                "subject": headers.get("subject", ""),
                "body": body,
                "date": headers.get("date", ""),
            })

        return emails


def _extract_body(payload: dict) -> str:
    """Extract plain text body from Gmail message payload."""
    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")

    parts = payload.get("parts", [])
    for part in parts:
        if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
            return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
        # Recurse into multipart
        if part.get("parts"):
            result = _extract_body(part)
            if result:
                return result

    return ""


async def generate_reply(email_body: str, subject: str, sender: str, kb_context: str) -> str:
    """Use LLM to generate a reply based on knowledge base."""
    from app.llm.provider import generate_text

    prompt = f"""You are a customer support agent. Use the knowledge base below to answer the customer's inquiry.
If the answer is not in the knowledge base, politely say you'll forward their question to the team.

=== KNOWLEDGE BASE ===
{kb_context}
=== END KNOWLEDGE BASE ===

=== CUSTOMER EMAIL ===
From: {sender}
Subject: {subject}
Message: {email_body[:2000]}
=== END EMAIL ===

Write a professional, helpful reply. Do not include subject line or email headers, just the body of the reply. Keep it concise and friendly."""

    return await generate_text(prompt)


async def send_reply(token: str, thread_id: str, to: str, subject: str, reply_body: str) -> bool:
    """Send a reply email via Gmail API."""
    # Ensure subject has Re: prefix
    if not subject.lower().startswith("re:"):
        subject = f"Re: {subject}"

    message = MIMEText(reply_body)
    message["to"] = to
    message["subject"] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GMAIL_API_BASE}/messages/send",
            json={"raw": raw, "threadId": thread_id},
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            logger.error(f"Gmail send failed ({resp.status_code}): {resp.text}")
        return resp.status_code == 200


async def mark_as_read(token: str, message_id: str) -> bool:
    """Mark a message as read in Gmail."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GMAIL_API_BASE}/messages/{message_id}/modify",
            json={"removeLabelIds": ["UNREAD"]},
            headers={"Authorization": f"Bearer {token}"},
        )
        return resp.status_code == 200


async def process_inbox(agent: AIEmployee, db) -> dict:
    """Main function: process unread emails and auto-reply using knowledge base."""
    logger.info(f"Processing inbox for agent '{agent.name}' (org: {agent.org_id})")

    token = await get_gmail_token(agent.org_id, db)
    if not token:
        logger.error("Cannot process inbox — no valid Gmail token")
        return {"error": "Gmail not connected or token expired. Please reconnect Gmail.", "processed": 0}

    # Get knowledge base context
    kb_context = await get_knowledge_base_context(agent.org_id, db)
    logger.info(f"KB context loaded ({len(kb_context)} chars)")

    # Fetch unread emails
    emails = await fetch_unread_emails(token, max_results=5)
    if not emails:
        logger.info("No unread emails to process")
        return {"processed": 0, "message": "No unread emails"}

    logger.info(f"Processing {len(emails)} unread emails...")
    processed = 0
    replies_sent = 0

    for email in emails:
        # Skip emails from noreply or automated sources
        sender = email["from"]
        sender_lower = sender.lower()
        if any(skip in sender_lower for skip in [
            "noreply", "no-reply", "no_reply", "mailer-daemon", "notifications",
            "newsletter", "marketing", "hello@mail.", "updates@",
            "digest@", "info@mail.", "team@mail.", "notification",
        ]):
            logger.info(f"Skipping automated/marketing email from: {sender}")
            await mark_as_read(token, email["id"])
            processed += 1
            continue

        logger.info(f"Generating reply for email from {sender}: '{email['subject']}'")

        # Generate reply
        reply = await generate_reply(
            email_body=email["body"],
            subject=email["subject"],
            sender=sender,
            kb_context=kb_context,
        )

        # Send reply
        success = await send_reply(
            token=token,
            thread_id=email["thread_id"],
            to=sender,
            subject=email["subject"],
            reply_body=reply,
        )

        if success:
            replies_sent += 1
            logger.info(f"Reply sent to {sender}")
            # Mark as read
            await mark_as_read(token, email["id"])

            # Log conversation
            from uuid import uuid4
            conversation = Conversation(
                id=str(uuid4()),
                org_id=agent.org_id,
                agent_id=agent.id,
                platform="gmail",
                external_contact=sender,
                subject=email["subject"],
            )
            db.add(conversation)
            await db.flush()

            # Log messages
            incoming = Message(
                id=str(uuid4()),
                conversation_id=conversation.id,
                role="external",
                content=email["body"][:5000],
            )
            outgoing = Message(
                id=str(uuid4()),
                conversation_id=conversation.id,
                role="assistant",
                content=reply,
            )
            db.add(incoming)
            db.add(outgoing)
        else:
            logger.error(f"Failed to send reply to {sender}")

        processed += 1

    await db.flush()
    logger.info(f"Inbox processing complete: {processed} processed, {replies_sent} replies sent")
    return {"processed": processed, "replies_sent": replies_sent}
