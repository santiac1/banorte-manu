"use client"

import { useEffect, useMemo, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import BalanceChart from "@/app/components/charts/balance_chart"
import ChatAssistant from "@/app/components/chat_assistant"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { toast } from "@/app/components/ui/toaster"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { formatCurrency } from "@/lib/utils"
import { generateId } from "@/lib/id"

interface Transaction {
  id: string
  date: string
  amount: number
  type: string
  description?: string | null
}

interface Goal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  priority: number | null
}

interface DashboardOverviewProps {
  initialTransactions: Transaction[]
  initialGoals: Goal[]
}

export default function DashboardOverview({
  initialTransactions,
  initialGoals,
}: DashboardOverviewProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const queryClient = useQueryClient()
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      userIdRef.current = data.session?.user.id ?? null
    })
  }, [supabase])

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, date, amount, type, description")
        .order("date", { ascending: true })
      if (error) throw error
      return data ?? []
    },
    initialData: initialTransactions,
  })

  const goalsQuery = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("id, name, target_amount, current_amount, target_date, priority")
        .order("priority", { ascending: true })
      if (error) throw error
      return data ?? []
    },
    initialData: initialGoals,
  })

  const ensureExpenseCategory = useMemo(
    () => async () => {
      const userId = userIdRef.current
      if (!userId) throw new Error("No se pudo determinar el usuario autenticado")

      const { data: existing, error: fetchError } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "gasto")
        .limit(1)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (existing) return existing.id as string

      const { data: created, error: insertError } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          type: "gasto",
          name: "Gasto General",
        })
        .select("id")
        .single()

      if (insertError) throw insertError
      return created.id as string
    },
    [supabase],
  )

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      const userId = userIdRef.current
      if (!userId) {
        throw new Error("No se pudo determinar el usuario autenticado")
      }
      const categoryId = await ensureExpenseCategory()
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        category_id: categoryId,
        type: "gasto",
        amount: 500,
        date: new Date().toISOString(),
        description: "Gasto registrado desde el dashboard",
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["transactions"] })
      toast({
        id: generateId(),
        title: "Gasto agregado",
        description: "El movimiento se registró correctamente.",
      })
    },
    onError: (error: Error) => {
      toast({
        id: generateId(),
        title: "Error al agregar gasto",
        description: error.message,
      })
    },
  })

  const totalBalance = useMemo(() => {
    return (transactionsQuery.data ?? []).reduce((acc, transaction) => {
      return transaction.type === "ingreso"
        ? acc + Number(transaction.amount)
        : acc - Number(transaction.amount)
    }, 0)
  }, [transactionsQuery.data])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">
            Balance acumulado
          </p>
          <p className="text-3xl font-semibold">
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <Button
          onClick={() => addExpenseMutation.mutate()}
          disabled={addExpenseMutation.isPending}
        >
          {addExpenseMutation.isPending ? "Guardando..." : "Agregar Gasto"}
        </Button>
      </div>
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle>Evolución del balance</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceChart transactions={transactionsQuery.data ?? []} />
        </CardContent>
      </Card>
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle>Metas financieras</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {(goalsQuery.data ?? []).map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100
              return (
                <li
                  key={goal.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-100">{goal.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(goal.current_amount)} / {" "}
                      {formatCurrency(goal.target_amount)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">
                    {progress.toFixed(1)}%
                  </span>
                </li>
              )
            })}
            {(goalsQuery.data ?? []).length === 0 && (
              <li className="rounded-lg border border-dashed border-slate-800/80 px-4 py-6 text-center text-slate-400">
                Aún no registras metas. ¡Crea una para comenzar!
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
      <ChatAssistant />
    </div>
  )
}
