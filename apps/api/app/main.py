"""EmployAI API — Main application entry point."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agents, auth, integrations, tasks, knowledge_base, post_drafts
from app.core.config import settings
from app.core.database import engine

logger = logging.getLogger(__name__)

INBOX_POLL_INTERVAL = 120  # seconds (2 minutes)


async def inbox_polling_loop():
    """Background task: poll Gmail for active support agents every 2 minutes."""
    from sqlalchemy import select
    from app.core.database import async_session
    from app.models.agent import AIEmployee
    from app.models.user import User, Organization  # ensure all models loaded
    from app.services.gmail_service import process_inbox

    # Wait a bit for app to fully start
    await asyncio.sleep(5)
    logger.info(f"Inbox polling started (every {INBOX_POLL_INTERVAL}s)")

    while True:
        try:
            async with async_session() as db:
                result = await db.execute(
                    select(AIEmployee).where(
                        AIEmployee.agent_type == "support",
                        AIEmployee.status == "active",
                    )
                )
                agents_list = result.scalars().all()

                for agent in agents_list:
                    try:
                        res = await process_inbox(agent, db)
                        if res.get("replies_sent", 0) > 0:
                            logger.info(f"[{agent.name}] Auto-processed: {res}")
                    except Exception as e:
                        logger.error(f"[{agent.name}] Inbox poll error: {e}")

                await db.commit()
        except Exception as e:
            logger.error(f"Inbox polling loop error: {e}")

        await asyncio.sleep(INBOX_POLL_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Start background inbox polling
    poll_task = asyncio.create_task(inbox_polling_loop())
    yield
    # Shutdown
    poll_task.cancel()
    try:
        await poll_task
    except asyncio.CancelledError:
        pass
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


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "employeai-api", "version": "0.2.0"}
