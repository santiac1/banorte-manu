import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

type SupabaseCookieOptions = {
  path?: string
  maxAge?: number
  domain?: string
  secure?: boolean
  sameSite?: "lax" | "strict" | "none"
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function ensureSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    )
  }
}

export async function createSupabaseServerClient() {
  ensureSupabaseEnv()
  const cookieStore = await cookies()
  const cookieSnapshot = Object.fromEntries(
    cookieStore.getAll().map(({ name, value }) => [name, value])
  )

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieSnapshot[name]
      },
      set() {
        // noop: cookies() es de solo lectura en Server Components
      },
      remove() {
        // noop
      },
    },
  })
}

export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  ensureSupabaseEnv()
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: SupabaseCookieOptions = {}) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: SupabaseCookieOptions = {}) {
        res.cookies.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })
}
