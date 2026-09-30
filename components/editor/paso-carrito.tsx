"use client"

import { ArrowRight } from "lucide-react"

import type { Apariencia } from "@/lib/plantillas/apariencia"
import { useEditor } from "@/components/editor/contexto"
import {
  Aviso,
  EncabezadoDePaso,
  Grupo,
  Interruptor,
  Opciones,
  SiguientePaso,
} from "@/components/editor/piezas"

type Carrito = Apariencia["carrito"]

const DISENOS: Record<Carrito["diseno"], { nombre: string; texto: string }> = {
  columnas: {
    nombre: "Dos columnas",
    texto:
      "El pedido y los datos lado a lado en la computadora, con el total siempre a la vista.",
  },
  boleta: {
    nombre: "Boleta",
    texto:
      "Una nota de pedido angosta, con sus renglones y el total abajo. Se lee de un vistazo.",
  },
  pasos: {
    nombre: "Por pasos",
    texto:
      "Revisar, dar los datos y confirmar, numerados. Nadie se pierde en el camino.",
  },
}

/** El carrito dibujado: cuadritos para los productos, rayas para el texto. */
function EsquemaDeCarrito({ diseno }: { diseno: Carrito["diseno"] }) {
  if (diseno === "columnas") {
    return (
      <span aria-hidden="true" className="flex h-11 w-16 gap-1.5">
        <span className="flex flex-1 flex-col justify-center gap-1.5">
          {[0, 1, 2].map((fila) => (
            <span key={fila} className="flex items-center gap-1">
              <span className="size-2.5 bg-current opacity-80" />
              <span className="h-1 flex-1 bg-current opacity-45" />
            </span>
          ))}
        </span>
        <span className="flex w-6 flex-col justify-between border border-current p-0.5">
          <span className="h-1 bg-current opacity-45" />
          <span className="h-2 bg-current opacity-80" />
        </span>
      </span>
    )
  }

  if (diseno === "boleta") {
    return (
      <span
        aria-hidden="true"
        className="flex h-11 w-10 flex-col gap-1 border border-current p-1"
      >
        <span className="h-1 bg-current opacity-80" />
        <span className="border-t border-dashed border-current opacity-60" />
        <span className="h-1 w-3/4 bg-current opacity-45" />
        <span className="h-1 w-3/4 bg-current opacity-45" />
        <span className="mt-auto h-1.5 bg-current opacity-80" />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-14 flex-col justify-between py-0.5"
    >
      {[1, 2, 3].map((numero) => (
        <span key={numero} className="flex items-center gap-1.5">
          <span className="w-2 text-[10px] leading-none font-bold">
            {numero}
          </span>
          <span className="h-1 flex-1 bg-current opacity-60" />
        </span>
      ))}
    </span>
  )
}

/**
 * Paso 5: el carrito y el pago.
 *
 * El formulario pide lo mismo en todas las tiendas —lo justo para que el pedido
 * llegue por WhatsApp—, pero cómo se ordena y qué ofrece lo elige cada una. En
 * la vista previa se ve con dos productos, para que no aparezca vacío.
 */
export function PasoCarrito() {
  const { irAPaso, productos, apariencia, borrador } = useEditor()
  const { carrito } = apariencia

  function ajustar<C extends keyof Carrito>(clave: C, valor: Carrito[C]) {
    borrador.aplicar([{ op: "apariencia", ruta: `carrito.${clave}`, valor }])
  }

  return (
    <>
      <EncabezadoDePaso
        numero={5}
        titulo="Carrito y pago"
        bajada="Así ve tu cliente su pedido antes de confirmarlo. Elige cómo se ordena y qué más le ofreces."
      />

      <Grupo titulo="Diseño del carrito">
        <Opciones
          etiqueta="Diseño del carrito"
          valor={carrito.diseno}
          opciones={(["columnas", "boleta", "pasos"] as const).map(
            (diseno) => ({
              valor: diseno,
              etiqueta: DISENOS[diseno].nombre,
              dibujo: <EsquemaDeCarrito diseno={diseno} />,
            })
          )}
          alCambiar={(diseno) => ajustar("diseno", diseno)}
        />
        <p className="mt-3 text-xs leading-relaxed opacity-65">
          {DISENOS[carrito.diseno].texto}
        </p>
      </Grupo>

      <Grupo titulo="Qué más ofrece">
        <div className="border-t border-tinta/15">
          <Interruptor
            etiqueta="Sugerencias en el carrito"
            ayuda="Tres productos más de tu tienda para sumar al pedido sin salir del carrito."
            activo={carrito.sugerencias}
            alCambiar={(activo) => ajustar("sugerencias", activo)}
          />
          <Interruptor
            etiqueta="Pedir el correo"
            ayuda="Es opcional para quien compra. Sin él, el formulario es más corto: el pedido igual te llega por WhatsApp."
            activo={carrito.correo}
            alCambiar={(activo) => ajustar("correo", activo)}
          />
        </div>
      </Grupo>

      <Grupo titulo="Lo que ya tiene tu estilo">
        <p className="text-sm leading-relaxed opacity-80">
          Los colores, la letra y la forma de los botones son los que elegiste
          en Tu marca.
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

      <div className="flex flex-col gap-3 px-5 pb-2">
        {productos.length === 0 ? (
          <Aviso>
            Todavía no cargaste productos: el carrito de la vista previa usa dos
            de ejemplo.
          </Aviso>
        ) : null}
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
