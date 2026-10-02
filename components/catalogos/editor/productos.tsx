"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Package, X } from "lucide-react"

import type { PropuestaDeCatalogo } from "@/lib/ai/schemas"
import {
  elegidos,
  type DatosDelCatalogo,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import type { Catalogo } from "@/lib/catalogos/modelo"
import { ponerProductos } from "@/lib/catalogos/operaciones"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Miniatura } from "@/components/panel/piezas"
import { PedidoALaIa } from "@/components/catalogos/editor/ia"
import { SelectorDeProductos } from "@/components/catalogos/editor/selector"

/*
 * Los productos del catálogo: cuáles y en qué orden.
 *
 * El orden es el del catálogo entero: las hojas de "todos los elegidos" los
 * muestran así, y las de una categoría también, filtrando.
 */

export function PanelDeProductos({
  catalogo,
  datos,
  alCambiar,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  alCambiar: (catalogo: Catalogo) => void
}) {
  const [eligiendo, setEligiendo] = React.useState(
    catalogo.productos.length === 0
  )
  const lista = elegidos(catalogo, datos)

  function usar(propuesta: PropuestaDeCatalogo) {
    let nuevo = ponerProductos(catalogo, propuesta.productos)
    const portada = nuevo.bloques.find((bloque) => bloque.tipo === "portada")
    nuevo = {
      ...nuevo,
      nombre: propuesta.nombre,
      bloques: nuevo.bloques.map((bloque) =>
        bloque === portada && propuesta.bajada
          ? { ...bloque, bajada: propuesta.bajada }
          : bloque
      ),
    }
    alCambiar(nuevo)
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-tinta/15 px-4 py-5 sm:px-5">
        <PedidoALaIa
          titulo="Pídele a la IA un orden"
          ayuda="Elige y ordena entre los productos de este catálogo, y propone un nombre. Tú decides si lo usas."
          ejemplos={[
            "Lo más vendible primero",
            "Solo lo que está en oferta",
            "Agrupado por categoría",
          ]}
          actuales={catalogo.productos}
          textoDeUsar="Usar este orden"
          alUsar={usar}
        />
      </div>

      {eligiendo ? (
        <>
          <SelectorDeProductos
            productos={Object.values(datos.productos)}
            categorias={datos.categorias}
            elegidos={catalogo.productos}
            alCambiar={(ids) => alCambiar(ponerProductos(catalogo, ids))}
            alto="max-h-[28rem]"
          />
          <div className="border-t border-tinta/15 px-4 py-4 sm:px-5">
            <button
              type="button"
              onClick={() => setEligiendo(false)}
              className={cn(BOTON_SECUNDARIO, "min-h-11 w-full text-sm")}
            >
              Listo: ordenar los elegidos
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <p className="tabular text-sm">
              <span className="font-semibold">{lista.length}</span>
              <span className="opacity-70">
                {lista.length === 1 ? " producto" : " productos"} · arrástralos
                para cambiar el orden
              </span>
            </p>
            <button
              type="button"
              onClick={() => setEligiendo(true)}
              className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
            >
              Agregar o quitar
            </button>
          </div>
          <ListaOrdenable
            productos={lista}
            alOrdenar={(ids) => alCambiar(ponerProductos(catalogo, ids))}
          />
        </>
      )}
    </div>
  )
}

function ListaOrdenable({
  productos,
  alOrdenar,
}: {
  productos: ProductoDelCatalogo[]
  alOrdenar: (ids: string[]) => void
}) {
  const ids = productos.map((producto) => producto.id)
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    alOrdenar(
      arrayMove(
        ids,
        ids.indexOf(String(active.id)),
        ids.indexOf(String(over.id))
      )
    )
  }

  if (productos.length === 0) {
    return (
      <p className="px-4 pb-5 text-sm leading-relaxed opacity-70 sm:px-5">
        Este catálogo no tiene productos. Toca «Agregar o quitar» para
        elegirlos.
      </p>
    )
  }

  return (
    <DndContext
      // Un id fijo: sin él, dnd-kit numera sus ids de accesibilidad distinto
      // en el servidor y en el navegador, y la hidratación no coincide.
      id="catalogo-productos"
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragEnd={alSoltar}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Para mover un producto, presiona espacio o Enter, usa las flechas y vuelve a presionar espacio para soltarlo. Escape cancela.",
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="border-t border-tinta/15">
          {productos.map((producto, indice) => (
            <FilaDeProducto
              key={producto.id}
              producto={producto}
              posicion={indice + 1}
              alQuitar={() => alOrdenar(ids.filter((id) => id !== producto.id))}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

function FilaDeProducto({
  producto,
  posicion,
  alQuitar,
}: {
  producto: ProductoDelCatalogo
  posicion: number
  alQuitar: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: producto.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-2 border-t border-tinta/15 bg-papel pr-1 first:border-t-0",
        isDragging && "z-10 border-2 border-tinta bg-tinta/[0.06]"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Mover ${producto.nombre}`}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center opacity-45 transition-opacity hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-5" />
      </button>
      <span className="tabular w-6 shrink-0 text-xs opacity-55">
        {posicion}
      </span>
      <Miniatura foto={producto.foto} icono={Package} />
      <span className="min-w-0 flex-1 py-2">
        <span className="block truncate text-sm font-semibold">
          {producto.nombre}
        </span>
        <span className="tabular block text-xs opacity-65">
          {formatMoney(producto.precioCents)}
          {producto.stock > 0 ? ` · ${producto.stock} en stock` : " · Agotado"}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Quitar ${producto.nombre} del catálogo`}
        onClick={alQuitar}
        className="flex size-11 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  )
}
