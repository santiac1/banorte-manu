from fastapi import APIRouter, Depends

from core.security import get_current_user_id, supabase_admin
from models.schemas import ChatRequest, ChatResponse
from services.assistant_service import get_ai_recommendation

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
async def ask_assistant(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    response = await get_ai_recommendation(user_id, request.query, supabase_admin)
    return response
