"use client"

import * as React from "react"
import { Check, Copy, MessageCircle } from "lucide-react"
import { toast } from "sonner"

/**
 * Los materiales de promoción del vendedor.
 *
 * Lo que de verdad usa para vender es su enlace y un mensaje listo para pegar
 * en WhatsApp: ahí es donde ocurre la venta. El mensaje se arma con el nombre
 * de la tienda y su propio enlace, así que no depende de que la IA haya
 * generado nada todavía.
 */
export function MaterialesVendedor({
  storeName,
  enlace,
  codigo,
}: {
  storeName: string
  enlace: string
  codigo: string
}) {
  const [copiado, setCopiado] = React.useState<string | null>(null)

  const mensaje = `Hola 👋 Estoy vendiendo para ${storeName}. Mira el catálogo acá: ${enlace}`

  async function copiar(texto: string, etiqueta: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(etiqueta)
      toast.success(`${etiqueta} copiado.`)
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      // Sin permiso de portapapeles el texto igual está a la vista.
      toast.error("No pudimos copiarlo. Selecciónalo y cópialo a mano.")
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => copiar(enlace, "Enlace")}
        className="flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
      >
        {copiado === "Enlace" ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        Copiar mi enlace
      </button>

      <button
        type="button"
        onClick={() => copiar(mensaje, "Mensaje")}
        className="flex min-h-11 items-center gap-2 rounded-plantilla bg-senal px-4 text-sm font-semibold text-white transition-colors hover:bg-senal-alta"
      >
        {copiado === "Mensaje" ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <MessageCircle aria-hidden="true" className="size-4" />
        )}
        Copiar mensaje para WhatsApp
      </button>

      <button
        type="button"
        onClick={() => copiar(codigo, "Código")}
        className="flex min-h-11 items-center gap-2 px-2 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
      >
        Copiar solo el código
      </button>
    </div>
  )
}
