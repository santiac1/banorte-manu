"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"

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
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useSessionStore } from "@/lib/session-store"
import { generateId } from "@/lib/id"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { token, setToken } = useSessionStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token ?? null
      setToken(accessToken)
    })
  }, [supabase, setToken])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input.trim()) return

    if (!token) {
      toast({
        id: generateId(),
        title: "Sesión expirada",
        description: "Vuelve a iniciar sesión para continuar.",
      })
      return
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: userMessage.content }),
        }
      )

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.detail ?? "Error al consultar el asistente")
      }

      const payload = await response.json()
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: payload.answer,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo obtener respuesta"
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
    <Card className="border-slate-800 bg-slate-900/60">
      <Toaster />
      <CardHeader>
        <CardTitle>Asistente financiero</CardTitle>
        <CardDescription>
          Consulta recomendaciones inteligentes basadas en tus movimientos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-64 flex-col gap-3 overflow-y-auto rounded-lg border border-slate-800/80 bg-slate-950/40 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">
              ¡Hola! Soy tu asistente MCP Financiero. Pregunta sobre tu presupuesto,
              metas o estrategias de ahorro.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.role === "assistant"
                    ? "self-start bg-slate-800 text-slate-100"
                    : "self-end bg-sky-500 text-white"
                }`}
              >
                {message.content}
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter>
        <form className="flex w-full items-center gap-3" onSubmit={handleSubmit}>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="¿En qué puedo ayudarte hoy?"
            className="bg-slate-950/40"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Consultando..." : "Enviar"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
