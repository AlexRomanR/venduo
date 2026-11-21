"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  CircleHelp,
  Info,
  Eye,
  EyeOff,
  GripVertical,
  Image as IconoImagen,
  LayoutGrid,
  Megaphone,
  Phone,
  Plus,
  Quote,
  ShoppingBag,
  Text,
  Trash2,
  WandSparkles,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { TipoDeBloque } from "@/lib/plantillas/bloques"
import type { Seccion } from "@/lib/plantillas/borrador"
import { SECCIONES } from "@/lib/plantillas/secciones"
import { cn } from "@/lib/utils"
import { ConFuncion } from "@/components/panel/funcion"
import { CamposDeSeccion } from "@/components/editor/campos"
import { useEditor } from "@/components/editor/contexto"
import { TextosDelEditor } from "@/components/editor/textos-a-medida"
import {
  Aviso,
  EncabezadoDePaso,
  SiguientePaso,
} from "@/components/editor/piezas"

/** Lo que se le pide a la IA para el primer empujón. */
export const ESCRIBIR_PORTADA =
  "Escribe los textos de mi página de inicio con lo que conté de mi negocio"

export const ICONOS_DE_SECCION: Record<TipoDeBloque, LucideIcon> = {
  hero: IconoImagen,
  categories: LayoutGrid,
  product_grid: ShoppingBag,
  about: Text,
  testimonials: Quote,
  cta: Megaphone,
  contact: Phone,
  faq: CircleHelp,
}

/** Una línea para reconocer la sección en la lista: su título. */
function resumen(seccion: Seccion): string {
  const titulo = seccion.props.title
  return typeof titulo === "string" && titulo.trim()
    ? titulo
    : SECCIONES[seccion.tipo].descripcion
}

/**
 * Paso 2: la portada, sección por sección.
 *
 * Tres vistas en el mismo lugar: la lista para ordenar, la galería para
 * agregar y el formulario de una sección. Tocar una sección en la vista
 * previa abre su formulario directamente.
 */
export function PasoPortada() {
  const {
    borrador,
    seleccion,
    seleccionar,
    irAPaso,
    tienda,
    ia,
    productos,
    textos,
  } = useEditor()
  const [agregando, setAgregando] = React.useState(false)
  // Dos botones de IA juntos confunden: mientras haya textos a medida por
  // decidir, va su tarjeta.
  const conTextos =
    textos?.vista?.estado === "lista" ||
    textos?.vista?.estado === "error" ||
    (textos?.vista === null && textos.escribiendo)
  const secciones = borrador.presente.secciones
  const elegida = secciones.find((seccion) => seccion.id === seleccion)

  return (
    <>
      <EncabezadoDePaso
        titulo="Portada"
        bajada="Lo primero que ve quien entra a tu tienda. Toca una sección para editarla. Adentro también puedes subirla o bajarla."
      />

      {elegida ? (
        <EditorDeSeccion
          key={elegida.id}
          seccion={elegida}
          indice={secciones.indexOf(elegida)}
          total={secciones.length}
          alVolver={() => seleccionar(null)}
        />
      ) : agregando ? (
        <Galeria
          alCerrar={() => setAgregando(false)}
          alAgregar={(id) => {
            setAgregando(false)
            seleccionar(id, { enfocar: true })
          }}
        />
      ) : (
        <>
          <TextosDelEditor />
          {tienda.descripcion && ia.estado !== "oculta" && !conTextos ? (
            <div className="px-5 pb-4">
              <ConFuncion estado={ia.estado}>
                <button
                  type="button"
                  onClick={() => ia.pedir(ESCRIBIR_PORTADA)}
                  disabled={ia.cargando}
                  className="group flex w-full items-center gap-3 rounded-[16px] border border-tinta bg-hoja p-3 text-left transition-colors hover:bg-tinta hover:text-papel disabled:opacity-50"
                >
                  <WandSparkles
                    aria-hidden="true"
                    className="size-6 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      Que la IA escriba tus textos
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed opacity-65">
                      Con lo que contaste de tu negocio al crear la tienda.
                    </span>
                  </span>
                </button>
              </ConFuncion>
            </div>
          ) : null}
          {productos.length === 0 ? (
            <div className="px-5 pb-4">
              <Aviso>
                Todavía no cargaste productos: tus secciones se ven con unos de
                ejemplo, para que veas cómo quedan con los tuyos.
              </Aviso>
            </div>
          ) : null}
          <ListaDeSecciones />
          <div className="px-5 pt-4 pb-2">
            <button
              type="button"
              onClick={() => setAgregando(true)}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-plantilla border-2 border-dashed border-tinta/40 font-semibold transition-colors hover:border-tinta hover:bg-tinta/[0.03]"
            >
              <Plus aria-hidden="true" className="size-5" />
              Agregar una sección
            </button>
          </div>
          <p className="flex gap-2 px-5 pt-4 text-xs leading-relaxed opacity-70">
            <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Debajo de tus secciones, tu plantilla agrega tu nombre, tu
              descripción y tu WhatsApp. Tócalos en la vista previa para ver de
              dónde sale cada uno.
            </span>
          </p>
        </>
      )}

      {elegida ? null : (
        <SiguientePaso nombre="Productos" alIr={() => irAPaso("productos")} />
      )}
    </>
  )
}

