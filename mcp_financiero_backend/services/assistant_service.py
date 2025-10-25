from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import HTTPException
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from supabase import Client

from core.config import GEMINI_API_KEY
from models.schemas import ChatResponse

_chat_model: Optional[ChatGoogleGenerativeAI] = None


def _get_chat_model() -> ChatGoogleGenerativeAI:
    global _chat_model
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY no está configurada en el backend.")
    if _chat_model is None:
        _chat_model = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            api_key=GEMINI_API_KEY,
            temperature=0.2,
            max_output_tokens=512,
        )
    return _chat_model


async def get_ai_recommendation(user_id: str, query: str, db_client: Client) -> ChatResponse:
    try:
        personal_user_id = int(user_id)
    except (TypeError, ValueError) as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=400,
            detail="El identificador del usuario no es válido para las transacciones personales.",
        ) from exc

    transactions = (
        db_client.table("personal_tx")
        .select("fecha, monto, tipo, categoria, descripcion")
        .eq("user_id", personal_user_id)
        .order("fecha", desc=True)
        .limit(100)
        .execute()
    )
    goals = (
        db_client.table("financial_goals")
        .select("*")
        .eq("user_id", personal_user_id)
        .execute()
    )

    tx_records = transactions.data or []
    goals_records = goals.data or []

    context = (
        "Transacciones recientes (fecha, tipo, monto, categoría, nota): "
        f"{[{
            'fecha': tx.get('fecha'),
            'tipo': tx.get('tipo'),
            'monto': tx.get('monto'),
            'categoria': tx.get('categoria'),
            'descripcion': tx.get('descripcion'),
        } for tx in tx_records]}\n"
        f"Metas financieras activas: {goals_records}"
    )

    messages = [
        SystemMessage(
            content=(
                "Eres un asesor financiero que responde en español, "
                "dando recomendaciones accionables basadas en los datos del usuario."
            )
        ),
        HumanMessage(
            content=(
                f"Contexto del usuario:\n{context}\n\n"
                f"Pregunta del usuario: {query}"
            )
        ),
    ]

    try:
        model = _get_chat_model()
        response = await asyncio.to_thread(model.invoke, messages)
        ai_answer = response.content if hasattr(response, "content") else str(response)
    except Exception as exc:
        ai_answer = (
            "No pude generar una recomendación con Gemini en este momento. "
            f"Detalle técnico: {exc}"
        )

    return ChatResponse(answer=ai_answer)
