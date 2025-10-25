import DashboardOverview from "@/app/components/dashboard_overview"
import { createSupabaseServerClient } from "@/lib/supabase"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, date, amount, type, description")
    .order("date", { ascending: true })

  const { data: goals } = await supabase
    .from("financial_goals")
    .select("id, name, target_amount, current_amount, target_date, priority")
    .order("priority", { ascending: true })

  return (
    <DashboardOverview
      initialTransactions={transactions ?? []}
      initialGoals={goals ?? []}
    />
  )
}
