from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1 import endpoint_analytics, endpoint_chat, endpoint_simulate

app = FastAPI(title="Banorte MCP Financiero API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(endpoint_chat.router, prefix="/api/v1/chat", tags=["Asistente IA"])
app.include_router(
    endpoint_simulate.router, prefix="/api/v1/simulate", tags=["Simulador What-If"]
)
app.include_router(
    endpoint_analytics.router, prefix="/api/v1/analytics", tags=["Analítica Financiera"]
)


@app.get("/")
def read_root():
    return {"status": "MCP Financiero está activo"}
