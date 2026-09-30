"use client"

import { ArrowRight } from "lucide-react"

import { useEditor } from "@/components/editor/contexto"
import {
  Aviso,
  EncabezadoDePaso,
  Grupo,
  SiguientePaso,
} from "@/components/editor/piezas"

/**
 * Paso 5: el carrito y el pago. Es la misma pantalla en todas las tiendas —lo
 * que pide no cambia con el rubro—, y en la vista previa se ve con dos
 * productos de muestra para que no aparezca vacía.
 */
export function PasoCarrito() {
  const { irAPaso, productos } = useEditor()

  return (
    <>
      <EncabezadoDePaso
        numero={5}
        titulo="Carrito y pago"
        bajada="Así ve tu cliente su pedido antes de confirmarlo. Lo armamos con dos productos para que veas cómo queda."
      />

      <Grupo titulo="Lo que ya tiene tu estilo">
        <p className="text-sm leading-relaxed opacity-80">
          Los colores, la letra y la forma de los botones son los que elegiste
          en Tu marca. El formulario es el mismo en todas las tiendas de Venduo:
          pide lo justo para que el pedido te llegue por WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => irAPaso("marca")}
          className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          Cambiar colores y letra
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </Grupo>

      {productos.length === 0 ? (
        <div className="px-5 pb-5">
          <Aviso>
            Todavía no cargaste productos: el carrito de la vista previa usa dos
            de ejemplo.
          </Aviso>
        </div>
      ) : null}

      <div className="px-5 pb-2">
        <Aviso>
          Es una vista previa: acá no se crean pedidos aunque toques «Confirmar
          pedido».
        </Aviso>
      </div>

      <SiguientePaso
        nombre="Revisar y publicar"
        alIr={() => irAPaso("publicar")}
      />
    </>
  )
}
