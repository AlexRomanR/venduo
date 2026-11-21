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
import { ArrowDown, ArrowUp, GripVertical, Package, X } from "lucide-react"

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
import { SelectorDeProductos } from "@/components/catalogos/editor/selector"

/*
 * Los productos del catálogo: cuáles y en qué orden.
 *
 * El orden es el del catálogo entero: las hojas de "todos los elegidos" los
 * muestran así, y las de una categoría también, filtrando.
 */

/** El catálogo como quedaría con la propuesta de la IA. */
export function armarPropuesta(
  catalogo: Catalogo,
  propuesta: PropuestaDeCatalogo
): Catalogo {
  const nuevo = ponerProductos(catalogo, propuesta.productos)
  const portada = nuevo.bloques.find((bloque) => bloque.tipo === "portada")
  return {
    ...nuevo,
    nombre: propuesta.nombre,
    bloques: nuevo.bloques.map((bloque) =>
      bloque === portada && propuesta.bajada
        ? { ...bloque, bajada: propuesta.bajada }
        : bloque
    ),
  }
}

/** Qué cambia si se aplica la propuesta, dicho antes de aplicarla. */
export function DetalleDePropuesta({
  catalogo,
  datos,
  propuesta,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  propuesta: PropuestaDeCatalogo
}) {
  const quedan = new Set(propuesta.productos)
  const salen = catalogo.productos
    .filter((id) => !quedan.has(id))
    .map((id) => datos.productos[id]?.nombre)
    .filter(Boolean)
  const portada = catalogo.bloques.find((bloque) => bloque.tipo === "portada")
  const cambiaPortada =
    propuesta.bajada &&
    portada?.tipo === "portada" &&
    portada.bajada !== propuesta.bajada
  const primeros = propuesta.productos
    .slice(0, 3)
    .map((id) => datos.productos[id]?.nombre)
    .filter(Boolean)

  return (
    <ul className="mt-3 flex flex-col gap-1 border-t border-tinta/15 pt-3 text-sm">
      {propuesta.nombre !== catalogo.nombre ? (
        <li>
          <span className="font-semibold">Nombre nuevo:</span>{" "}
          {propuesta.nombre}
        </li>
      ) : null}
      <li>
        <span className="font-semibold">Primero:</span> {primeros.join(", ")}
        {propuesta.productos.length > primeros.length
          ? ` y ${propuesta.productos.length - primeros.length} más`
          : ""}
      </li>
      {salen.length > 0 ? (
        <li>
          <span className="font-semibold">Se quitan del catálogo:</span>{" "}
          {salen.join(", ")}
        </li>
      ) : null}
      {cambiaPortada ? (
        <li>
          <span className="font-semibold">Texto de la portada:</span> «
          {propuesta.bajada}»
        </li>
      ) : null}
    </ul>
  )
}

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

  return (
    <div className="flex flex-col">
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
                {lista.length === 1 ? " producto" : " productos"} · toca uno
                para subirlo o bajarlo
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
  const [abierto, setAbierto] = React.useState<string | null>(null)
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
              total={productos.length}
              abierto={abierto === producto.id}
              alAbrir={() =>
                setAbierto(abierto === producto.id ? null : producto.id)
              }
              alMover={(hacia) =>
                alOrdenar(arrayMove(ids, indice, indice + hacia))
              }
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
  total,
  abierto,
  alAbrir,
  alMover,
  alQuitar,
}: {
  producto: ProductoDelCatalogo
  posicion: number
  total: number
  abierto: boolean
  alAbrir: () => void
  alMover: (hacia: -1 | 1) => void
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
  const fila = React.useRef<HTMLLIElement | null>(null)

  // Subir y Bajar aparecen debajo: en el último producto quedaban fuera.
  React.useEffect(() => {
    if (abierto) fila.current?.scrollIntoView({ block: "nearest" })
  }, [abierto])

  return (
    <li
      ref={(elemento) => {
        setNodeRef(elemento)
        fila.current = elemento
      }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative border-t border-tinta/15 bg-hoja first:border-t-0",
        isDragging && "z-10 border-2 border-tinta bg-tinta/[0.06]"
      )}
    >
      <div className="flex items-center gap-2 pr-1">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Arrastrar ${producto.nombre}`}
          className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center opacity-70 transition-opacity hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          aria-expanded={abierto}
          aria-label={`Mover ${producto.nombre}, lugar ${posicion} de ${total}`}
          onClick={alAbrir}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        >
          <span className="tabular w-6 shrink-0 text-xs opacity-70">
            {posicion}
          </span>
          <Miniatura foto={producto.foto} icono={Package} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {producto.nombre}
            </span>
            <span className="tabular block text-xs opacity-70">
              {formatMoney(producto.precioCents)}
              {producto.stock > 0
                ? ` · ${producto.stock} en stock`
                : " · Agotado"}
            </span>
          </span>
        </button>
        <button
          type="button"
          aria-label={`Quitar ${producto.nombre} del catálogo`}
          onClick={alQuitar}
          className="flex size-11 shrink-0 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      {abierto ? (
        <div className="grid grid-cols-2 border-t border-tinta/10">
          <button
            type="button"
            disabled={posicion === 1}
            onClick={() => alMover(-1)}
            className="flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold transition-colors hover:bg-tinta/[0.04] disabled:opacity-30"
          >
            <ArrowUp aria-hidden="true" className="size-4" />
            Subir
          </button>
          <button
            type="button"
            disabled={posicion === total}
            onClick={() => alMover(1)}
            className="flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold transition-colors hover:bg-tinta/[0.04] disabled:opacity-30"
          >
            <ArrowDown aria-hidden="true" className="size-4" />
            Bajar
          </button>
        </div>
      ) : null}
    </li>
  )
}
