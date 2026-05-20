"""EmployAI API — Main application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agents, admin, auth, integrations, tasks, knowledge_base, post_drafts
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    yield
    await engine.dispose()


app = FastAPI(
    title="EmployAI API",
    description="AI-powered email auto-reply and LinkedIn posting for SMBs",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(knowledge_base.router, prefix="/api/knowledge-base", tags=["knowledge-base"])
app.include_router(post_drafts.router, prefix="/api/post-drafts", tags=["post-drafts"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "employeai-api", "version": "0.2.0"}
