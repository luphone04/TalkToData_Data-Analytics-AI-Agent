from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.agent_service import AgentService

router = APIRouter(prefix="/api", tags=["agent"])


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    conversation_id: str | None = None
    user_id: str = "anonymous"  # TODO: Replace with actual auth
    history: list[dict] | None = None


class ChatResponse(BaseModel):
    """Response body for chat endpoint."""
    response: str
    charts: list[str] = []
    datasets_loaded: list[str] = []
    error: bool = False


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
        service = AgentService(user_id=request.user_id)
        result = await service.chat(
            message=request.message,
            conversation_history=request.history,
        )
        return ChatResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
