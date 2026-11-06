import secrets
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from core.config import settings
from services.agent_service import AgentService
from services.usage_service import usage_service


def require_backend_key(x_backend_key: str | None = Header(default=None)) -> None:
    """Only the Next.js server, which holds BACKEND_API_KEY, may call these routes."""
    if not settings.backend_api_key:
        raise HTTPException(status_code=503, detail="Backend is not configured: BACKEND_API_KEY is missing.")
    if not x_backend_key or not secrets.compare_digest(x_backend_key, settings.backend_api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing backend key.")


router = APIRouter(prefix="/api", tags=["agent"], dependencies=[Depends(require_backend_key)])


class FileInfo(BaseModel):
    """File information from Supabase Storage."""
    filename: str
    download_url: str | None = None


class HistoryMessage(BaseModel):
    """One earlier message in the conversation (oldest first)."""
    role: Literal["user", "assistant"]
    content: str = Field(max_length=20000)


class ChatRequest(BaseModel):
    """Request body for chat endpoint (sent by the authenticated Next.js server)."""
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: UUID | None = None
    user_id: UUID
    history: list[HistoryMessage] = Field(default_factory=list, max_length=20)
    file: FileInfo | None = None


class ChatResponse(BaseModel):
    """Response body for chat endpoint."""
    response: str
    charts: list[str] = []
    chart_errors: list[str] = []  # Charts generated but not delivered
    datasets_loaded: list[str] = []
    error: bool = False
    usage: dict | None = None  # Daily usage info


class UsageResponse(BaseModel):
    """Response body for usage endpoint."""
    message_count: int
    upload_count: int
    tokens_used: int
    message_limit: int
    upload_limit: int
    remaining_messages: int
    remaining_uploads: int


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the data analysis agent.

    The agent can:
    - Load and analyze CSV/Excel files
    - Perform statistical analysis
    - Create visualizations
    - Answer questions about data
    """
    user_id = str(request.user_id)
    try:
        # Check usage limits
        can_send, remaining = await usage_service.check_message_limit(user_id)
        if not can_send:
            return ChatResponse(
                response="You've reached your daily message limit (50 messages). Please try again tomorrow or upgrade your plan.",
                error=True,
                usage=await usage_service.get_daily_usage(user_id)
            )

        service = AgentService(user_id=user_id)

        # Prepare file info if provided
        file_info = None
        if request.file:
            file_info = {
                "filename": request.file.filename,
                "download_url": request.file.download_url,
            }

        result = await service.chat(
            message=request.message,
            conversation_history=[m.model_dump() for m in request.history],
            file_info=file_info,
        )

        # Track usage
        await usage_service.track_usage(
            user_id=user_id,
            action="chat_message",
            tokens_used=0,  # TODO: Extract from model response
            metadata={
                "conversation_id": str(request.conversation_id) if request.conversation_id else None,
                "has_file": request.file is not None,
            }
        )
        # Add usage info to response
        result["usage"] = await usage_service.get_daily_usage(user_id)

        return ChatResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage/{user_id}", response_model=UsageResponse)
async def get_usage(user_id: UUID):
    """Get usage statistics for a user."""
    try:
        usage = await usage_service.get_daily_usage(str(user_id))
        return UsageResponse(
            message_count=usage["message_count"],
            upload_count=usage["upload_count"],
            tokens_used=usage["tokens_used"],
            message_limit=usage["message_limit"],
            upload_limit=usage["upload_limit"],
            remaining_messages=usage["message_limit"] - usage["message_count"],
            remaining_uploads=usage["upload_limit"] - usage["upload_count"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TrackUsageRequest(BaseModel):
    """Request body for tracking usage."""
    user_id: UUID
    action: Literal["file_upload"]  # chat messages are tracked by /chat itself
    tokens_used: int = Field(default=0, ge=0)
    metadata: dict | None = None


@router.post("/track-usage")
async def track_usage(request: TrackUsageRequest):
    """Track a usage event (for file uploads, etc.)."""
    try:
        success = await usage_service.track_usage(
            user_id=str(request.user_id),
            action=request.action,
            tokens_used=request.tokens_used,
            metadata=request.metadata,
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
