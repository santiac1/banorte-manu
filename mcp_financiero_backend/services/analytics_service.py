from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import HTTPException
from supabase import Client

from models.schemas import (
    AnalyticsOverviewResponse,
    DailyExpense,
    MonthlyExpense,
)

SPANISH_MONTHS = {
    1: "enero",
    2: "febrero",
    3: "marzo",
    4: "abril",
    5: "mayo",
    6: "junio",
    7: "julio",
    8: "agosto",
    9: "septiembre",
    10: "octubre",
    11: "noviembre",
    12: "diciembre",
}


def _format_day_label(timestamp: pd.Timestamp) -> str:
    month = SPANISH_MONTHS.get(timestamp.month, timestamp.strftime("%b")).capitalize()
    return f"{month[:3]}. {timestamp.day:02d}"


def _format_month_label(timestamp: pd.Timestamp) -> str:
    month = SPANISH_MONTHS.get(timestamp.month, timestamp.strftime("%B")).capitalize()
    return f"{month} {timestamp.year}"


def _build_dataframe(records: List[Dict[str, Any]], date_field: str) -> pd.DataFrame:
    if not records:
        return pd.DataFrame(columns=[date_field, "monto", "tipo"])

    df = pd.DataFrame(records)
    df[date_field] = pd.to_datetime(df[date_field])
    df["monto"] = df["monto"].astype(float)
    return df.sort_values(date_field)


def _aggregate_daily_expenses(df: pd.DataFrame, date_field: str) -> List[DailyExpense]:
    if df.empty:
        return []

    expenses = df[df["tipo"] == "gasto"].copy()
    if expenses.empty:
        return []

    series = (
        expenses.set_index(date_field)["monto"]
        .resample("D")
        .sum()
        .tail(7)
    )

    return [
        DailyExpense(date=_format_day_label(index), amount=float(value))
        for index, value in series.items()
        if value != 0
    ]


def _aggregate_monthly_expenses(df: pd.DataFrame, date_field: str) -> List[MonthlyExpense]:
    if df.empty:
        return []

    expenses = df[df["tipo"] == "gasto"].copy()
    if expenses.empty:
        return []

    series = (
        expenses.set_index(date_field)["monto"]
        .resample("M")
        .sum()
        .tail(6)
    )

    return [
        MonthlyExpense(month=_format_month_label(index), amount=float(value))
        for index, value in series.items()
        if value != 0
    ]


async def get_financial_overview(
    scope: str,
    resource_id: Optional[str],
    user_id: str,
    db_client: Client,
) -> AnalyticsOverviewResponse:
    if scope not in {"personal", "company"}:
        raise HTTPException(status_code=400, detail="Scope no soportado")

    if scope == "personal":
        try:
            target_user_id = int(resource_id) if resource_id is not None else int(user_id)
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=400, detail="Identificador de usuario inválido") from exc

        if resource_id is not None and target_user_id != int(user_id):
            raise HTTPException(status_code=403, detail="No puedes consultar otro usuario personal")

        query = (
            db_client.table("personal_tx")
            .select("fecha, monto, tipo")
            .eq("user_id", target_user_id)
            .order("fecha", desc=False)
        )
        date_field = "fecha"
        resolved_resource = str(target_user_id)
    else:
        if not resource_id:
            raise HTTPException(status_code=400, detail="Se requiere el ID de la empresa")

        query = (
            db_client.table("company_tx")
            .select("fecha, monto, tipo")
            .eq("empresa_id", resource_id)
            .order("fecha", desc=False)
        )
        date_field = "fecha"
        resolved_resource = resource_id

    response = query.execute()
    records: List[Dict[str, Any]] = response.data or []

    df = _build_dataframe(records, date_field)

    total_income = float(df[df["tipo"] == "ingreso"]["monto"].sum()) if not df.empty else 0.0
    total_expenses = float(df[df["tipo"] == "gasto"]["monto"].sum()) if not df.empty else 0.0
    net_balance = total_income - total_expenses
    balance_percentage = (net_balance / total_income * 100) if total_income else 0.0

    daily = _aggregate_daily_expenses(df, date_field)
    monthly = _aggregate_monthly_expenses(df, date_field)

    return AnalyticsOverviewResponse(
        scope=scope,
        resource_id=resolved_resource,
        total_income=total_income,
        total_expenses=total_expenses,
        net_balance=net_balance,
        balance_percentage=balance_percentage,
        daily_expenses=daily,
        monthly_expenses=monthly,
    )
