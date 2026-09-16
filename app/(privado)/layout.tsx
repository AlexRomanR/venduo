import Link from "next/link"
import { UserRound } from "lucide-react"

import { getMiTienda, getPerfil, getVinculosDeVendedor } from "@/lib/data/panel"
import { getAIStatus } from "@/lib/ai"
import { isSupabaseConfigured } from "@/lib/env"
import { NavPanel, type ItemNav } from "@/components/panel/nav-panel"

/**
 * Shell de las áreas privadas: `/panel`, `/vendedor` y `/cuenta`.
 *
 * Está en el mundo editorial como el resto de la aplicación, pero denso: barra
 * fija con la navegación siempre a la vista, contenedor único y nada de aire
 * de portada. Editorial no quiere decir landing — un diario también es denso.
 *
 * La navegación se arma desde los datos y no desde `primary_role`: alguien que
 * tiene tienda y además vende para otras ve las dos cosas.
 */
export default async function PrivadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [tienda, vinculos, perfil] = await Promise.all([
    getMiTienda(),
    getVinculosDeVendedor(),
    getPerfil(),
  ])

  const ai = getAIStatus()

  const items: ItemNav[] = []

  if (tienda?.template_key || !isSupabaseConfigured) {
    items.push(
      { href: "/panel", nombre: "Resumen" },
      { href: "/panel/productos", nombre: "Productos" },
      { href: "/panel/pedidos", nombre: "Pedidos" },
      { href: "/panel/vendedores", nombre: "Vendedores" },
      { href: "/panel/estadisticas", nombre: "Estadísticas" },
      { href: "/panel/marketing", nombre: "Marketing" }
    )
  }

  if (vinculos.length > 0) {
    items.push({ href: "/vendedor", nombre: "Lo que vendo" })
  }

  const nombre = perfil?.full_name?.split(" ")[0] ?? "Mi cuenta"

  return (
    <div className="flex min-h-screen flex-col bg-papel text-tinta">
      <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-center gap-4 py-3">
            <Link
              href="/auth/destino"
              className="flex min-h-11 flex-1 items-center font-titular text-lg font-extrabold tracking-[-0.02em]"
            >
              Venduo
            </Link>

            {ai.demo ? (
              <span className="hidden rounded-full border border-tinta/25 px-2 py-0.5 text-xs font-semibold tracking-[0.12em] uppercase opacity-55 sm:inline">
                IA demo
              </span>
            ) : null}

            <Link
              href="/cuenta"
              className="flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
            >
              <UserRound aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">{nombre}</span>
            </Link>

            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="flex min-h-11 items-center text-sm opacity-55 transition-opacity hover:opacity-100"
              >
                Salir
              </button>
            </form>
          </div>

          <NavPanel items={items} />
        </div>

        {!isSupabaseConfigured ? (
          <p className="border-t border-senal/30 bg-senal/5 px-5 py-2 text-center text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Modo demo · Supabase sin configurar
          </p>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        {children}
      </main>
    </div>
  )
}
