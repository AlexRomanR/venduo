import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { isSupabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { Acceso, type EstadoDelRegistro } from "@/components/auth/acceso"
import { Logo } from "@/components/marca/logo"

export const metadata = { title: "Entrar" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; modo?: string }>
}) {
  const [{ next, error, modo }, supabase] = await Promise.all([
    searchParams,
    createClient(),
  ])
  // Sin respuesta de la base se muestra abierto: si de verdad está cerrado, el
  // disparador lo rechaza igual al registrarse.
  const lectura = supabase ? await supabase.rpc("estado_del_registro") : null
  const estadoDelRegistro: EstadoDelRegistro =
    lectura?.data === "cerrado" || lectura?.data === "invitacion"
      ? lectura.data
      : "abierto"

  return (
    <div className="flex min-h-screen flex-col bg-papel text-tinta">
      <header className="border-b border-tinta/15">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <Link href="/" className="flex min-h-11 flex-1 items-center text-lg">
            <Logo />
          </Link>
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 text-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver
          </Link>
        </div>
      </header>

      {/* items-center centra el ingreso, que es corto; el registro es más alto
          que la pantalla y simplemente la empuja. */}
      <main className="flex flex-1 items-center">
        <Acceso
          next={next}
          configured={isSupabaseConfigured}
          initialError={error}
          registro={modo === "registro"}
          estadoDelRegistro={estadoDelRegistro}
        />
      </main>

      <footer className="border-t border-tinta/15">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm opacity-60">
          Venduo · Santa Cruz · La Paz · Cochabamba
        </div>
      </footer>
    </div>
  )
}
