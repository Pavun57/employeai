"""Database connection and session management."""

import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


def _get_database_url() -> str:
    """Convert standard postgresql:// URL to asyncpg format."""
    url = settings.database_url
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _get_connect_args() -> dict:
    """Add SSL for remote (Supabase) connections."""
    url = settings.database_url
    if "localhost" not in url and "127.0.0.1" not in url:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        return {"ssl": ssl_ctx}
    return {}


engine = create_async_engine(
    _get_database_url(),
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
    connect_args=_get_connect_args(),
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    """Dependency: yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
