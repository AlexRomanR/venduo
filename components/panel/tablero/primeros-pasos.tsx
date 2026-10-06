import Link from "next/link"
import { ArrowRight, Check, Flag } from "lucide-react"

import type { Tablero } from "@/lib/tablero"
import { cn } from "@/lib/utils"
import { enlaceLegible } from "@/lib/tienda"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import { Seccion } from "@/components/panel/piezas"

const BOTON_DEL_PASO =
  "inline-flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"

interface Paso {
  hecho: boolean
  titulo: string
  texto: string
  accion: React.ReactNode
}

/**
 * Lo que le falta a una tienda nueva para vender, con su avance.
 *
 * Reemplaza a un Resumen lleno de ceros: una tienda recién creada no tiene
 * nada que resumir, pero sí algo que hacer. Se va sola cuando todo está hecho.
 * Cada paso se cumple con los datos —un producto cargado, un pedido recibido—
 * y no con un clic: así no se puede marcar algo que no pasó.
 */
export function PrimerosPasos({
  pasos,
  tienda,
}: {
  pasos: Tablero["pasos"]
  tienda: { nombre: string; slug: string; url: string }
}) {
  const lista: Paso[] = [
    {
      hecho: pasos.producto,
      titulo: "Carga tu primer producto",
      texto: "Con su foto y su precio: es lo primero que ve tu cliente.",
      accion: (
        <Link href="/panel/productos/nuevo" className={BOTON_DEL_PASO}>
          Cargar producto
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ),
    },
    {
      hecho: pasos.estilo,
      titulo: "Dale tu estilo",
      texto: "Tu logo y tus colores, para que tu tienda se reconozca.",
      accion: (
        <Link href="/editor" className={BOTON_DEL_PASO}>
          Abrir el editor
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ),
    },
    {
      hecho: pasos.primerPedido,
      titulo: "Recibe tu primer pedido",
      texto: "Comparte tu enlace por WhatsApp, TikTok o donde ya vendes.",
      accion: (
        <CompartirTienda {...tienda} legible={enlaceLegible(tienda.url)}>
          <button type="button" className={BOTON_DEL_PASO}>
            Compartir tu tienda
          </button>
        </CompartirTienda>
      ),
    },
  ]

  const hechos = lista.filter((paso) => paso.hecho).length
  if (hechos === lista.length) return null

  return (
    <Seccion
      id="primeros-pasos"
      icono={Flag}
      titulo="Primeros pasos"
      bajada="Lo que falta para que tu tienda empiece a vender."
      extra={
        <div className="flex items-center gap-3">
          <span className="tabular text-sm font-semibold">
            {hechos} de {lista.length}
          </span>
          <span
            role="progressbar"
            aria-label="Pasos hechos"
            aria-valuemin={0}
            aria-valuemax={lista.length}
            aria-valuenow={hechos}
            className="block h-1.5 w-24 bg-tinta/10"
          >
            <span
              className="block h-full origin-left bg-tinta transition-transform duration-500 motion-reduce:transition-none"
              style={{ transform: `scaleX(${hechos / lista.length})` }}
            />
          </span>
        </div>
      }
    >
      <ol
        className={cn(
          "grid gap-px bg-tinta/15 sm:grid-cols-2",
          lista.length === 4 && "xl:grid-cols-4",
          lista.length === 3 && "xl:grid-cols-3"
        )}
      >
        {lista.map((paso, indice) => (
          <li
            key={paso.titulo}
            className="flex flex-col gap-3 bg-papel px-4 py-4 sm:px-5"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "tabular flex size-7 shrink-0 items-center justify-center border text-xs font-bold",
                  paso.hecho
                    ? "border-tinta bg-tinta text-papel"
                    : "border-tinta/40"
                )}
              >
                {paso.hecho ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  indice + 1
                )}
              </span>
              {/* Hecho, queda solo su título: lo que importa es lo que falta,
                  y en el celular tres pasos cumplidos empujaban el pendiente
                  fuera de la pantalla. */}
              <div className={cn("min-w-0", paso.hecho && "opacity-65")}>
                <p className="leading-snug font-semibold">
                  {paso.titulo}
                  {paso.hecho ? (
                    <span className="sr-only"> (hecho)</span>
                  ) : null}
                </p>
                {paso.hecho ? null : (
                  <p className="mt-1 text-sm leading-snug opacity-70">
                    {paso.texto}
                  </p>
                )}
              </div>
            </div>
            {paso.hecho ? null : (
              <div className="mt-auto pl-10">{paso.accion}</div>
            )}
          </li>
        ))}
      </ol>
    </Seccion>
  )
}
