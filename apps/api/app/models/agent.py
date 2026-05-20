"""AI Employee, Knowledge Base, Post Draft, and Task models."""

from datetime import datetime, time
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import ARRAY, ENUM, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class AIEmployee(Base, TimestampMixin):
    """AI Employee agent configuration."""

    __tablename__ = "ai_employees"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    agent_type: Mapped[str] = mapped_column(ENUM("marketing", "support", "social_media", "linkedin_poster", name="agent_type", create_type=False), nullable=False)
    status: Mapped[str] = mapped_column(ENUM("active", "paused", "configuring", "error", name="agent_status", create_type=False), default="configuring")
    description: Mapped[Optional[str]] = mapped_column(Text)
    config: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text)
    goals: Mapped[Optional[list]] = mapped_column(ARRAY(String), default=list)
    created_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    organization = relationship("Organization", back_populates="ai_employees")
    tasks = relationship("Task", back_populates="agent", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="agent", cascade="all, delete-orphan")
    post_drafts = relationship("PostDraft", back_populates="agent", cascade="all, delete-orphan")
    linkedin_config = relationship("LinkedInAgentConfig", back_populates="agent", uselist=False, cascade="all, delete-orphan")


class ConnectedPlatform(Base, TimestampMixin):
    """OAuth-connected external platform."""

    __tablename__ = "connected_platforms"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    platform: Mapped[str] = mapped_column(ENUM("gmail", "instagram", "linkedin", "shopify", name="platform_type", create_type=False), nullable=False)
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


class KnowledgeBase(Base, TimestampMixin):
    """Knowledge base entries for customer support auto-replies."""

    __tablename__ = "knowledge_base"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class PostDraft(Base, TimestampMixin):
    """LinkedIn post drafts with approval workflow."""

    __tablename__ = "post_drafts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("ai_employees.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    topics: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    linkedin_post_id: Mapped[Optional[str]] = mapped_column(String(255))

    # Relationships
    agent = relationship("AIEmployee", back_populates="post_drafts")


class LinkedInAgentConfig(Base, TimestampMixin):
    """Configuration for LinkedIn poster agent."""

    __tablename__ = "linkedin_agent_config"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("ai_employees.id"), unique=True, nullable=False)
    topics: Mapped[Optional[list]] = mapped_column(ARRAY(String), default=list)
    posting_style: Mapped[str] = mapped_column(String(50), default="professional")
    tone: Mapped[str] = mapped_column(String(50), default="informative")
    posting_frequency: Mapped[str] = mapped_column(String(50), default="daily")
    preferred_time: Mapped[Optional[time]] = mapped_column(Time, default=None)
    include_hashtags: Mapped[bool] = mapped_column(Boolean, default=True)
    max_length: Mapped[int] = mapped_column(Integer, default=1300)

    # Relationships
    agent = relationship("AIEmployee", back_populates="linkedin_config")


class Task(Base):
    """Task executed by an AI employee."""

    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), nullable=False)
    agent_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("ai_employees.id"), nullable=False)
    platform: Mapped[Optional[str]] = mapped_column(ENUM("gmail", "instagram", "linkedin", "shopify", name="platform_type", create_type=False))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(ENUM("pending", "running", "completed", "failed", "cancelled", name="task_status", create_type=False), default="pending")
    priority: Mapped[str] = mapped_column(ENUM("low", "medium", "high", "urgent", name="task_priority", create_type=False), default="medium")
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
    platform: Mapped[Optional[str]] = mapped_column(ENUM("gmail", "instagram", "linkedin", "shopify", name="platform_type", create_type=False))
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
