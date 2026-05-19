"""Auth routes — register, login, profile."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.auth import create_access_token
from app.models.user import Organization, Subscription, User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    org_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: DbSession):
    """Register a new user and create their organization."""
    # Check if email exists
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create organization
    org = Organization(
        id=str(uuid4()),
        name=body.org_name,
        slug=body.org_name.lower().replace(" ", "-")[:100],
    )
    db.add(org)
    await db.flush()

    # Create subscription (free plan)
    subscription = Subscription(
        id=str(uuid4()),
        org_id=org.id,
        plan="free",
        status="active",
        max_agents=1,
        max_tasks_per_day=50,
        activated_at=datetime.now(timezone.utc),
    )
    db.add(subscription)

    # Create user
    user = User(
        id=str(uuid4()),
        email=body.email,
        full_name=body.full_name,
        password_hash=pwd_context.hash(body.password),
        role="user",
        org_id=org.id,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # Generate token
    token = create_access_token(data={"sub": user.id})

    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "org_id": org.id,
            "org_name": org.name,
        },
    }


@router.post("/login")
async def login(body: LoginRequest, db: DbSession):
    """Authenticate and return a JWT token."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    token = create_access_token(data={"sub": user.id})

    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "org_id": user.org_id,
        },
    }


@router.get("/me")
async def get_profile(user: CurrentUser):
    """Get current user profile."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "org_id": user.org_id,
        "is_active": user.is_active,
        "created_at": str(user.created_at),
    }
