import { notFound } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

export default async function TransactionsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, date, amount, type, description")
    .order("date", { ascending: false })

  if (error) {
    notFound()
  }

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader>
        <CardTitle>Transacciones recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Descripción</th>
                <th className="px-3 py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(transactions ?? []).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-900/50">
                  <td className="px-3 py-2 text-slate-300">
                    {new Date(transaction.date).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {transaction.description ?? "Sin descripción"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      transaction.type === "ingreso"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {transaction.type === "gasto" ? "-" : "+"}
                    {formatCurrency(Number(transaction.amount))}
                  </td>
                </tr>
              ))}
              {(transactions ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    No hay movimientos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
