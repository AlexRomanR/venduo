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
  ArrowLeft,
  BadgePercent,
  BookOpen,
  Bookmark,
  ChevronRight,
  Copy,
  Gift,
  GripVertical,
  LayoutGrid,
  MessageCircle,
  Plus,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  CAMPOS,
  TIPOS_DE_BLOQUE,
  VARIANTES,
  type Campo,
  type TipoDeBloque,
} from "@/lib/catalogos/constantes"
import {
  elegidos,
  hojasDelBloque,
  productosDe,
  type DatosDelCatalogo,
} from "@/lib/catalogos/datos"
import type { Bloque, BloqueDe, Catalogo } from "@/lib/catalogos/modelo"
import {
  agregarBloque,
  agregarPack,
  bloqueNuevo,
  cambiarBloque,
  duplicarBloque,
  moverBloque,
  quitarBloque,
} from "@/lib/catalogos/operaciones"
import { cn } from "@/lib/utils"
import { Aviso } from "@/components/editor/piezas"
import {
  CampoArea,
  CampoTexto,
  Contador,
  ETIQUETA,
  Fichas,
  Interruptor,
  SelectorDeFoto,
} from "@/components/catalogos/editor/campos"

/*
 * Las hojas del catálogo: ordenarlas, agregarlas y editar cada una.
 *
 * Tres vistas en el mismo lugar, como la portada en el editor de la tienda:
 * la lista para ordenar, el menú para agregar y el formulario de una hoja.
 * Tocar una hoja en la vista previa abre su formulario.
 */

export const ICONOS_DE_HOJA: Record<TipoDeBloque, LucideIcon> = {
  portada: BookOpen,
  productos: LayoutGrid,
  separador: Bookmark,
  pack: Gift,
  oferta: BadgePercent,
  contraportada: MessageCircle,
  texto: Type,
}

/** El esquema acepta hasta cuarenta: más hojas no se mandan por WhatsApp. */
const TOPE_DE_BLOQUES = 40

interface Props {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  elegido: string | null
  alElegir: (id: string | null) => void
  alCambiar: (catalogo: Catalogo) => void
  alIrA: (panel: "productos" | "packs") => void
}

