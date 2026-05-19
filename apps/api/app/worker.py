"""Celery worker for background task processing."""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "employeai",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(name="agents.execute_task")
def execute_agent_task(task_id: str, agent_id: str, org_id: str):
    """Execute an AI agent task in the background."""
    # This will be implemented with LangGraph orchestration
    # For now, placeholder
    import time
    time.sleep(2)
    return {"task_id": task_id, "status": "completed"}


@celery_app.task(name="agents.scheduled_check")
def scheduled_agent_check():
    """Periodic check for scheduled agent tasks."""
    pass
