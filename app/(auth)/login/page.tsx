"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

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
import { Label } from "@/app/components/ui/label"
import { Toaster, toast } from "@/app/components/ui/toaster"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { generateId } from "@/lib/id"
import { useSessionStore } from "@/lib/session-store"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const setToken = useSessionStore((state) => state.setToken)

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        id: generateId(),
        title: "Error al iniciar sesión",
        description: error.message,
      })
      setLoading(false)
      return
    }

    const session = await supabase.auth.getSession()
    setToken(session.data.session?.access_token ?? null)

    toast({
      id: generateId(),
      title: "Bienvenido",
      description: "Autenticación exitosa",
    })

    const redirectTo = searchParams.get("redirectedFrom") ?? "/dashboard"
    router.push(redirectTo)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <Toaster />
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">MCP Financiero</CardTitle>
          <CardDescription className="text-slate-300">
            Ingresa tus credenciales para continuar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="bg-slate-950/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="bg-slate-950/40"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Ingresar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
