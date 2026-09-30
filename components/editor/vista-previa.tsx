"use client"

import * as React from "react"

import { filtrarCatalogo, leerFiltros } from "@/lib/catalogo"
import {
  mensajeAlaVistaPrevia,
  type MensajeAlaVistaPrevia,
  type MensajeAlEditor,
} from "@/lib/editor/protocolo"
import { PLANTILLAS } from "@/lib/plantillas"
import { combinarApariencia } from "@/lib/plantillas/apariencia"
import { relacionados } from "@/lib/plantillas/bloques"
import type { MarcoDeTienda, TiendaPublica } from "@/lib/data/tienda-publica"
import type { Json } from "@/types"
import { kitDePlantilla } from "@/components/plantillas"
import { EstiloDePlantilla } from "@/components/plantillas/estilo"
import {
  ProveedorCarrito,
  type LineaCarrito,
} from "@/components/tienda/carrito"
import { Checkout } from "@/components/tienda/checkout"

type Estado = Extract<MensajeAlaVistaPrevia, { tipo: "estado" }>

/** El color con el que el editor marca lo que se toca: el rojo de Venduo. */
const MARCA = "#d62d12"

const SIN_FILTROS = leerFiltros({})

function enviar(mensaje: MensajeAlEditor) {
  window.parent.postMessage(mensaje, window.location.origin)
}

function selector(id: string) {
  const seguro = typeof CSS !== "undefined" ? CSS.escape(id) : id
  return `[data-seccion="${seguro}"]`
}

/**
 * El mismo selector con más peso que `[data-seccion]:hover`: en un celular,
 * tocar es también pasar el cursor, y el borde punteado le ganaba al de
 * "seleccionada".
 */
function marcada(id: string) {
  return `[data-seccion]${selector(id)}`
}

async function sinPedidos() {
  return {
    ok: false,
    error: "Es una vista previa: acá no se crean pedidos.",
  }
}

/**
 * La tienda tal como la va a ver el comprador, dentro del editor.
 *
 * Vive en un `<iframe>` y dibuja con el kit de la plantilla lo mismo que la
 * tienda pública, pero con el borrador que le manda el editor en vez de lo
 * publicado. Nada acá navega ni crea pedidos: un toque sobre una sección la
 * selecciona para editarla, y una foto que se suelta encima se usa en ella.
 */
