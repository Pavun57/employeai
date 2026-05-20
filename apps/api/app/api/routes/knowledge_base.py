"""Knowledge Base routes — CRUD for support agent's knowledge."""

from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy import select, func

from app.api.deps import CurrentUser, DbSession
from app.models.agent import KnowledgeBase

router = APIRouter()


class CreateKBEntryRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = None


class UpdateKBEntryRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/")
async def list_knowledge_base(
    user: CurrentUser,
    db: DbSession,
    category: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    """List knowledge base entries for the user's organization."""
    if not user.org_id:
        return {"entries": [], "total": 0}

    query = select(KnowledgeBase).where(KnowledgeBase.org_id == user.org_id)

    if category:
        query = query.where(KnowledgeBase.category == category)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(KnowledgeBase.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    entries = result.scalars().all()

    return {
        "entries": [
            {
                "id": e.id,
                "title": e.title,
                "content": e.content,
                "category": e.category,
                "is_active": e.is_active,
                "created_at": str(e.created_at),
                "updated_at": str(e.updated_at),
            }
            for e in entries
        ],
        "total": total,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_kb_entry(body: CreateKBEntryRequest, user: CurrentUser, db: DbSession):
    """Create a new knowledge base entry."""
    if not user.org_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    entry = KnowledgeBase(
        id=str(uuid4()),
        org_id=user.org_id,
        title=body.title,
        content=body.content,
        category=body.category,
    )
    db.add(entry)
    await db.flush()

    return {"id": entry.id, "title": entry.title, "created": True}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_kb_file(user: CurrentUser, db: DbSession, file: UploadFile = File(...)):
    """Upload a PDF, TXT, or MD file to the knowledge base."""
    if not user.org_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    # Validate file type
    allowed_types = {
        "application/pdf": "pdf",
        "text/plain": "txt",
        "text/markdown": "md",
    }
    content_type = file.content_type or ""
    filename = file.filename or "untitled"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if content_type not in allowed_types and ext not in ("pdf", "txt", "md"):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, and MD files are supported")

    # Read file content
    raw_bytes = await file.read()
    if len(raw_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB.")

    # Extract text content
    if ext == "pdf" or content_type == "application/pdf":
        try:
            import io
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(raw_bytes))
            text_content = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            raise HTTPException(status_code=400, detail="Could not read PDF file")
    else:
        text_content = raw_bytes.decode("utf-8", errors="ignore")

    if not text_content.strip():
        raise HTTPException(status_code=400, detail="File appears to be empty")

    # Create KB entry from file
    title = filename.rsplit(".", 1)[0] if "." in filename else filename
    entry = KnowledgeBase(
        id=str(uuid4()),
        org_id=user.org_id,
        title=title,
        content=text_content[:50000],  # Cap at 50k chars
        category="uploaded",
    )
    db.add(entry)
    await db.flush()

    return {"id": entry.id, "title": entry.title, "created": True}


@router.get("/categories")
async def list_categories(user: CurrentUser, db: DbSession):
    """List all unique categories in the knowledge base."""
    if not user.org_id:
        return []

    result = await db.execute(
        select(KnowledgeBase.category)
        .where(KnowledgeBase.org_id == user.org_id, KnowledgeBase.category.isnot(None))
        .distinct()
    )
    categories = [row[0] for row in result.all()]
    return categories


@router.get("/{entry_id}")
async def get_kb_entry(entry_id: str, user: CurrentUser, db: DbSession):
    """Get a specific knowledge base entry."""
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == entry_id,
            KnowledgeBase.org_id == user.org_id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    return {
        "id": entry.id,
        "title": entry.title,
        "content": entry.content,
        "category": entry.category,
        "is_active": entry.is_active,
        "created_at": str(entry.created_at),
        "updated_at": str(entry.updated_at),
    }


@router.patch("/{entry_id}")
async def update_kb_entry(entry_id: str, body: UpdateKBEntryRequest, user: CurrentUser, db: DbSession):
    """Update a knowledge base entry."""
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == entry_id,
            KnowledgeBase.org_id == user.org_id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    if body.title is not None:
        entry.title = body.title
    if body.content is not None:
        entry.content = body.content
    if body.category is not None:
        entry.category = body.category
    if body.is_active is not None:
        entry.is_active = body.is_active

    await db.flush()
    return {"id": entry.id, "updated": True}


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_kb_entry(entry_id: str, user: CurrentUser, db: DbSession):
    """Delete a knowledge base entry."""
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == entry_id,
            KnowledgeBase.org_id == user.org_id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    await db.delete(entry)
