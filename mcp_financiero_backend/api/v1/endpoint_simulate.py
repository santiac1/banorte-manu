from fastapi import APIRouter, Depends

from core.security import get_current_user_id, supabase_admin
from models.schemas import SimulationRequest, SimulationResponse
from services.simulation_service import run_financial_simulation

router = APIRouter()


@router.post("/run", response_model=SimulationResponse)
async def run_simulation(
    request: SimulationRequest,
    user_id: str = Depends(get_current_user_id),
):
    response = await run_financial_simulation(
        user_id=user_id,
        name=request.name,
        parameters=request.parameters,
        db_client=supabase_admin,
    )
    return response
