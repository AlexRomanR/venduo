import Link from "next/link"
import { ArrowLeft } from "lucide-react"

/**
 * El marco de las altas: `/crear`, y `/sumarme` con las vitrinas para quien
 * todavía no tiene panel.
 *
 * Sin la barra del panel a propósito: son la continuación directa del
 * ingreso, nadie ha empezado a trabajar todavía, y es donde una persona
 * decide si sigue o se va. Cuándo va este marco y cuándo la barra está en
 * `.agents/rules/ui-styling.md`, "Cuándo aparece la barra".
 */
export function Marco({
  children,
  conPanel = false,
}: {
  children: React.ReactNode
  /**
   * Quien ya tiene panel y entró a un alta desde él —un vendedor que abre su
   * tienda— necesita una salida que no sea cerrar sesión.
   */
  conPanel?: boolean
}) {
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
          {conPanel ? (
            <Link
              href="/auth/destino"
              className="flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Volver a mi panel
            </Link>
          ) : null}
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="flex min-h-11 items-center text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-tinta/15">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm opacity-60">
          Venduo · Santa Cruz · La Paz · Cochabamba
        </div>
      </footer>
    </div>
  )
}