export function VistaPrevia({
  tienda,
  muestra,
}: {
  tienda: TiendaPublica
  muestra: LineaCarrito[]
}) {
  const [estado, setEstado] = React.useState<Estado | null>(null)
  const [destello, setDestello] = React.useState<string | null>(null)
  const [sobre, setSobre] = React.useState<string | null>(null)

  // Un pedido de enfocar puede llegar antes que la sección: una recién
  // agregada todavía no se dibujó. Se guarda y se cumple al dibujarla.
  const pendiente = React.useRef<string | null>(null)

  const enfocar = React.useCallback((id: string) => {
    const elemento = document.querySelector(selector(id))
    if (!elemento) {
      pendiente.current = id
      return
    }
    pendiente.current = null

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    elemento.scrollIntoView({
      behavior: quieto ? "auto" : "smooth",
      block: "center",
    })
    setDestello(id)
    window.setTimeout(() => setDestello(null), 1400)
  }, [])

  React.useEffect(() => {
    function recibir(evento: MessageEvent) {
      if (
        evento.origin !== window.location.origin ||
        evento.source !== window.parent
      ) {
        return
      }
      const leido = mensajeAlaVistaPrevia.safeParse(evento.data)
      if (!leido.success) return

      if (leido.data.tipo === "estado") setEstado(leido.data)
      else enfocar(leido.data.seccion)
    }

    window.addEventListener("message", recibir)
    enviar({ tipo: "lista" })
    return () => window.removeEventListener("message", recibir)
  }, [enfocar])

  React.useEffect(() => {
    if (pendiente.current) enfocar(pendiente.current)
  }, [estado, enfocar])

  const borrador = estado?.borrador
  const plantilla = tienda.plantilla
  const kit = kitDePlantilla(plantilla)

  const actual = React.useMemo<TiendaPublica>(() => {
    if (!borrador) return tienda
    return {
      ...tienda,
      apariencia: combinarApariencia(
        PLANTILLAS[plantilla].apariencia,
        borrador.personalizacion
      ),
      logoUrl: borrador.logoUrl,
      bloques: borrador.secciones
        .filter((seccion) => seccion.visible)
        .map((seccion) => ({
          id: seccion.id,
          tipo: seccion.tipo,
          props: seccion.props as Record<string, Json | undefined>,
        })),
    }
  }, [borrador, plantilla, tienda])

  const marco: MarcoDeTienda = {
    slug: actual.slug,
    nombre: actual.nombre,
    logoUrl: actual.logoUrl,
    whatsapp: actual.whatsapp,
    categorias: actual.categorias.filter((c) => c.productos > 0),
  }

  const vista = estado?.vista ?? "inicio"

  // Cambiar de pantalla empieza arriba, como en la tienda de verdad.
  React.useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [vista, estado?.productoId])

  const producto =
    actual.productos.find((p) => p.id === estado?.productoId) ??
    actual.productos.find((p) => p.image_url) ??
    actual.productos[0]

  const seleccion = estado?.seleccion ?? null
  const marcas = estado?.marcas ?? []

  // El toque selecciona; nada navega. Un enlace de la tienda llevaría al
  // editor a una pantalla que no es la que se está editando.
  function alTocar(evento: React.MouseEvent) {
    evento.preventDefault()
    evento.stopPropagation()
    const seccion = (evento.target as HTMLElement).closest<HTMLElement>(
      "[data-seccion]"
    )?.dataset.seccion
    if (seccion) enviar({ tipo: "seleccionar", seccion })
  }

  function seccionBajo(evento: React.DragEvent) {
    return (
      (evento.target as HTMLElement).closest<HTMLElement>("[data-seccion]")
        ?.dataset.seccion ?? null
    )
  }

  function alArrastrar(evento: React.DragEvent) {
    if (!evento.dataTransfer.types.includes("Files")) return
    evento.preventDefault()
    evento.dataTransfer.dropEffect = "copy"
    setSobre(seccionBajo(evento))
  }

  function alSoltar(evento: React.DragEvent) {
    if (!evento.dataTransfer.types.includes("Files")) return
    evento.preventDefault()
    const seccion = seccionBajo(evento)
    const archivo = evento.dataTransfer.files[0]
    setSobre(null)
    if (seccion && archivo) {
      enviar({ tipo: "soltar-imagen", seccion, archivo })
    }
  }

  const reglas = [
    `[data-seccion]{cursor:pointer}`,
    `[data-seccion]:hover{outline:2px dashed ${MARCA}8c;outline-offset:-2px}`,
    `[data-seccion]::before{content:attr(data-nombre);position:absolute;top:10px;left:10px;z-index:45;display:none;padding:4px 8px;background:${MARCA};color:#fff;font:600 11px/1.2 var(--fuente-geist),sans-serif;letter-spacing:.08em;text-transform:uppercase;pointer-events:none}`,
    `[data-seccion]:hover::before{display:block}`,
    ...(seleccion
      ? [
          `${marcada(seleccion)}{outline:3px solid ${MARCA};outline-offset:-3px}`,
          `${marcada(seleccion)}::before{display:block}`,
        ]
      : []),
    ...(sobre
      ? [
          `${marcada(sobre)}{outline:3px dashed ${MARCA};outline-offset:-3px}`,
          `${marcada(sobre)}::before{display:block;content:"Suelta para usar esta foto"}`,
        ]
      : []),
    ...(destello
      ? [`${marcada(destello)}{animation:vp-destello 1.4s ease-out}`]
      : []),
    ...marcas.map(
      (id) =>
        `${marcada(id)}{outline:3px solid ${MARCA};outline-offset:-3px;animation:vp-destello 1.6s ease-out 2}`
    ),
    `@keyframes vp-destello{0%,100%{outline-color:${MARCA}}50%{outline-color:transparent}}`,
    // Los colores nuevos se derraman sobre la tienda en vez de saltar: es lo
    // que hace sentir que el cambio es de verdad y no otra pantalla.
    `@media (prefers-reduced-motion:no-preference){.vista-previa *{transition:background-color .35s ease,color .35s ease,border-color .35s ease,fill .35s ease}}`,
    `@media (prefers-reduced-motion:reduce){[data-seccion]{animation:none!important}}`,
  ].join("\n")

  return (
    <ProveedorCarrito slug={tienda.slug} muestra={muestra}>
      <EstiloDePlantilla apariencia={actual.apariencia} />
      <style dangerouslySetInnerHTML={{ __html: reglas }} />

      <div
        data-plantilla={plantilla}
        className="vista-previa flex min-h-screen flex-col bg-papel text-tinta"
        onClickCapture={alTocar}
        onSubmitCapture={(evento) => {
          evento.preventDefault()
          evento.stopPropagation()
        }}
        onDragOverCapture={alArrastrar}
        onDragLeave={(evento) => {
          if (evento.currentTarget === evento.target) setSobre(null)
        }}
        onDropCapture={alSoltar}
      >
        <kit.Cabecera
          marco={marco}
          referido={null}
          codigo={null}
          enlaceDelCarrito={vista !== "carrito"}
        />

        <main className="flex-1">
          {vista === "inicio" ? (
            <kit.Inicio tienda={actual} codigo={null} filtros={SIN_FILTROS} />
          ) : null}

          {vista === "catalogo" ? (
            <kit.Catalogo
              tienda={actual}
              codigo={null}
              filtros={SIN_FILTROS}
              productos={filtrarCatalogo(actual.productos, SIN_FILTROS)}
            />
          ) : null}

          {vista === "producto" ? (
            producto ? (
              <kit.Ficha
                tienda={actual}
                producto={producto}
                codigo={null}
                relacionados={relacionados(producto, actual.productos)}
              />
            ) : (
              <div className="mx-auto w-full max-w-6xl px-5 py-12">
                <kit.Vacio
                  titulo="Todavía no hay productos"
                  texto="Cuando cargues tu primer producto, vas a ver acá cómo queda su ficha."
                />
              </div>
            )
          ) : null}

          {vista === "carrito" ? (
            <div className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
              <kit.Encabezado titulo="Tu pedido" />
              <div className="mt-10">
                <Checkout
                  slug={actual.slug}
                  nombreTienda={actual.nombre}
                  crear={sinPedidos}
                />
              </div>
            </div>
          ) : null}
        </main>

        {/* Sin la barra flotante del carrito: en una vista previa chica tapaba
            justo lo que se está editando. El contador de la cabecera queda. */}
        <kit.Pie marco={marco} codigo={null} />
      </div>
    </ProveedorCarrito>
  )
}
