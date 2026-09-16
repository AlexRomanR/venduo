import { AlertTriangle, Clock, Download, Lock } from "lucide-react"

import type { Suscripcion } from "@/lib/demo-data"

/**
 * Estado de la suscripción.
 *
 * Solo aparece cuando hay algo que decir. Una suscripción activa no necesita
 * un cartel: ocupar la parte de arriba del panel todos los días con una buena
 * noticia entrena a la gente a no leer lo que hay ahí, y el día que sea un
 * bloqueo tampoco lo van a leer.
 *
 * El bloqueo es el **único bloque rojo a sangre** de la pantalla, que es lo
 * que el sistema reserva para un cambio de tono. Los otros dos estados se
 * anuncian con el peso de la regla, no con color.
 */
export function AvisoSuscripcion({
  suscripcion,
}: {
  suscripcion: Suscripcion | null
}) {
  if (!suscripcion) return null

  const { status, diasRestantes, porVencer } = suscripcion

  if (status === "bloqueada" || status === "cancelada") {
    return (
      <div className="campo-senal bg-senal px-5 py-6 text-white sm:px-8">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
          <Lock aria-hidden="true" className="size-4" />
          Tienda bloqueada
        </p>
        <h2 className="mt-3 max-w-[26ch] font-titular text-[clamp(1.4rem,4vw,2rem)] leading-[1.06] font-extrabold tracking-[-0.03em]">
          Tu tienda dejó de verse y el panel quedó en solo lectura.
        </h2>
        <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-white/75">
          Puedes exportar todo —catálogo, pedidos, vendedores y comisiones— en
          CSV. Tus datos se conservan 90 días desde el bloqueo.
        </p>
        {/* La exportación en CSV es la única acción que queda habilitada con la
            tienda bloqueada, pero todavía no está construida: se enuncia sin
            enlace en vez de llevar a una ruta que no existe. */}
        <p className="mt-6 inline-flex items-center gap-2 border-2 border-white/40 px-5 py-3 text-sm font-semibold text-white/70">
          <Download aria-hidden="true" className="size-4" />
          La exportación en CSV llega con la sección de datos
        </p>
      </div>
    )
  }

  if (status === "prueba" && porVencer) {
    return (
      <div className="border-t-2 border-tinta pt-4">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          <AlertTriangle aria-hidden="true" className="size-4" />
          {diasRestantes !== null && diasRestantes > 0
            ? `Tu prueba vence en ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`
            : "Tu prueba vence hoy"}
        </p>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed opacity-70">
          Cuando venza, tu tienda pública deja de verse y el panel queda en solo
          lectura. Nada se borra.
        </p>
      </div>
    )
  }

  if (status === "prueba" && diasRestantes !== null) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-tinta/15 pt-4 text-sm opacity-55">
        <Clock aria-hidden="true" className="size-4 shrink-0" />
        <span>
          Período de prueba:{" "}
          <span className="tabular font-semibold">
            quedan {diasRestantes} días
          </span>{" "}
          con todo el panel disponible.
        </span>
      </p>
    )
  }

  return null
}
