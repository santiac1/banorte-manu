from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    query: str


class ChatResponse(BaseModel):
    answer: str


class SimulationRequest(BaseModel):
    name: str
    parameters: Dict[str, Any]


class SimulationResponse(BaseModel):
    simulation_id: str
    summary: str
    projected_data: Any


class DailyExpense(BaseModel):
    date: str
    amount: float


class MonthlyExpense(BaseModel):
    month: str
    amount: float


class OverviewRequest(BaseModel):
    scope: Literal["personal", "company"]
    resource_id: Optional[str] = None


class AnalyticsOverviewResponse(BaseModel):
    scope: Literal["personal", "company"]
    resource_id: str
    total_income: float
    total_expenses: float
    net_balance: float
    balance_percentage: float
    daily_expenses: List[DailyExpense]
    monthly_expenses: List[MonthlyExpense]
