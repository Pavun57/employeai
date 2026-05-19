"""AI Employee and Task models."""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class AIEmployee(Base, TimestampMixin):
    """AI Employee agent configuration."""

    __tablename__ = "ai_employees"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    agent_type: Mapped[str] = mapped_column(String(50), nullable=False)  # marketing, support, social_media
    status: Mapped[str] = mapped_column(String(20), default="configuring")
    description: Mapped[Optional[str]] = mapped_column(Text)
    config: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text)
    goals: Mapped[Optional[list]] = mapped_column(ARRAY(String), default=list)
    created_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    organization = relationship("Organization", back_populates="ai_employees")
    tasks = relationship("Task", back_populates="agent")
    conversations = relationship("Conversation", back_populates="agent")


class ConnectedPlatform(Base, TimestampMixin):
    """OAuth-connected external platform."""

    __tablename__ = "connected_platforms"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # gmail, instagram, linkedin, shopify
    account_name: Mapped[Optional[str]] = mapped_column(String(255))
    account_id: Mapped[Optional[str]] = mapped_column(String(255))
    access_token_encrypted: Mapped[Optional[bytes]] = mapped_column()
    refresh_token_encrypted: Mapped[Optional[bytes]] = mapped_column()
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    scopes: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    connected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    organization = relationship("Organization", back_populates="connected_platforms")


class Task(Base):
    """Task executed by an AI employee."""

    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("ai_employees.id"), nullable=False)
    platform: Mapped[Optional[str]] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    input_data: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    output_data: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")

    # Relationships
    agent = relationship("AIEmployee", back_populates="tasks")


class Conversation(Base, TimestampMixin):
    """Conversation thread managed by an AI employee."""

    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("ai_employees.id"), nullable=False)
    platform: Mapped[Optional[str]] = mapped_column(String(50))
    external_contact: Mapped[Optional[str]] = mapped_column(String(255))
    subject: Mapped[Optional[str]] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, default=dict)

    # Relationships
    agent = relationship("AIEmployee", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    """Individual message in a conversation."""

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    conversation_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("conversations.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class ActivityLog(Base):
    """Audit trail for actions."""

    __tablename__ = "activity_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    agent_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("ai_employees.id"))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()")
