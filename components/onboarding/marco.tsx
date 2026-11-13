import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/marca/logo"
import { archivoAncho, kalam } from "@/components/portada/letras"

/**
 * El marco del ingreso y del alta de la tienda: `/login` y `/crear` con sus
 * pasos.
 *
 * Va en el cuaderno, como el panel al que se llega (decisión del 9 de
 * noviembre): la marca `data-registro="cuaderno"` viste las piezas de adentro
 * —tarjetas de hoja, botones en píldora— y trae las letras de la portada para
 * la escena del final. Sin la barra del panel a propósito: nadie empezó a
 * trabajar todavía, y es donde una persona decide si sigue o se va. Cuándo va
 * este marco y cuándo la barra está en `.agents/rules/ui-styling.md`, "Cuándo
 * aparece la barra".
 */
export function Marco({
  children,
  conPanel = false,
  publico = false,
}: {
  children: React.ReactNode
  /**
   * Quien ya tiene panel y volvió al alta desde él necesita una salida que
   * no sea cerrar sesión.
   */
  conPanel?: boolean
  /** El ingreso: sin sesión, la salida es volver a la portada. */
  publico?: boolean
}) {
  const accion =
    "flex min-h-11 items-center gap-2 text-sm text-tinta/70 transition-colors hover:text-tinta"

  return (
    <div
      data-registro="cuaderno"
      className={cn(
        archivoAncho.variable,
        kalam.variable,
        "flex min-h-screen flex-col bg-papel text-tinta"
      )}
    >
      <header>
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-5">
          <Link href="/" className="flex min-h-11 flex-1 items-center text-lg">
            <Logo />
          </Link>
          {publico ? (
            <Link href="/" className={accion}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Volver
            </Link>
          ) : (
            <>
              {conPanel ? (
                <Link
                  href="/auth/destino"
                  className={cn(accion, "font-semibold text-tinta")}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Volver a mi panel
                </Link>
              ) : null}
              <form action="/auth/sign-out" method="post">
                <button type="submit" className={accion}>
                  Salir
                </button>
              </form>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer>
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-tinta/65 sm:px-5">
          Venduo · Santa Cruz · La Paz · Cochabamba
        </div>
      </footer>
    </div>
  )
}
