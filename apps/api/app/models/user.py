"""User and Organization models."""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Organization(Base, TimestampMixin):
    """Multi-tenant organization."""

    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    website: Mapped[Optional[str]] = mapped_column(String(500))

    # Relationships
    users = relationship("User", back_populates="organization")
    subscription = relationship("Subscription", back_populates="organization", uselist=False)
    ai_employees = relationship("AIEmployee", back_populates="organization")
    connected_platforms = relationship("ConnectedPlatform", back_populates="organization")


class User(Base, TimestampMixin):
    """Application user."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(ENUM("user", "admin", name="user_role", create_type=False), default="user")
    org_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    organization = relationship("Organization", back_populates="users")


class Subscription(Base, TimestampMixin):
    """Organization subscription plan."""

    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    org_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id"), unique=True)
    plan: Mapped[str] = mapped_column(ENUM("free", "pro", "enterprise", name="subscription_plan", create_type=False), default="free")
    status: Mapped[str] = mapped_column(ENUM("active", "inactive", "suspended", name="subscription_status", create_type=False), default="active")
    max_agents: Mapped[int] = mapped_column(default=1)
    max_tasks_per_day: Mapped[int] = mapped_column(default=50)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    organization = relationship("Organization", back_populates="subscription")
