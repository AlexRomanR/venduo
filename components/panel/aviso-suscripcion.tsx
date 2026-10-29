import { Download, Lock } from "lucide-react"

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

  const { status } = suscripcion

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
          Puedes descargar tus pedidos y tus productos en planilla. Tus datos se
          conservan 90 días desde el bloqueo.
        </p>
        {/* Descargar es lo único que sigue andando con la tienda bloqueada:
            es la forma de llevarse los datos. */}
        <div className="mt-6 grid gap-2 sm:max-w-md sm:grid-cols-2">
          {[
            ["/panel/exportar/pedidos?periodo=todo", "Descargar pedidos"],
            ["/panel/exportar/productos", "Descargar productos"],
          ].map(([href, texto]) => (
            <a
              key={href}
              href={href}
              download
              className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-white px-5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-senal"
            >
              <Download aria-hidden="true" className="size-4" />
              {texto}
            </a>
          ))}
        </div>
      </div>
    )
  }

  // La prueba se cuenta en la cabecera del Resumen, en una ficha que se pone
  // roja cuando está por vencer: un párrafo acá repetía lo mismo con más
  // palabras.
  return null
}
