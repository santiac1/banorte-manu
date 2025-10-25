import supabase from "./supabase";

const MCP_API_URL = process.env.NEXT_PUBLIC_MCP_API_URL;

if (!MCP_API_URL) {
  console.warn(
    "NEXT_PUBLIC_MCP_API_URL no está definida. Configura la variable en tu .env.local para utilizar el backend MCP Financiero."
  );
}

export type OverviewScope = "personal" | "company";

export interface DailyExpense {
  date: string;
  amount: number;
}

export interface MonthlyExpense {
  month: string;
  amount: number;
}

export interface AnalyticsOverviewResponse {
  scope: OverviewScope;
  resource_id: string;
  total_income: number;
  total_expenses: number;
  net_balance: number;
  balance_percentage: number;
  daily_expenses: DailyExpense[];
  monthly_expenses: MonthlyExpense[];
}

async function getSessionToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`No se pudo obtener la sesión de Supabase: ${error.message}`);
  }

  if (!session?.access_token) {
    throw new Error(
      "No hay una sesión activa de Supabase. Inicia sesión para continuar con el análisis."
    );
  }

  return session.access_token;
}

export async function fetchAnalyticsOverview(
  scope: OverviewScope,
  resourceId?: string
): Promise<AnalyticsOverviewResponse> {
  if (!MCP_API_URL) {
    throw new Error(
      "La URL del backend MCP no está configurada. Revisa NEXT_PUBLIC_MCP_API_URL."
    );
  }

  const token = await getSessionToken();

  const response = await fetch(`${MCP_API_URL}/api/v1/analytics/overview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ scope, resource_id: resourceId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Error al obtener la analítica financiera (${response.status}): ${errorText}`
    );
  }

  return (await response.json()) as AnalyticsOverviewResponse;
}
