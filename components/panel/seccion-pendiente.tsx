import { Hammer, type LucideIcon } from "lucide-react"

import { Cabecera, Seccion } from "@/components/panel/piezas"

/**
 * Sección del panel todavía sin construir.
 *
 * Existe para que los accesos directos del panel lleven a algún lado: un
 * enlace que da 404 se lee como un producto roto, y uno que dice qué va a ir
 * ahí se lee como un producto en construcción. Se reemplaza entera cuando la
 * sección se implemente.
 */
export function SeccionPendiente({
  titulo,
  detalle,
  loQueVa,
  icono = Hammer,
}: {
  titulo: string
  detalle: string
  loQueVa: string
  icono?: LucideIcon
}) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera titulo={titulo} bajada={detalle} />

      <Seccion
        id="pronto"
        icono={icono}
        titulo="Lo que va a ir acá"
        bajada="Esta sección todavía se está construyendo."
        accion={{ href: "/panel", texto: "Volver al resumen" }}
        relleno
      >
        <p className="max-w-[60ch] text-sm leading-relaxed">{loQueVa}</p>
      </Seccion>
    </div>
  )
}
