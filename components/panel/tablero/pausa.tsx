import { CircleAlert } from "lucide-react"

import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { CORREO_DE_CONTACTO } from "@/lib/legal"
import { cn } from "@/lib/utils"

/**
 * La franja de la tienda que Venduo pausó, arriba del Resumen. Sin ella, lo
 * único que decía la pausa era una etiqueta "Pausada" junto al nombre, y nadie
 * sabía qué significaba ni a quién preguntar.
 *
 * El motivo no se muestra: lo anota la administración solo para sí. Lo que sí
 * se dice es qué pasa y a quién escribir.
 */
export function FranjaDePausa({ tienda }: { tienda: string }) {
  const asunto = encodeURIComponent(`Mi tienda está pausada: ${tienda}`)

  return (
    <section
      aria-label="Tienda pausada"
      className="pieza-tarjeta mb-6 flex flex-col gap-4 border-2 border-senal px-4 py-4 sm:px-5 lg:mb-0 lg:flex-row lg:items-center"
    >
      <CircleAlert
        aria-hidden="true"
        className="size-5 shrink-0 text-senal max-lg:hidden"
      />
      <div className="min-w-0 flex-1">
        <p className="font-titular text-lg leading-tight font-bold tracking-[-0.02em] text-senal">
          Venduo pausó tu tienda
        </p>
        <p className="mt-0.5 text-sm text-tinta/65">
          Quien abre tu enlace no la ve y no te llegan pedidos. Tus productos y
          tus pedidos siguen aquí, sin cambios.
        </p>
      </div>
      <a
        href={`mailto:${CORREO_DE_CONTACTO}?subject=${asunto}`}
        className={cn(BOTON_SECUNDARIO, "min-h-11 shrink-0 px-5 text-sm")}
      >
        Escríbenos
      </a>
    </section>
  )
}
