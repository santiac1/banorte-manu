import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const redirectUrl = new URL("/login", origin)
    redirectUrl.searchParams.set("error", error.message)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
