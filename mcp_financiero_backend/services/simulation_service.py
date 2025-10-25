from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

import pandas as pd
from prophet import Prophet
from supabase import Client

from models.schemas import SimulationResponse


def _prepare_time_series(transactions: list[Dict[str, Any]]) -> pd.DataFrame:
    if not transactions:
        base_date = pd.Timestamp(datetime.utcnow()).normalize()
        data = {
            "date": pd.date_range(base_date - pd.DateOffset(months=11), periods=12, freq="MS"),
            "amount": [0.0] * 12,
        }
    else:
        df = pd.DataFrame(transactions)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")
        df["amount"] = df["amount"].astype(float)
        data = (
            df.groupby(pd.Grouper(key="date", freq="MS"))["amount"].sum().reset_index()
        )
        data.columns = ["date", "amount"]
        if data.shape[0] < 6:
            all_months = pd.date_range(
                start=data["date"].min() - pd.DateOffset(months=5),
                end=data["date"].max(),
                freq="MS",
            )
            data = (
                data.set_index("date")
                .reindex(all_months, fill_value=0.0)
                .rename_axis("date")
                .reset_index()
            )
    series = pd.DataFrame({"ds": data["date"], "y": data["amount"]})
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
    transactions_response = (
        db_client.table("transactions")
        .select("date, amount")
        .eq("user_id", user_id)
        .order("date", desc=False)
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
                "user_id": user_id,
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
