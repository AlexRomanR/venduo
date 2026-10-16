"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useConfirmacion } from "@/components/panel/confirmar"

/**
 * Sacar un producto del catálogo, discreto y al final de su pantalla, como en
 * la app: es lo que menos se hace y pregunta antes. Los pedidos que ya lo
 * tienen lo conservan.
 */
export function BorrarProducto({
  producto,
  borrar,
  soloLectura = false,
}: {
  producto: { id: string; name: string }
  borrar: (id: string) => Promise<{ ok: boolean; error?: string }>
  soloLectura?: boolean
}) {
  const router = useRouter()
  const { preguntar, dialogo } = useConfirmacion()
  const [borrando, setBorrando] = React.useState(false)

  async function eliminar() {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }
    const si = await preguntar({
      titulo: `¿Borrar ${producto.name}?`,
      texto:
        "Deja de verse en tu tienda. Los pedidos que ya tenga se conservan.",
      confirmar: "Borrar del catálogo",
    })
    if (!si) return

    setBorrando(true)
    const resultado = await borrar(producto.id)
    setBorrando(false)
    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos borrar el producto.")
      return
    }
    toast.success("Producto borrado.")
    router.push("/panel/productos")
  }

  return (
    <>
      {dialogo}
      <button
        type="button"
        onClick={eliminar}
        disabled={borrando}
        className="flex min-h-12 w-fit items-center gap-2 font-semibold transition-colors hover:text-senal disabled:opacity-50 max-lg:mx-auto"
      >
        {borrando ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Trash2 aria-hidden="true" className="size-4" />
        )}
        Borrar del catálogo
      </button>
    </>
  )
}
