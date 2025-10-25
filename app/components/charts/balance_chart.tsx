"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatCurrency } from "@/lib/utils"

interface Transaction {
  date: string
  amount: number
  type: string
}

interface BalanceChartProps {
  transactions: Transaction[]
}

export default function BalanceChart({ transactions }: BalanceChartProps) {
  const data = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return sorted.reduce<{
      date: string
      balance: number
    }[]>((accumulator, transaction) => {
      const previousBalance = accumulator[accumulator.length - 1]?.balance ?? 0
      const nextBalance =
        transaction.type === "ingreso"
          ? previousBalance + Number(transaction.amount)
          : previousBalance - Number(transaction.amount)

      accumulator.push({
        date: new Date(transaction.date).toLocaleDateString("es-MX", {
          month: "short",
          day: "numeric",
        }),
        balance: nextBalance,
      })

      return accumulator
    }, [])
  }, [transactions])

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No hay transacciones suficientes para mostrar.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(Number(value))}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#1e293b",
              color: "#e2e8f0",
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
