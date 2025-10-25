"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  fetchAnalyticsOverview,
  AnalyticsOverviewResponse,
} from "@/services/mcpBackend";
import DashboardSidebar from "@/components/DashboardSidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
}

const StatsCard = ({
  title,
  value,
  subtitle,
  trend,
  trendPositive,
}: StatsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {trend && (
        <p
          className={`text-xs mt-1 ${
            trendPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

interface DailyExpense {
  date: string;
  amount: number;
}

interface MonthlyExpense {
  month: string;
  amount: number;
}

const ExpenseChart = ({ data }: { data: DailyExpense[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No hay datos disponibles
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount));

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-16 text-xs text-gray-600">{item.date}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
            <div
              className="bg-gradient-to-r from-red-600 to-red-700 h-4 rounded-full transition-all duration-500"
              style={{ width: `${(item.amount / maxAmount) * 100}%` }}
            />
          </div>
          <div className="w-20 text-sm font-medium text-right">
            ${item.amount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

const MonthlyExpenseChart = ({ data }: { data: MonthlyExpense[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No hay datos mensuales disponibles
      </div>
    );
  }

  // Transformar datos para el gráfico
  const chartData = data.map((item) => ({
    month: item.month.split(" ")[0].substring(0, 3), // Abreviar mes
    gastos: item.amount,
  }));

  const chartConfig = {
    gastos: {
      label: "Gastos",
      color: "hsl(142, 71%, 45%)", // Verde
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="gastos" fill="var(--color-gastos)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const [userType, setUserType] = useState<"personal" | "company">("personal");
  const [userId, setUserId] = useState<string>("");
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener información de la sesión
    const storedUserType = sessionStorage.getItem("userType") as
      | "personal"
      | "company";
    const storedUserId = sessionStorage.getItem("userId");

    if (!storedUserType || !storedUserId) {
      window.location.href = "/login";
      return;
    }

    setUserType(storedUserType);
    setUserId(storedUserId);

    loadDashboardData(storedUserType, storedUserId);
  }, [loadDashboardData]);

  const loadDashboardData = useCallback(
    async (type: "personal" | "company", id: string) => {
      setIsLoading(true);
      try {
        const analytics = await fetchAnalyticsOverview(
          type,
          type === "company" ? id : undefined
        );
        setOverview(analytics);
        updateDashboardFromOverview(analytics);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );
  const updateDashboardFromOverview = (analytics: AnalyticsOverviewResponse) => {
    setTotalIncome(analytics.total_income);
    setTotalExpenses(analytics.total_expenses);
    setDailyExpenses(
      analytics.daily_expenses.map((item) => ({
        date: item.date,
        amount: item.amount,
      }))
    );
    setMonthlyExpenses(
      analytics.monthly_expenses.map((item) => ({
        month: item.month,
        amount: item.amount,
      }))
    );
  };

  const netBalance = overview?.net_balance ?? totalIncome - totalExpenses;
  const balancePercentage = overview
    ? overview.balance_percentage.toFixed(1)
    : totalIncome > 0
    ? ((netBalance / totalIncome) * 100).toFixed(1)
    : "0";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-red-700">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        {/* Sidebar */}
        <DashboardSidebar userType={userType} userId={userId} />

        {/* Main Content */}
        <SidebarInset className="flex-1 w-full">
          {/* Header con trigger del sidebar */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-white w-full">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <h1 className="text-xl font-semibold text-gray-900">
              Dashboard {userType === "personal" ? "Personal" : "Empresarial"}
            </h1>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 bg-gray-50 p-6 w-full min-h-0">
            <div className="w-full h-full">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard
                  title="Ingresos Totales"
                  value={`$${totalIncome.toLocaleString()}`}
                  subtitle="Total de ingresos"
                  trend="+12.5% vs mes anterior"
                  trendPositive={true}
                />
                <StatsCard
                  title="Gastos Totales"
                  value={`$${totalExpenses.toLocaleString()}`}
                  subtitle="Total de gastos"
                  trend="-3.2% vs mes anterior"
                  trendPositive={true}
                />
                <StatsCard
                  title="Balance Neto"
                  value={`$${netBalance.toLocaleString()}`}
                  subtitle={`${balancePercentage}% de margen`}
                  trend={
                    netBalance >= 0 ? "Balance positivo" : "Balance negativo"
                  }
                  trendPositive={netBalance >= 0}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Daily Expenses Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Gastos por Día (Últimos 7 días)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExpenseChart data={dailyExpenses} />
                  </CardContent>
                </Card>

                {/* Monthly Expenses Chart */}
                <MonthlyExpenseChart data={monthlyExpenses} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
