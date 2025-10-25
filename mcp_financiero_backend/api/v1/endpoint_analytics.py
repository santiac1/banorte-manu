from fastapi import APIRouter, Depends

from core.security import get_current_user_id, supabase_admin
from models.schemas import AnalyticsOverviewResponse, OverviewRequest
from services.analytics_service import get_financial_overview

router = APIRouter()


@router.post("/overview", response_model=AnalyticsOverviewResponse)
async def analytics_overview(
    request: OverviewRequest,
    user_id: str = Depends(get_current_user_id),
) -> AnalyticsOverviewResponse:
    return await get_financial_overview(
        scope=request.scope,
        resource_id=request.resource_id,
        user_id=user_id,
        db_client=supabase_admin,
    )
