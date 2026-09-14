import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { isSupabaseConfigured } from "@/lib/env"
import { Acceso } from "@/components/auth/acceso"

export const metadata = { title: "Entrar" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; rol?: string }>
}) {
  const { next, error, rol } = await searchParams

  // La portada manda el rol ya elegido; cualquier otro valor se ignora.
  const rolInicial =
    rol === "emprendedor" || rol === "vendedor" ? rol : undefined

  return (
    <div className="flex min-h-screen flex-col bg-papel text-tinta">
      <header className="border-b border-tinta/15">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <Link
            href="/"
            className="flex min-h-11 flex-1 items-center font-titular text-lg font-extrabold tracking-[-0.02em]"
          >
            Venduo
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
          rolInicial={rolInicial}
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
