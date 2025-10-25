import Link from "next/link"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transacciones" },
  { href: "/simulator", label: "Simulador" },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", session.user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Banorte Open Innovation
            </p>
            <h1 className="text-2xl font-bold">MCP Financiero</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">
                {profile?.full_name ?? session.user.email}
              </p>
              <p className="text-xs text-slate-400">{session.user.email}</p>
            </div>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-10 w-10 rounded-full border border-slate-700"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-semibold uppercase">
                {session.user.email?.[0]}
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <aside className="w-56 space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-800 hover:bg-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  )
}
