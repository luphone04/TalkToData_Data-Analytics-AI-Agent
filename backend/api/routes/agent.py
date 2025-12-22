from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.agent_service import AgentService
from services.usage_service import usage_service

router = APIRouter(prefix="/api", tags=["agent"])


class FileInfo(BaseModel):
    """File information from Supabase Storage."""
    filename: str
    download_url: str | None = None


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    conversation_id: str | None = None
    user_id: str = "anonymous"  # TODO: Replace with actual auth
    history: list[dict] | None = None
    file: FileInfo | None = None


class ChatResponse(BaseModel):
    """Response body for chat endpoint."""
    response: str
    charts: list[str] = []
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
    try:
        # Check usage limits (skip for anonymous users)
        if request.user_id != "anonymous":
            can_send, remaining = await usage_service.check_message_limit(request.user_id)
            if not can_send:
                return ChatResponse(
                    response="You've reached your daily message limit (50 messages). Please try again tomorrow or upgrade your plan.",
                    error=True,
                    usage=await usage_service.get_daily_usage(request.user_id)
                )

        service = AgentService(user_id=request.user_id)

        # Prepare file info if provided
        file_info = None
        if request.file:
            file_info = {
                "filename": request.file.filename,
                "download_url": request.file.download_url,
            }

        result = await service.chat(
            message=request.message,
            conversation_history=request.history,
            file_info=file_info,
        )

        # Track usage (skip for anonymous users)
        if request.user_id != "anonymous":
            await usage_service.track_usage(
                user_id=request.user_id,
                action="chat_message",
                tokens_used=0,  # TODO: Extract from OpenAI response
                metadata={
                    "conversation_id": request.conversation_id,
                    "has_file": request.file is not None,
                }
            )
            # Add usage info to response
            result["usage"] = await usage_service.get_daily_usage(request.user_id)

        return ChatResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage/{user_id}", response_model=UsageResponse)
async def get_usage(user_id: str):
    """Get usage statistics for a user."""
    try:
        usage = await usage_service.get_daily_usage(user_id)
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
    user_id: str
    action: str  # 'file_upload', 'chart_generated', etc.
    tokens_used: int = 0
    metadata: dict | None = None


@router.post("/track-usage")
async def track_usage(request: TrackUsageRequest):
    """Track a usage event (for file uploads, etc.)."""
    try:
        success = await usage_service.track_usage(
            user_id=request.user_id,
            action=request.action,
            tokens_used=request.tokens_used,
            metadata=request.metadata,
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