function ListaDeSecciones() {
  const { borrador, seleccionar } = useEditor()
  const secciones = borrador.presente.secciones

  const sensores = useSensors(
    // Una distancia mínima distingue arrastrar de tocar; el asa ya evita que
    // arrastrar mueva la página.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const nombre = (id: string | number) => {
    const seccion = secciones.find((s) => s.id === id)
    return seccion ? `«${SECCIONES[seccion.tipo].nombre}»` : "la sección"
  }
  const lugar = (id: string | number) =>
    secciones.findIndex((s) => s.id === id) + 1

  const anuncios: Announcements = {
    onDragStart: ({ active }) =>
      `Tomaste ${nombre(active.id)}. Está en el lugar ${lugar(active.id)} de ${secciones.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nombre(active.id)} iría al lugar ${lugar(over.id)}.`
        : `${nombre(active.id)} está fuera de la lista.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Soltaste ${nombre(active.id)} en el lugar ${lugar(over.id)}.`
        : `Soltaste ${nombre(active.id)}.`,
    onDragCancel: ({ active }) =>
      `Cancelaste. ${nombre(active.id)} quedó donde estaba.`,
  }

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    borrador.aplicar([
      {
        op: "mover",
        seccion: String(active.id),
        posicion: secciones.findIndex((s) => s.id === over.id),
      },
    ])
  }

  if (secciones.length === 0) {
    return (
      <div className="px-5">
        <Aviso>
          Tu página de inicio no tiene secciones. Agrega una para empezar: la
          presentación con un título grande es un buen comienzo.
        </Aviso>
      </div>
    )
  }

  return (
    <DndContext
      // Un id fijo: sin él, dnd-kit numera sus ids de accesibilidad distinto
      // en el servidor y en el navegador, y la hidratación no coincide.
      id="editor-secciones"
      sensors={sensores}
      collisionDetection={closestCenter}
      // Sin esto, cerca del borde la lista se desplaza sola y la sección se
      // pasa de largo.
      autoScroll={{ threshold: { x: 0, y: 0.08 }, acceleration: 2 }}
      onDragEnd={alSoltar}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: {
          draggable:
            "Para mover una sección, presiona espacio o Enter, usa las flechas y vuelve a presionar espacio para soltarla. Escape cancela.",
        },
      }}
    >
      <SortableContext
        items={secciones.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="border-t border-tinta/15">
          {secciones.map((seccion, indice) => (
            <FilaDeSeccion
              key={seccion.id}
              seccion={seccion}
              indice={indice}
              alAbrir={() => seleccionar(seccion.id, { enfocar: true })}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

function FilaDeSeccion({
  seccion,
  indice,
  alAbrir,
}: {
  seccion: Seccion
  indice: number
  alAbrir: () => void
}) {
  const { borrador } = useEditor()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: seccion.id })

  const definicion = SECCIONES[seccion.tipo]
  const Icono = ICONOS_DE_SECCION[seccion.tipo]

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "relative flex items-center border-b border-tinta/15 bg-papel",
        // Levantarla sin sombra: la regla de 2 px y un campo más oscuro.
        isDragging && "z-10 border-2 border-tinta bg-tinta/[0.06]"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Mover ${definicion.nombre}`}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center opacity-70 transition-opacity hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-5" />
      </button>

      <button
        type="button"
        onClick={alAbrir}
        className={cn(
          "flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2 pr-1 text-left",
          !seccion.visible && "opacity-70"
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-tinta/20">
          <Icono aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="tabular text-xs opacity-70">{indice + 1}</span>
            {definicion.nombre}
            {!seccion.visible ? (
              <span className="text-xs font-normal">· Oculta</span>
            ) : null}
          </span>
          <span className="block truncate text-xs opacity-70">
            {resumen(seccion)}
          </span>
        </span>
      </button>

      <button
        type="button"
        aria-pressed={!seccion.visible}
        aria-label={
          seccion.visible
            ? `Ocultar ${definicion.nombre}`
            : `Mostrar ${definicion.nombre}`
        }
        title={seccion.visible ? "Ocultar" : "Mostrar"}
        onClick={() =>
          borrador.aplicar([
            { op: "mostrar", seccion: seccion.id, visible: !seccion.visible },
          ])
        }
        className="flex size-11 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
      >
        {seccion.visible ? (
          <Eye aria-hidden="true" className="size-4" />
        ) : (
          <EyeOff aria-hidden="true" className="size-4" />
        )}
      </button>
      <ChevronRight aria-hidden="true" className="mr-2 size-4 opacity-35" />
    </li>
  )
}

function EditorDeSeccion({
  seccion,
  indice,
  total,
  alVolver,
}: {
  seccion: Seccion
  indice: number
  total: number
  alVolver: () => void
}) {
  const { borrador, seleccionar } = useEditor()
  const definicion = SECCIONES[seccion.tipo]
  const Icono = ICONOS_DE_SECCION[seccion.tipo]
  const inicio = React.useRef<HTMLDivElement>(null)

  // Al abrir una sección, el panel va directo a ella: en el celular, el
  // encabezado del paso dejaba el formulario fuera de la vista. En el cuadro
  // siguiente, porque el editor vuelve el panel arriba al cambiar de paso, y
  // ese efecto corre después de este.
  React.useEffect(() => {
    const cuadro = requestAnimationFrame(() =>
      inicio.current?.scrollIntoView({ block: "start" })
    )
    return () => cancelAnimationFrame(cuadro)
  }, [])

  function mover(hacia: -1 | 1) {
    borrador.aplicar([
      { op: "mover", seccion: seccion.id, posicion: indice + hacia },
    ])
    seleccionar(seccion.id, { enfocar: true })
  }

  function quitar() {
    borrador.aplicar([{ op: "quitar", seccion: seccion.id }])
    alVolver()
    toast(`Quitaste «${definicion.nombre}».`, {
      action: { label: "Deshacer", onClick: () => borrador.deshacer() },
    })
  }

  return (
    <div
      ref={inicio}
      className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-right-2"
    >
      <div className="border-t border-tinta/15 px-2">
        <button
          type="button"
          onClick={alVolver}
          className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:opacity-60"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todas las secciones
        </button>
      </div>

      <div className="border-t border-tinta/15 px-5 pt-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center bg-tinta text-papel">
            <Icono aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="tabular text-xs font-semibold opacity-70">
              Sección {indice + 1} de {total}
            </p>
            <h2 className="mt-1 font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
              {definicion.nombre}
            </h2>
            <p className="mt-1 text-sm leading-relaxed opacity-70 max-lg:hidden">
              {definicion.descripcion}
            </p>
          </div>
        </div>

        {!seccion.visible ? (
          <Aviso className="mt-4">
            Está oculta: quienes te compran no la ven. La puedes seguir
            editando.
          </Aviso>
        ) : null}
      </div>

      <div className="px-5 py-6">
        <CamposDeSeccion
          seccion={seccion.id}
          campos={definicion.campos}
          props={seccion.props}
        />
      </div>

      {/* Después de los campos: en un celular son lo primero que se busca, y
          estas acciones los dejaban fuera de la vista. */}
      <div className="grid grid-cols-4 border-t border-tinta/15">
        <Accion
          icono={seccion.visible ? EyeOff : Eye}
          etiqueta={seccion.visible ? "Ocultar" : "Mostrar"}
          alTocar={() =>
            borrador.aplicar([
              {
                op: "mostrar",
                seccion: seccion.id,
                visible: !seccion.visible,
              },
            ])
          }
        />
        <Accion
          icono={ArrowUp}
          etiqueta="Subir"
          deshabilitada={indice === 0}
          alTocar={() => mover(-1)}
        />
        <Accion
          icono={ArrowDown}
          etiqueta="Bajar"
          deshabilitada={indice === total - 1}
          alTocar={() => mover(1)}
        />
        <Accion icono={Trash2} etiqueta="Quitar" alTocar={quitar} peligro />
      </div>

      <div className="border-t border-tinta/15 p-5">
        <button
          type="button"
          onClick={alVolver}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-plantilla border-2 border-tinta font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          Listo
        </button>
      </div>
    </div>
  )
}

function Accion({
  icono: Icono,
  etiqueta,
  alTocar,
  deshabilitada,
  peligro,
}: {
  icono: LucideIcon
  etiqueta: string
  alTocar: () => void
  deshabilitada?: boolean
  peligro?: boolean
}) {
  return (
    <button
      type="button"
      onClick={alTocar}
      disabled={deshabilitada}
      className={cn(
        "flex min-h-11 flex-1 items-center justify-center gap-1.5 px-2 text-xs font-semibold transition-colors disabled:opacity-30",
        peligro ? "hover:text-senal" : "hover:bg-tinta/[0.04]"
      )}
    >
      <Icono aria-hidden="true" className="size-4" />
      {etiqueta}
    </button>
  )
}

function Galeria({
  alCerrar,
  alAgregar,
}: {
  alCerrar: () => void
  alAgregar: (id: string) => void
}) {
  const { borrador } = useEditor()
  const secciones = borrador.presente.secciones

  function agregar(tipo: TipoDeBloque) {
    const id = crypto.randomUUID()
    const resultado = borrador.aplicar([
      { op: "agregar", tipo, posicion: secciones.length, props: {}, id },
    ])
    if (!resultado.ok) {
      toast.error(resultado.errores[0])
      return
    }
    toast.success(`Agregaste «${SECCIONES[tipo].nombre}». Edítala a tu gusto.`)
    alAgregar(id)
  }

  return (
    <div className="border-t border-tinta/15 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in">
      <div className="flex items-center justify-between gap-3 px-2">
        <button
          type="button"
          onClick={alCerrar}
          className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:opacity-60"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todas las secciones
        </button>
      </div>
      <p className="border-t border-tinta/15 px-5 pt-5 text-xs font-semibold tracking-[0.12em] uppercase opacity-70">
        Elige qué agregar
      </p>
      <ul className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-1">
        {Object.values(SECCIONES).map((definicion) => {
          const Icono = ICONOS_DE_SECCION[definicion.tipo]
          const lleno =
            definicion.maximo !== null &&
            secciones.filter((s) => s.tipo === definicion.tipo).length >=
              definicion.maximo
          return (
            <li key={definicion.tipo}>
              <button
                type="button"
                disabled={lleno}
                onClick={() => agregar(definicion.tipo)}
                className="group flex w-full items-start gap-3 rounded-[16px] border border-tinta/20 bg-hoja p-3 text-left transition-colors hover:border-tinta disabled:pointer-events-none disabled:opacity-45"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-tinta/20 transition-colors group-hover:bg-tinta group-hover:text-papel">
                  <Icono aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {definicion.nombre}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed opacity-70">
                    {lleno
                      ? "Ya está en tu página de inicio."
                      : definicion.descripcion}
                  </span>
                </span>
                {lleno ? null : (
                  <Plus
                    aria-hidden="true"
                    className="mt-3 size-4 shrink-0 opacity-45"
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
