import Link from "next/link"

import { getUser } from "@/lib/supabase/server"
import { getAIStatus } from "@/lib/ai"
import { isSupabaseConfigured } from "@/lib/env"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * Shell del área privada.
 *
 * Deliberadamente mínimo: header, estado de las capas y salida.
 * La navegación se agrega a medida que aparezcan las secciones.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  const ai = getAIStatus()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <span className="flex-1 font-semibold tracking-tight">Venduo</span>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              IA: {ai.demo ? "demo" : ai.provider}
            </Badge>
            {user ? (
              <form action="/auth/sign-out" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Salir
                </Button>
              </form>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/login">Entrar</Link>
              </Button>
            )}
          </div>
        </div>

        {!isSupabaseConfigured ? (
          <div className="bg-amber-500/10 px-6 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
            Modo demo: Supabase sin configurar.
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
