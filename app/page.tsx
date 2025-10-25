import Link from "next/link"

import { Button } from "@/app/components/ui/button"

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 text-center text-white">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Banorte Open Innovation
        </p>
        <h1 className="text-4xl font-bold md:text-5xl">
          MCP Financiero: tu copiloto inteligente para lograr metas
        </h1>
        <p className="text-lg text-slate-300">
          Analiza tus movimientos, optimiza presupuestos y proyecta escenarios
          futuros con un asistente financiero impulsado por IA.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/signup">Comenzar ahora</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="bg-transparent">
          <Link href="/login">Ya tengo cuenta</Link>
        </Button>
      </div>
    </main>
  )
}
