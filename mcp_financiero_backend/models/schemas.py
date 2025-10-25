from typing import Any, Dict

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
