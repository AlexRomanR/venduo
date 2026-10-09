import Link from "next/link"
import { ExternalLink, LogOut } from "lucide-react"

import { Logo } from "@/components/marca/logo"
import {
  NavegacionLateral,
  NavegacionMovil,
} from "@/components/admin/navegacion"

/**
 * El armazón de `/admin`: la herramienta de Venduo para operar la plataforma.
 *
 * Mismo mundo que el panel del emprendedor —papel, tinta, reglas de un píxel—
 * pero sin tienda que mostrar: arriba dice que esto es la administración, para
 * que nunca se confunda con el panel de una tienda.
 */
export function ArmazonDeAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-papel text-tinta lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-tinta/15 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="border-b border-tinta/15 px-5 pt-5 pb-4">
          <Link href="/admin" className="flex min-h-11 items-center text-xl">
            <Logo />
          </Link>
          <p className="mt-1 text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            Administración
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <NavegacionLateral />
        </div>
        <Pie />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-papel lg:hidden">
          <div className="flex items-center justify-between gap-3 border-b border-tinta/15 px-5">
            <Link href="/admin" className="flex min-h-14 items-center gap-2">
              <Logo />
              <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                Admin
              </span>
            </Link>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                aria-label="Salir"
                className="flex size-11 items-center justify-center transition-colors hover:text-senal"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
          <NavegacionMovil />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}

function Pie() {
  return (
    <div className="flex flex-col gap-2 border-t border-tinta/15 p-4">
      <Link
        href="/"
        target="_blank"
        className="flex min-h-11 items-center gap-2 text-sm font-semibold opacity-75 transition-opacity hover:opacity-100"
      >
        <ExternalLink aria-hidden="true" className="size-4" />
        Ver Venduo
      </Link>
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          className="flex min-h-11 w-full items-center justify-center gap-1.5 border border-tinta/25 text-xs font-semibold transition-colors hover:border-senal hover:text-senal"
        >
          <LogOut aria-hidden="true" className="size-3.5" />
          Salir
        </button>
      </form>
    </div>
  )
}
