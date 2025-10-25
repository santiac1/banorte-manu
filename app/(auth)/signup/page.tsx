"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

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

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      toast({
        id: generateId(),
        title: "No fue posible registrarse",
        description: error.message,
      })
      return
    }

    toast({
      id: generateId(),
      title: "Verifica tu correo",
      description: "Revisa tu bandeja para confirmar la cuenta.",
    })
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <Toaster />
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Crear cuenta</CardTitle>
          <CardDescription className="text-slate-300">
            Configura tu acceso al MCP Financiero.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="bg-slate-950/40"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Registrarme"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