export function PanelDeHojas(props: Props) {
  const { catalogo, elegido } = props
  const [agregando, setAgregando] = React.useState(false)
  const bloque = catalogo.bloques.find((otro) => otro.id === elegido)

  if (bloque) return <EditorDeHoja key={bloque.id} bloque={bloque} {...props} />
  if (agregando) {
    return <AgregarHoja {...props} alCerrar={() => setAgregando(false)} />
  }

  return (
    <div className="flex flex-col">
      <ListaDeHojas {...props} />
      <div className="px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => setAgregando(true)}
          disabled={catalogo.bloques.length >= TOPE_DE_BLOQUES}
          className="flex min-h-12 w-full items-center justify-center gap-2 border-2 border-dashed border-tinta/40 font-semibold transition-colors hover:border-tinta hover:bg-tinta/[0.03] disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="size-5" />
          Agregar una hoja
        </button>
        {catalogo.bloques.length >= TOPE_DE_BLOQUES ? (
          <p className="mt-2 text-xs leading-relaxed opacity-65">
            Llegaste a cuarenta bloques. Quita alguno para agregar otro.
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * La lista
 * ------------------------------------------------------------------------ */

function resumen(
  bloque: Bloque,
  catalogo: Catalogo,
  datos: DatosDelCatalogo
): string {
  switch (bloque.tipo) {
    case "productos": {
      const cuantos = productosDe(bloque.cuales, catalogo, datos).length
      const hojas = hojasDelBloque(bloque, catalogo, datos)
      if (cuantos === 0) return "Sin productos: no ocupa hoja"
      return `${cuantos} ${cuantos === 1 ? "producto" : "productos"} en ${hojas} ${hojas === 1 ? "hoja" : "hojas"}`
    }
    case "pack":
      return (
        catalogo.packs.find((pack) => pack.id === bloque.pack)?.nombre ??
        "Sin pack elegido"
      )
    case "oferta":
      return [bloque.etiqueta, bloque.titulo].filter(Boolean).join(" · ")
    case "texto":
      return bloque.titulo || bloque.texto.slice(0, 60) || "Sin texto"
    default:
      return bloque.titulo || "Sin título"
  }
}

function ListaDeHojas({ catalogo, datos, alElegir, alCambiar }: Props) {
  const bloques = catalogo.bloques
  const sensores = useSensors(
    // Una distancia mínima distingue arrastrar de tocar.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const nombre = (id: string | number) => {
    const bloque = bloques.find((otro) => otro.id === id)
    return bloque ? `«${TIPOS_DE_BLOQUE[bloque.tipo].nombre}»` : "la hoja"
  }
  const lugar = (id: string | number) =>
    bloques.findIndex((otro) => otro.id === id) + 1

  const anuncios: Announcements = {
    onDragStart: ({ active }) =>
      `Tomaste ${nombre(active.id)}. Está en el lugar ${lugar(active.id)} de ${bloques.length}.`,
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
    alCambiar(
      moverBloque(
        catalogo,
        String(active.id),
        bloques.findIndex((otro) => otro.id === over.id)
      )
    )
  }

  if (bloques.length === 0) {
    return (
      <div className="px-4 pt-5 sm:px-5">
        <Aviso>
          El catálogo no tiene hojas. Agrega una portada y una hoja de productos
          para empezar.
        </Aviso>
      </div>
    )
  }

  return (
    <DndContext
      // Un id fijo: sin él, dnd-kit numera sus ids de accesibilidad distinto
      // en el servidor y en el navegador, y la hidratación no coincide.
      id="catalogo-hojas"
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragEnd={alSoltar}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: {
          draggable:
            "Para mover una hoja, presiona espacio o Enter, usa las flechas y vuelve a presionar espacio para soltarla. Escape cancela.",
        },
      }}
    >
      <SortableContext
        items={bloques.map((bloque) => bloque.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol>
          {bloques.map((bloque) => (
            <FilaDeHoja
              key={bloque.id}
              bloque={bloque}
              detalle={resumen(bloque, catalogo, datos)}
              alAbrir={() => alElegir(bloque.id)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

function FilaDeHoja({
  bloque,
  detalle,
  alAbrir,
}: {
  bloque: Bloque
  detalle: string
  alAbrir: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bloque.id })
  const Icono = ICONOS_DE_HOJA[bloque.tipo]
  const tipo = TIPOS_DE_BLOQUE[bloque.tipo]
  const variante = (VARIANTES[bloque.tipo] as Record<string, string>)[
    bloque.variante
  ]

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-center border-t border-tinta/15 bg-papel first:border-t-0",
        isDragging && "z-10 border-2 border-tinta bg-tinta/[0.06]"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Mover ${tipo.nombre}`}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center opacity-45 transition-opacity hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-5" />
      </button>
      <button
        type="button"
        onClick={alAbrir}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2 pr-3 text-left"
      >
        <Icono aria-hidden="true" className="size-5 shrink-0 opacity-75" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {tipo.nombre}
            <span className="font-normal opacity-60"> · {variante}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs opacity-65">
            {detalle}
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 opacity-45" />
      </button>
    </li>
  )
}

/* ---------------------------------------------------------------------------
 * Agregar
 * ------------------------------------------------------------------------ */

function AgregarHoja({
  catalogo,
  datos,
  alCambiar,
  alElegir,
  alCerrar,
}: Props & { alCerrar: () => void }) {
  const tienda = {
    nombre: datos.tienda.nombre,
    whatsapp: datos.tienda.whatsapp,
  }

  function agregar(tipo: TipoDeBloque) {
    if (tipo === "pack" && catalogo.packs.length === 0) {
      if (catalogo.productos.length < 2) {
        toast.error("Un pack lleva al menos dos productos: elige otro más.")
        return
      }
      const precios = Object.fromEntries(
        Object.values(datos.productos).map((p) => [p.id, p.precioCents])
      )
      const { catalogo: conPack, pack } = agregarPack(catalogo, precios)
      alCambiar(conPack)
      const hoja = conPack.bloques.find(
        (bloque) => bloque.tipo === "pack" && bloque.pack === pack.id
      )
      alElegir(hoja?.id ?? null)
      alCerrar()
      return
    }

    const bloque = bloqueNuevo(tipo, catalogo, tienda)
    alCambiar(agregarBloque(catalogo, bloque, null))
    alElegir(bloque.id)
    alCerrar()
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center border-b border-tinta/15 px-2 py-1">
        <button
          type="button"
          onClick={alCerrar}
          className="flex min-h-11 items-center gap-2 px-2 text-sm font-semibold"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todas las hojas
        </button>
      </div>
      <p className="px-4 pt-5 pb-3 text-sm leading-relaxed opacity-75 sm:px-5">
        Cualquier hoja va en cualquier plantilla, y cambias su diseño después.
      </p>
      <ul className="grid grid-cols-1 gap-px bg-tinta/15 sm:grid-cols-2">
        {(Object.keys(TIPOS_DE_BLOQUE) as TipoDeBloque[]).map((tipo) => {
          const Icono = ICONOS_DE_HOJA[tipo]
          return (
            <li key={tipo} className="bg-papel">
              <button
                type="button"
                onClick={() => agregar(tipo)}
                className="flex min-h-20 w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-tinta/[0.04] sm:px-5"
              >
                <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">
                    {TIPOS_DE_BLOQUE[tipo].nombre}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed opacity-65">
                    {TIPOS_DE_BLOQUE[tipo].detalle}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Una hoja
 * ------------------------------------------------------------------------ */

function opcionesDe<T extends TipoDeBloque>(tipo: T) {
  return (Object.entries(VARIANTES[tipo]) as [string, string][]).map(
    ([valor, etiqueta]) => ({
      valor: valor as BloqueDe<T>["variante"],
      etiqueta,
    })
  )
}

function EditorDeHoja({
  bloque,
  catalogo,
  datos,
  alElegir,
  alCambiar,
  alIrA,
}: Props & { bloque: Bloque }) {
  const Icono = ICONOS_DE_HOJA[bloque.tipo]
  const tipo = TIPOS_DE_BLOQUE[bloque.tipo]
  const cambiar = (nuevo: Bloque) => alCambiar(cambiarBloque(catalogo, nuevo))

  function quitar() {
    const antes = catalogo
    alCambiar(quitarBloque(catalogo, bloque.id))
    alElegir(null)
    toast(`Quitaste la hoja «${tipo.nombre}».`, {
      action: { label: "Deshacer", onClick: () => alCambiar(antes) },
    })
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-tinta/15 px-2 py-1">
        <button
          type="button"
          onClick={() => alElegir(null)}
          className="flex min-h-11 items-center gap-2 px-2 text-sm font-semibold"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todas las hojas
        </button>
        <div className="flex">
          <button
            type="button"
            aria-label="Duplicar esta hoja"
            disabled={catalogo.bloques.length >= TOPE_DE_BLOQUES}
            onClick={() => alCambiar(duplicarBloque(catalogo, bloque.id))}
            className="flex size-11 items-center justify-center opacity-70 transition-opacity hover:opacity-100 disabled:opacity-30"
          >
            <Copy aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Quitar esta hoja"
            onClick={quitar}
            className="flex size-11 items-center justify-center opacity-70 transition-opacity hover:text-senal hover:opacity-100"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 py-5 sm:px-5">
        <header className="flex items-start gap-3">
          <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
              {tipo.nombre}
            </h3>
            <p className="mt-0.5 text-sm leading-snug opacity-70">
              {tipo.detalle}
            </p>
          </div>
        </header>
        <CamposDeHoja
          bloque={bloque}
          catalogo={catalogo}
          datos={datos}
          cambiar={cambiar}
          alIrA={alIrA}
        />
      </div>
    </div>
  )
}

function CamposDeHoja({
  bloque,
  catalogo,
  datos,
  cambiar,
  alIrA,
}: {
  bloque: Bloque
  catalogo: Catalogo
  datos: DatosDelCatalogo
  cambiar: (bloque: Bloque) => void
  alIrA: Props["alIrA"]
}) {
  const productos = elegidos(catalogo, datos)
  const id = (campo: string) => `${bloque.id}-${campo}`

  switch (bloque.tipo) {
    case "portada":
      return (
        <>
          <Fichas
            etiqueta="Diseño"
            valor={bloque.variante}
            opciones={opcionesDe("portada")}
            alCambiar={(variante) => cambiar({ ...bloque, variante })}
          />
          <CampoTexto
            id={id("titulo")}
            etiqueta="Título"
            valor={bloque.titulo}
            maximo={80}
            placeholder={datos.tienda.nombre}
            alCambiar={(titulo) => cambiar({ ...bloque, titulo })}
          />
          <CampoArea
            id={id("bajada")}
            etiqueta="Bajada"
            valor={bloque.bajada}
            maximo={200}
            filas={2}
            placeholder="Temporada de octubre"
            alCambiar={(bajada) => cambiar({ ...bloque, bajada })}
          />
          {bloque.variante === "tipografica" ? (
            <Aviso>Esta portada va sin foto: todo es letra.</Aviso>
          ) : (
            <SelectorDeFoto
              etiqueta={bloque.variante === "collage" ? "Primera foto" : "Foto"}
              valor={bloque.foto}
              productos={productos}
              alCambiar={(foto) => cambiar({ ...bloque, foto })}
            />
          )}
        </>
      )

    case "productos":
      return (
        <CamposDeProductos
          bloque={bloque}
          catalogo={catalogo}
          datos={datos}
          cambiar={cambiar}
          alIrA={alIrA}
        />
      )

    case "separador":
      return (
        <>
          <Fichas
            etiqueta="Diseño"
            valor={bloque.variante}
            opciones={opcionesDe("separador")}
            alCambiar={(variante) => cambiar({ ...bloque, variante })}
          />
          <CampoTexto
            id={id("titulo")}
            etiqueta="Título"
            valor={bloque.titulo}
            maximo={80}
            placeholder="Zapatillas"
            alCambiar={(titulo) => cambiar({ ...bloque, titulo })}
          />
          <CampoArea
            id={id("bajada")}
            etiqueta="Bajada"
            valor={bloque.bajada}
            maximo={200}
            filas={2}
            alCambiar={(bajada) => cambiar({ ...bloque, bajada })}
          />
          {bloque.variante === "foto" ? (
            <SelectorDeFoto
              etiqueta="Foto"
              valor={bloque.foto}
              productos={productos}
              alCambiar={(foto) => cambiar({ ...bloque, foto })}
            />
          ) : null}
        </>
      )

    case "pack":
      return (
        <>
          <Fichas
            etiqueta="Diseño"
            valor={bloque.variante}
            opciones={opcionesDe("pack")}
            alCambiar={(variante) => cambiar({ ...bloque, variante })}
          />
          {catalogo.packs.length > 0 ? (
            <Fichas
              etiqueta="Qué pack muestra"
              valor={bloque.pack}
              opciones={catalogo.packs.map((pack) => ({
                valor: pack.id,
                etiqueta: pack.nombre,
              }))}
              alCambiar={(pack) => cambiar({ ...bloque, pack })}
            />
          ) : (
            <Aviso tono="problema">
              No hay packs todavía. Arma uno en la pestaña Packs.
            </Aviso>
          )}
          <button
            type="button"
            onClick={() => alIrA("packs")}
            className="flex min-h-11 w-fit items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            Editar los packs
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </>
      )

    case "oferta":
      return (
        <>
          <Fichas
            etiqueta="Diseño"
            valor={bloque.variante}
            opciones={opcionesDe("oferta")}
            alCambiar={(variante) => cambiar({ ...bloque, variante })}
          />
          <CampoTexto
            id={id("etiqueta")}
            etiqueta="Lo que va en grande"
            valor={bloque.etiqueta}
            maximo={24}
            placeholder="-20%"
            ayuda="Corto: «-20%», «2x1», «Liquidación»."
            alCambiar={(etiqueta) => cambiar({ ...bloque, etiqueta })}
          />
          <CampoTexto
            id={id("titulo")}
            etiqueta="Título"
            valor={bloque.titulo}
            maximo={80}
            alCambiar={(titulo) => cambiar({ ...bloque, titulo })}
          />
          <CampoArea
            id={id("texto")}
            etiqueta="Texto"
            valor={bloque.texto}
            maximo={240}
            alCambiar={(texto) => cambiar({ ...bloque, texto })}
          />
        </>
      )

    case "contraportada":
      return (
        <>
          <Fichas
            etiqueta="Diseño"
            valor={bloque.variante}
            opciones={opcionesDe("contraportada")}
            alCambiar={(variante) => cambiar({ ...bloque, variante })}
          />
          <CampoTexto
            id={id("titulo")}
            etiqueta="Título"
            valor={bloque.titulo}
            maximo={80}
            alCambiar={(titulo) => cambiar({ ...bloque, titulo })}
          />
          <CampoArea
            id={id("texto")}
            etiqueta="Texto"
            valor={bloque.texto}
            maximo={240}
            alCambiar={(texto) => cambiar({ ...bloque, texto })}
          />
          <CampoTexto
            id={id("redes")}
            etiqueta="Tus redes"
            valor={bloque.redes}
            maximo={120}
            placeholder="@tutienda en TikTok e Instagram"
            alCambiar={(redes) => cambiar({ ...bloque, redes })}
          />
          <CampoArea
            id={id("pago")}
            etiqueta="Cómo pagar"
            valor={bloque.pago}
            maximo={240}
            alCambiar={(pago) => cambiar({ ...bloque, pago })}
          />
          <div className="flex flex-col gap-2">
            <Interruptor
              etiqueta="Tu WhatsApp"
              detalle={
                datos.tienda.whatsapp
                  ? datos.tienda.whatsapp
                  : "Carga tu número en Cuenta para mostrarlo."
              }
              activo={bloque.whatsapp && Boolean(datos.tienda.whatsapp)}
              deshabilitado={!datos.tienda.whatsapp}
              alCambiar={(whatsapp) => cambiar({ ...bloque, whatsapp })}
            />
            <Interruptor
              etiqueta="El QR de tu tienda online"
              detalle="Lo escanean y caen en tu tienda, con el stock al día."
              activo={bloque.qr}
              alCambiar={(qr) => cambiar({ ...bloque, qr })}
            />
          </div>
        </>
      )

    case "texto":
      return (
        <>
          <Fichas
            etiqueta="Diseño"
            valor={bloque.variante}
            opciones={opcionesDe("texto")}
            alCambiar={(variante) => cambiar({ ...bloque, variante })}
          />
          <CampoTexto
            id={id("titulo")}
            etiqueta={bloque.variante === "cita" ? "Quién lo dice" : "Título"}
            valor={bloque.titulo}
            maximo={80}
            alCambiar={(titulo) => cambiar({ ...bloque, titulo })}
          />
          <CampoArea
            id={id("texto")}
            etiqueta="Texto"
            valor={bloque.texto}
            maximo={800}
            filas={7}
            ayuda="Deja una línea en blanco entre párrafos."
            alCambiar={(texto) => cambiar({ ...bloque, texto })}
          />
        </>
      )
  }
}

function CamposDeProductos({
  bloque,
  catalogo,
  datos,
  cambiar,
  alIrA,
}: {
  bloque: BloqueDe<"productos">
  catalogo: Catalogo
  datos: DatosDelCatalogo
  cambiar: (bloque: Bloque) => void
  alIrA: Props["alIrA"]
}) {
  const productos = elegidos(catalogo, datos)
  const categorias = [
    ...new Map(
      productos
        .filter((p) => p.categoriaId)
        .map((p) => [p.categoriaId as string, p.categoria ?? "Sin nombre"])
    ),
  ]
  const hojas = hojasDelBloque(bloque, catalogo, datos)
  const elegidosAca =
    bloque.cuales.tipo === "elegidos" ? new Set(bloque.cuales.productos) : null

  return (
    <>
      <Fichas
        etiqueta="Diseño"
        valor={bloque.variante}
        opciones={opcionesDe("productos")}
        alCambiar={(variante) => cambiar({ ...bloque, variante })}
      />
      <CampoTexto
        id={`${bloque.id}-titulo`}
        etiqueta="Título de la hoja"
        valor={bloque.titulo}
        maximo={80}
        ayuda="Opcional. Va arriba de cada hoja de este bloque."
        alCambiar={(titulo) => cambiar({ ...bloque, titulo })}
      />

      <Fichas
        etiqueta="Qué productos muestra"
        valor={bloque.cuales.tipo}
        opciones={[
          { valor: "todos", etiqueta: "Todos los elegidos" },
          ...(categorias.length > 0
            ? [{ valor: "categoria" as const, etiqueta: "Una categoría" }]
            : []),
          { valor: "elegidos", etiqueta: "Algunos" },
        ]}
        alCambiar={(tipo) =>
          cambiar({
            ...bloque,
            cuales:
              tipo === "todos"
                ? { tipo }
                : tipo === "categoria"
                  ? { tipo, categoria: categorias[0]?.[0] ?? "" }
                  : {
                      tipo,
                      productos: productos.slice(0, 6).map((p) => p.id),
                    },
          })
        }
      />

      {bloque.cuales.tipo === "categoria" ? (
        <Fichas
          etiqueta="Categoría"
          valor={bloque.cuales.categoria}
          opciones={categorias.map(([valor, etiqueta]) => ({
            valor,
            etiqueta,
          }))}
          alCambiar={(categoria) =>
            cambiar({ ...bloque, cuales: { tipo: "categoria", categoria } })
          }
        />
      ) : null}

      {elegidosAca ? (
        <fieldset className="min-w-0">
          <legend className={ETIQUETA}>Cuáles</legend>
          <ul className="mt-2 border-y border-tinta/15">
            {productos.map((producto) => {
              const marcado = elegidosAca.has(producto.id)
              return (
                <li
                  key={producto.id}
                  className="border-t border-tinta/15 first:border-t-0"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={marcado}
                    onClick={() =>
                      cambiar({
                        ...bloque,
                        cuales: {
                          tipo: "elegidos",
                          productos: marcado
                            ? [...elegidosAca].filter(
                                (id) => id !== producto.id
                              )
                            : [...elegidosAca, producto.id].slice(0, 60),
                        },
                      })
                    }
                    className="flex min-h-11 w-full items-center gap-3 text-left text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0 border-2",
                        marcado ? "border-tinta bg-tinta" : "border-tinta/40"
                      )}
                    />
                    <span className="truncate">{producto.nombre}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {productos.length === 0 ? (
            <button
              type="button"
              onClick={() => alIrA("productos")}
              className="mt-2 min-h-11 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Elige productos primero
            </button>
          ) : null}
        </fieldset>
      ) : null}

      <Contador
        etiqueta="Productos por hoja"
        valor={bloque.porPagina}
        minimo={1}
        maximo={24}
        detalle={
          hojas === 0
            ? "No ocupa hojas"
            : `${hojas} ${hojas === 1 ? "hoja" : "hojas"}`
        }
        alCambiar={(porPagina) => cambiar({ ...bloque, porPagina })}
      />

      <fieldset className="min-w-0">
        <legend className={ETIQUETA}>Qué se ve de cada producto</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(CAMPOS) as Campo[]).map((campo) => {
            const activo = bloque.campos[campo]
            return (
              <button
                key={campo}
                type="button"
                aria-pressed={activo}
                onClick={() =>
                  cambiar({
                    ...bloque,
                    campos: { ...bloque.campos, [campo]: !activo },
                  })
                }
                className={cn(
                  "flex min-h-11 items-center border px-3 text-sm font-semibold transition-colors",
                  activo
                    ? "border-tinta bg-tinta text-papel"
                    : "border-tinta/25 hover:border-tinta"
                )}
              >
                {CAMPOS[campo]}
              </button>
            )
          })}
        </div>
      </fieldset>
    </>
  )
}
