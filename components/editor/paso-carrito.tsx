"use client"

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
        bajada="Así ve tu cliente su pedido antes de confirmarlo. Lo armamos con dos de tus productos para que veas cómo queda."
      />

      <Grupo titulo="Lo que ya tiene tu estilo">
        <p className="text-sm leading-relaxed opacity-80">
          Los colores, la letra y la forma de los botones son los que elegiste
          en{" "}
          <button
            type="button"
            onClick={() => irAPaso("marca")}
            className="min-h-11 font-semibold underline underline-offset-4 hover:text-senal"
          >
            Tu marca
          </button>
          . El formulario es el mismo en todas las tiendas de Venduo: pide lo
          justo para que el pedido te llegue por WhatsApp.
        </p>
      </Grupo>

      {productos.length === 0 ? (
        <div className="px-5 pb-5">
          <Aviso>
            Sin productos cargados, el carrito se ve vacío. Así lo va a ver un
            cliente hasta que cargues el primero.
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
