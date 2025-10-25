from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

import pandas as pd
from fastapi import HTTPException
from prophet import Prophet
from supabase import Client

from models.schemas import SimulationResponse


def _prepare_time_series(transactions: list[Dict[str, Any]]) -> pd.DataFrame:
    if not transactions:
        base_date = pd.Timestamp(datetime.utcnow()).normalize()
        data = {
            "fecha": pd.date_range(base_date - pd.DateOffset(months=11), periods=12, freq="MS"),
            "monto": [0.0] * 12,
        }
    else:
        df = pd.DataFrame(transactions)
        df["fecha"] = pd.to_datetime(df["fecha"])
        df = df.sort_values("fecha")
        df["monto"] = df["monto"].astype(float)
        data = (
            df.groupby(pd.Grouper(key="fecha", freq="MS"))["monto"].sum().reset_index()
        )
        data.columns = ["fecha", "monto"]
        if data.shape[0] < 6:
            all_months = pd.date_range(
                start=data["fecha"].min() - pd.DateOffset(months=5),
                end=data["fecha"].max(),
                freq="MS",
            )
            data = (
                data.set_index("fecha")
                .reindex(all_months, fill_value=0.0)
                .rename_axis("fecha")
                .reset_index()
            )
    series = pd.DataFrame({"ds": data["fecha"], "y": data["monto"]})
    return series


def _apply_parameters(forecast: pd.DataFrame, parameters: Dict[str, Any]) -> pd.DataFrame:
    adjustments = forecast.copy()
    income_change = parameters.get("income_change_percent", 0)
    expense_cut = parameters.get("expense_cut_flat", 0)
    adjustments["yhat"] = adjustments["yhat"] * (1 + income_change / 100) - expense_cut
    adjustments["yhat_lower"] = adjustments["yhat_lower"] * (1 + income_change / 100) - expense_cut
    adjustments["yhat_upper"] = adjustments["yhat_upper"] * (1 + income_change / 100) - expense_cut
    return adjustments


async def run_financial_simulation(
    user_id: str, name: str, parameters: Dict[str, Any], db_client: Client
) -> SimulationResponse:
    try:
        personal_user_id = int(user_id)
    except (TypeError, ValueError) as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=400,
            detail="El identificador del usuario no es válido para las transacciones personales.",
        ) from exc

    transactions_response = (
        db_client.table("personal_tx")
        .select("fecha, monto")
        .eq("user_id", personal_user_id)
        .order("fecha", desc=False)
        .execute()
    )

    series = _prepare_time_series(transactions_response.data or [])

    model = Prophet()
    model.fit(series)

    future = model.make_future_dataframe(periods=12, freq="MS")
    forecast = model.predict(future)
    adjusted = _apply_parameters(forecast.tail(12), parameters)

    projected_data = [
        {
            "date": row.ds.strftime("%Y-%m"),
            "projected_amount": float(row.yhat),
            "lower_bound": float(row.yhat_lower),
            "upper_bound": float(row.yhat_upper),
        }
        for row in adjusted.itertuples()
    ]

    simulation = (
        db_client.table("simulations")
        .insert(
            {
                "user_id": personal_user_id,
                "name": name,
                "parameters": parameters,
            }
        )
        .execute()
    )

    simulation_id = simulation.data[0]["id"]

    summary = (
        "Proyección generada usando Prophet considerando los parámetros proporcionados. "
        f"Se estiman {len(projected_data)} periodos futuros."
    )

    db_client.table("simulation_results").insert(
        {
            "simulation_id": simulation_id,
            "projected_data": projected_data,
            "summary_insight": summary,
        }
    ).execute()

    return SimulationResponse(
        simulation_id=simulation_id,
        summary=summary,
        projected_data=projected_data,
    )
