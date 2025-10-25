"use client"

import { FormEvent, useMemo, useState } from "react"

import { Button } from "@/app/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Toaster, toast } from "@/app/components/ui/toaster"
import { useSessionStore } from "@/lib/session-store"
import { formatCurrency } from "@/lib/utils"
import { generateId } from "@/lib/id"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

interface SimulationResult {
  date: string
  projected_amount: number
  lower_bound: number
  upper_bound: number
}

interface SimulatorClientProps {
  sessionToken: string
}

export default function SimulatorClient({ sessionToken }: SimulatorClientProps) {
  const [name, setName] = useState("Escenario base")
  const [incomeChangePercent, setIncomeChangePercent] = useState(5)
  const [expenseCut, setExpenseCut] = useState(500)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SimulationResult[]>([])
  const [summary, setSummary] = useState("")
  const storeToken = useSessionStore((state) => state.token)
  const activeToken = useMemo(() => sessionToken || storeToken || "", [sessionToken, storeToken])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    if (!activeToken) {
      toast({
        id: generateId(),
        title: "Sesión requerida",
        description: "Inicia sesión nuevamente para ejecutar simulaciones.",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/simulate/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            name,
            parameters: {
              income_change_percent: incomeChangePercent,
              expense_cut_flat: expenseCut,
            },
          }),
        }
      )

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.detail ?? "Error inesperado")
      }

      const payload = await response.json()
      setResults(payload.projected_data)
      setSummary(payload.summary)
      toast({
        id: generateId(),
        title: "Simulación completada",
        description: payload.summary,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo completar la simulación"
      toast({
        id: generateId(),
        title: "Error",
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle>Configurar simulación</CardTitle>
          <CardDescription>
            Ajusta los parámetros para evaluar escenarios de ingresos y gastos.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="name">
                Nombre del escenario
              </label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-300"
                htmlFor="incomeChange"
              >
                Incremento de ingresos (%)
              </label>
              <Input
                id="incomeChange"
                type="number"
                value={incomeChangePercent}
                onChange={(event) => setIncomeChangePercent(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-300"
                htmlFor="expenseCut"
              >
                Reducción de gastos (monto)
              </label>
              <Input
                id="expenseCut"
                type="number"
                value={expenseCut}
                onChange={(event) => setExpenseCut(Number(event.target.value))}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Ejecutando..." : "Simular"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {summary ? (
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>{summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              {results.map((item) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/50 px-4 py-2"
                >
                  <span className="font-medium text-slate-200">{item.date}</span>
                  <span className="text-slate-300">
                    {formatCurrency(item.projected_amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
