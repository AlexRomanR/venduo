"use client"

import * as React from "react"

import {
  filtrarCatalogo,
  leerFiltros,
  sugerenciasDelCarrito,
} from "@/lib/catalogo"
import {
  mensajeAlaVistaPrevia,
  type MensajeAlaVistaPrevia,
  type MensajeAlEditor,
} from "@/lib/editor/protocolo"
import { PLANTILLAS } from "@/lib/plantillas"
import {
  combinarApariencia,
  NOMBRES_DE_AJUSTE,
} from "@/lib/plantillas/apariencia"
import { relacionados } from "@/lib/plantillas/bloques"
import type {
  CategoriaPublica,
  MarcoDeTienda,
  TiendaPublica,
} from "@/lib/data/tienda-publica"
import { cn } from "@/lib/utils"
import type { Json, Product } from "@/types"
import { kitDePlantilla } from "@/components/plantillas"
import { EstiloDePlantilla } from "@/components/plantillas/estilo"
import { ANCLA_DE_COMPRA } from "@/components/tienda/agregar"
import { BarraDeCompra } from "@/components/tienda/barra-de-compra"
import {
  ProveedorCarrito,
  type LineaCarrito,
} from "@/components/tienda/carrito"
import type { ResultadoPedido } from "@/app/t/[slug]/acciones"
import { Checkout } from "@/components/tienda/checkout"

type Estado = Extract<MensajeAlaVistaPrevia, { tipo: "estado" }>

/** El color con el que el editor marca lo que se toca: la frambuesa de Venduo. */
const MARCA = "#d0216a"
/** Lo que no se edita desde acá se marca en tinta, no en frambuesa. */
const NEUTRO = "#1d1c1a"

const SIN_FILTROS = leerFiltros({})

/** Dónde se ve lo que no tiene una parte propia marcada en la plantilla. */
const DONDE_SE_VE: Array<[prefijo: string, selector: string]> = [
  ["logo", "header"],
  ["forma.", ".rounded-plantilla"],
]

/** Dónde estaba una parte, para mostrar el lugar cuando deja de existir. */
interface Recuerdo {
  arriba: number
  izquierda: number
  ancho: number
  alto: number
  fija: boolean
  /** Una barra fija que estaba escondida: al irse, no se la vio irse. */
  escondida: boolean
  nombre: string
}

const claveDeSeccion = (id: string) => `seccion:${id}`

function visibles(selector: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
    (elemento) => elemento.getClientRects().length > 0
  )
}

function aLaVista(elemento: HTMLElement) {
  const { top, bottom } = elemento.getBoundingClientRect()
  return bottom > 0 && top < window.innerHeight
}

/**
 * Si un tramo de la página se alcanza a ver, descontando la cabecera fija.
 *
 * Con esto se decide si hay que señalar: lo que cambia a la vista se ve solo,
 * y un recuadro encima no agrega nada. La marca es para lo que estaba afuera.
 */
function tramoALaVista(arriba: number, alto: number, techo: number) {
  const visible =
    Math.min(arriba + alto, window.innerHeight) - Math.max(arriba, techo)
  return visible >= Math.min(alto * 0.6, (window.innerHeight - techo) * 0.5)
}

function techoDeLaPagina() {
  const cabecera = document.querySelector(".vista-previa header")
  return Math.max(0, cabecera?.getBoundingClientRect().bottom ?? 0)
}

function seVe(elemento: HTMLElement) {
  const { top, height } = elemento.getBoundingClientRect()
  return tramoALaVista(
    top,
    height,
    elemento.closest("header") ? 0 : techoDeLaPagina()
  )
}

function movimiento(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth"
}

/** Lo que no entra en la pantalla se muestra desde su comienzo. */
function llevarA(elemento: Element) {
  const entra = elemento.getBoundingClientRect().height < window.innerHeight
  elemento.scrollIntoView({
    behavior: movimiento(),
    block: entra ? "center" : "start",
  })
}

/** La parte que muestra un ajuste: si hay varias, una que ya se vea. */
function loQueCambia(ruta: string): HTMLElement | null {
  const selector =
    DONDE_SE_VE.find(([prefijo]) => ruta.startsWith(prefijo))?.[1] ??
    `[data-ajuste~="${ruta}"]`
  const opciones = visibles(`.vista-previa ${selector}`)
  return opciones.find(seVe) ?? opciones[0] ?? null
}

/**
 * La barra de compra solo aparece cuando el botón de agregar no se ve: si se
 * ve, se mueve la página hasta sacarlo, o activarla no mostraría nada.
 * Devuelve si hizo falta moverla.
 */
function dejarVerLaBarra() {
  const boton = document.getElementById(ANCLA_DE_COMPRA)
  if (!boton || !aLaVista(boton)) return false
  const { top, height } = boton.getBoundingClientRect()
  const arriba = top + window.scrollY
  window.scrollTo({
    top:
      arriba > window.innerHeight
        ? arriba - window.innerHeight
        : arriba + height + 8,
    behavior: movimiento(),
  })
  return true
}

/**
 * Por dónde le llegan los mensajes a la vista previa y por dónde contesta.
 *
 * En el editor de la web es el `<iframe>`: escucha a su ventana madre. En la
 * app es `EditorDeLaApp`, en la misma página, que traduce lo que manda la app.
 */
export interface Puente {
  escuchar: (alRecibir: (mensaje: MensajeAlaVistaPrevia) => void) => () => void
  enviar: (mensaje: MensajeAlEditor) => void
}

const PUENTE_DEL_IFRAME: Puente = {
  escuchar(alRecibir) {
    function recibir(evento: MessageEvent) {
      if (
        evento.origin !== window.location.origin ||
        evento.source !== window.parent
      ) {
        return
      }
      const leido = mensajeAlaVistaPrevia.safeParse(evento.data)
      if (leido.success) alRecibir(leido.data)
    }
    window.addEventListener("message", recibir)
    return () => window.removeEventListener("message", recibir)
  },
  enviar(mensaje) {
    window.parent.postMessage(mensaje, window.location.origin)
  },
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

async function sinPedidos(): Promise<ResultadoPedido> {
  return {
    ok: false,
    error: "Es una vista previa: aquí no se crean pedidos.",
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
/** Las categorías de los productos de ejemplo, contadas como las reales. */
function categoriasDe(productos: Product[]): CategoriaPublica[] {
  const nombres = [...new Set(productos.map((p) => p.category ?? ""))].filter(
    Boolean
  )
  return nombres.map((nombre) => ({
    id: `ejemplo-${nombre}`,
    nombre,
    productos: productos.filter((p) => p.category === nombre).length,
  }))
}

export function VistaPrevia({
  tienda,
  muestra,
  ejemplos,
  puente = PUENTE_DEL_IFRAME,
}: {
  tienda: TiendaPublica
  muestra: LineaCarrito[]
  /** Para llenar catálogo, ficha y carrito de una tienda todavía sin productos. */
  ejemplos: Product[]
  /** Quién le habla. Sin decirlo, el editor de la web desde afuera del `<iframe>`. */
  puente?: Puente
}) {
  const [estado, setEstado] = React.useState<Estado | null>(null)
  const [destello, setDestello] = React.useState<string | null>(null)
  const [sobre, setSobre] = React.useState<string | null>(null)

  // Un pedido de enfocar puede llegar antes que la sección: una recién
  // agregada todavía no se dibujó. Se guarda y se cumple al dibujarla.
  const pendiente = React.useRef<string | null>(null)

  // Lo que se apaga o se oculta ya no está cuando llega el aviso: se anota
  // dónde estaba cada parte justo antes de dibujar el estado nuevo.
  const recuerdos = React.useRef(new Map<string, Recuerdo>())
  const pantallaRecordada = React.useRef<string | null>(null)
  const [fantasma, setFantasma] = React.useState<Recuerdo | null>(null)
  const marcoDelFantasma = React.useRef<HTMLDivElement>(null)

  const recordar = React.useCallback((mensaje: Estado) => {
    const pantalla = `${mensaje.vista}:${mensaje.productoId}`
    if (pantalla !== pantallaRecordada.current) {
      pantallaRecordada.current = pantalla
      recuerdos.current.clear()
      return
    }
    const vistas = new Set<string>()
    document
      .querySelectorAll<HTMLElement>("[data-seccion], [data-ajuste]")
      .forEach((elemento) => {
        const caja = elemento.getBoundingClientRect()
        if (!caja.width || !caja.height) return
        const { position } = window.getComputedStyle(elemento)
        const fija = position === "fixed" || position === "sticky"
        const claves = elemento.dataset.seccion
          ? [claveDeSeccion(elemento.dataset.seccion)]
          : (elemento.dataset.ajuste ?? "").split(" ")
        for (const clave of claves) {
          if (vistas.has(clave)) continue
          vistas.add(clave)
          recuerdos.current.set(clave, {
            arriba: fija
              ? Math.min(caja.top, window.innerHeight - caja.height)
              : caja.top + window.scrollY,
            izquierda: caja.left + (fija ? 0 : window.scrollX),
            ancho: caja.width,
            alto: caja.height,
            fija,
            escondida: fija && caja.top >= window.innerHeight - 1,
            nombre:
              elemento.dataset.nombre ??
              (NOMBRES_DE_AJUSTE as Record<string, string>)[clave] ??
              "",
          })
        }
      })
  }, [])

  const mostrarLoQuitado = React.useCallback((clave: string) => {
    const recuerdo = recuerdos.current.get(clave)
    if (!recuerdo) return false
    recuerdos.current.delete(clave)
    const estabaALaVista = recuerdo.fija
      ? !recuerdo.escondida
      : tramoALaVista(
          recuerdo.arriba - window.scrollY,
          recuerdo.alto,
          techoDeLaPagina()
        )
    if (!estabaALaVista) setFantasma(recuerdo)
    return true
  }, [])

  React.useEffect(() => {
    if (!fantasma) return
    if (marcoDelFantasma.current) llevarA(marcoDelFantasma.current)
    const reloj = window.setTimeout(() => setFantasma(null), 1900)
    return () => window.clearTimeout(reloj)
  }, [fantasma])

  const enfocar = React.useCallback(
    (id: string) => {
      const elemento = document.querySelector<HTMLElement>(selector(id))
      if (!elemento) {
        if (!mostrarLoQuitado(claveDeSeccion(id))) pendiente.current = id
        return
      }
      pendiente.current = null
      if (seVe(elemento)) return

      llevarA(elemento)
      setDestello(id)
      window.setTimeout(() => setDestello(null), 1700)
    },
    [mostrarLoQuitado]
  )

  // Lo que cambia un ajuste se busca un momento después: el mensaje llega
  // junto con el estado nuevo, y lo que señala puede aparecer recién con él.
  const senalado = React.useRef<HTMLElement | null>(null)
  const relojes = React.useRef<number[]>([])
  const senalar = React.useCallback(
    (ruta: string) => {
      relojes.current.forEach((reloj) => window.clearTimeout(reloj))
      senalado.current?.removeAttribute("data-senalado")
      relojes.current = [
        window.setTimeout(() => {
          const elemento = loQueCambia(ruta)
          if (!elemento) {
            if (!mostrarLoQuitado(ruta)) {
              puente.enviar({ tipo: "sin-senal", ruta })
            }
            return
          }
          if (ruta === "ficha.barraFija") {
            if (!dejarVerLaBarra()) return
          } else {
            if (seVe(elemento)) return
            llevarA(elemento)
          }

          elemento.setAttribute("data-senalado", "")
          senalado.current = elemento
          relojes.current.push(
            window.setTimeout(
              () => elemento.removeAttribute("data-senalado"),
              1700
            )
          )
        }, 260),
      ]
    },
    [puente, mostrarLoQuitado]
  )

  React.useEffect(() => {
    const dejar = puente.escuchar((mensaje) => {
      if (mensaje.tipo === "estado") {
        recordar(mensaje)
        setEstado(mensaje)
      } else if (mensaje.tipo === "senalar") senalar(mensaje.ruta)
      else enfocar(mensaje.seccion)
    })
    puente.enviar({ tipo: "lista" })
    return dejar
  }, [enfocar, senalar, recordar, puente])

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

  const vista = estado?.vista ?? "inicio"

  // Sin productos propios, todas las pantallas se llenan con los de ejemplo.
  // También la portada: sin ellos, sus vitrinas no dibujaban nada, y moverlas
  // o editarlas no cambiaba la vista previa. La foto de la portada sí sigue
  // siendo la real: `fotoDePortada` no toma la de un producto de ejemplo.
  const conEjemplos = actual.productos.length === 0
  const paraVista = React.useMemo<TiendaPublica>(
    () =>
      conEjemplos
        ? {
            ...actual,
            productos: ejemplos,
            categorias: categoriasDe(ejemplos),
            productosDeEjemplo: true,
          }
        : actual,
    [actual, conEjemplos, ejemplos]
  )

  const marco: MarcoDeTienda = {
    slug: paraVista.slug,
    nombre: paraVista.nombre,
    logoUrl: paraVista.logoUrl,
    whatsapp: paraVista.whatsapp,
    categorias: paraVista.categorias.filter((c) => c.productos > 0),
  }

  // Cambiar de pantalla empieza arriba, como en la tienda de verdad.
  React.useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [vista, estado?.productoId])

  const producto =
    paraVista.productos.find((p) => p.id === estado?.productoId) ??
    paraVista.productos.find((p) => p.image_url) ??
    paraVista.productos[0]

  const conBarra = vista === "producto" && paraVista.apariencia.ficha.barraFija

  const seleccion = estado?.seleccion ?? null
  const marcas = estado?.marcas ?? []

  // El toque selecciona; nada navega. Un enlace de la tienda llevaría al
  // editor a una pantalla que no es la que se está editando.
  function alTocar(evento: React.MouseEvent) {
    evento.preventDefault()
    evento.stopPropagation()
    const tocado = (evento.target as HTMLElement).closest<HTMLElement>(
      "[data-seccion], [data-fija]"
    )
    if (tocado?.dataset.seccion) {
      puente.enviar({ tipo: "seleccionar", seccion: tocado.dataset.seccion })
    } else if (tocado?.dataset.fija) {
      puente.enviar({
        tipo: "fija",
        nombre: tocado.dataset.fija,
        ayuda: tocado.dataset.ayuda ?? "",
      })
    } else {
      const enlace = (evento.target as HTMLElement).closest("a, button")
      if (enlace) {
        puente.enviar({
          tipo: "fija",
          nombre: (enlace.textContent ?? "").trim().slice(0, 80),
          ayuda: "En la vista previa los enlaces y botones no se abren.",
          navegacion: true,
        })
      }
    }
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
      puente.enviar({ tipo: "soltar-imagen", seccion, archivo })
    }
  }

  const reglas = [
    // Sin barra de desplazamiento: se ve como en un celular, y en el marco
    // redondeado de la computadora quedaba pegada al borde.
    `html{scrollbar-width:none}`,
    `html::-webkit-scrollbar{display:none}`,
    `[data-seccion]{cursor:pointer}`,
    `[data-seccion]:hover{outline:2px dashed ${MARCA}8c;outline-offset:-2px}`,
    `[data-seccion]::before{content:attr(data-nombre);position:absolute;top:10px;left:10px;z-index:45;display:none;padding:4px 8px;background:${MARCA};color:#fff;font:600 12px/1.2 var(--fuente-geist),sans-serif;letter-spacing:.08em;text-transform:uppercase;pointer-events:none}`,
    `[data-seccion]:hover::before{display:block}`,
    // Una sección que no dibuja nada no desaparece: queda un recuadro que dice
    // qué le falta, y se puede tocar y arrastrar como las demás.
    `[data-seccion]:empty{display:flex;align-items:center;justify-content:center;min-height:104px;margin:16px 20px;border:2px dashed ${MARCA}66;background:${MARCA}0d}`,
    `[data-seccion]:empty::after{content:attr(data-nombre) " · " attr(data-vacia);max-width:40ch;padding:0 16px;color:${MARCA};font:600 12px/1.45 var(--fuente-geist),sans-serif;text-align:center}`,
    // Lo que la plantilla dibuja por su cuenta se marca en tinta: se puede
    // tocar para saber de dónde sale, pero no se edita desde acá.
    `[data-fija]{cursor:help}`,
    `[data-fija]:hover{outline:2px dashed ${NEUTRO}59;outline-offset:-2px}`,
    `[data-fija]::before{content:attr(data-fija) " · viene con la plantilla";position:absolute;top:10px;left:10px;z-index:45;display:none;padding:4px 8px;background:${NEUTRO};color:#fff;font:600 12px/1.2 var(--fuente-geist),sans-serif;letter-spacing:.08em;text-transform:uppercase;pointer-events:none}`,
    `[data-fija]:hover::before{display:block}`,
    // Sin cursor no hay cómo descubrir que las secciones se tocan.
    ...(estado?.conPistas
      ? [`@media (hover:none){[data-seccion]::before{display:block}}`]
      : []),
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
      ? [
          `${marcada(destello)}{outline:3px solid ${MARCA};outline-offset:-3px;animation:vp-destello .8s ease-out 2}`,
        ]
      : []),
    ...marcas.map(
      (id) =>
        `${marcada(id)}{outline:3px solid ${MARCA};outline-offset:-3px;animation:vp-destello 1.6s ease-out 2}`
    ),
    // Para que la cabecera fija no tape el comienzo de lo que se señala.
    `[data-seccion],[data-ajuste]{scroll-margin-top:72px}`,
    `[data-senalado]{outline:3px solid ${MARCA};outline-offset:-3px;animation:vp-destello .8s ease-out 2}`,
    `@keyframes vp-destello{0%,100%{outline-color:${MARCA}}50%{outline-color:transparent}}`,
    // Los colores nuevos se derraman sobre la tienda en vez de saltar: es lo
    // que hace sentir que el cambio es de verdad y no otra pantalla.
    `@media (prefers-reduced-motion:no-preference){.vista-previa *{transition:background-color .35s ease,color .35s ease,border-color .35s ease,fill .35s ease}}`,
    `@media (prefers-reduced-motion:reduce){[data-seccion],[data-senalado]{animation:none!important}}`,
  ].join("\n")

  return (
    // El carrito de muestra, solo en su paso: en la portada de una tienda
    // nueva, un "2" en el ícono del carrito confundía. La clave lo rearma al
    // entrar y al salir del carrito.
    <ProveedorCarrito
      key={vista === "carrito" ? "con-muestra" : "vacio"}
      slug={tienda.slug}
      muestra={vista === "carrito" ? muestra : []}
    >
      <EstiloDePlantilla apariencia={actual.apariencia} />
      <style dangerouslySetInnerHTML={{ __html: reglas }} />

      {fantasma ? (
        <div
          ref={marcoDelFantasma}
          aria-hidden="true"
          className="pointer-events-none z-50"
          style={{
            position: fantasma.fija ? "fixed" : "absolute",
            top: fantasma.arriba,
            left: fantasma.izquierda,
            width: fantasma.ancho,
            height: Math.min(fantasma.alto, 120),
            outline: `3px dashed ${MARCA}`,
            outlineOffset: -3,
            background: `${MARCA}14`,
          }}
        >
          <span
            className="absolute top-2.5 left-2.5 px-2 py-1 text-xs leading-tight font-semibold tracking-[0.08em] text-white uppercase"
            style={{
              background: MARCA,
              fontFamily: "var(--fuente-geist), sans-serif",
            }}
          >
            Ya no se ve{fantasma.nombre ? ` · ${fantasma.nombre}` : ""}
          </span>
        </div>
      ) : null}

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
        <kit.Cabecera marco={marco} enlaceDelCarrito={vista !== "carrito"} />

        <main className="flex-1">
          {vista === "inicio" ? (
            <kit.Inicio tienda={paraVista} filtros={SIN_FILTROS} />
          ) : null}

          {vista === "catalogo" ? (
            <kit.Catalogo
              tienda={paraVista}
              filtros={SIN_FILTROS}
              productos={filtrarCatalogo(paraVista.productos, SIN_FILTROS)}
            />
          ) : null}

          {vista === "producto" ? (
            producto ? (
              <kit.Ficha
                tienda={paraVista}
                producto={producto}
                relacionados={relacionados(producto, paraVista.productos)}
              />
            ) : (
              <div className="mx-auto w-full max-w-6xl px-5 py-12">
                <kit.Vacio
                  titulo="Todavía no hay productos"
                  texto="Cuando cargues tu primer producto, vas a ver aquí cómo queda su ficha."
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
                  whatsapp={actual.whatsapp}
                  demo={actual.esDemo}
                  crear={sinPedidos}
                  opciones={actual.apariencia.carrito}
                  sugeridos={sugerenciasDelCarrito(paraVista.productos)}
                />
              </div>
            </div>
          ) : null}
        </main>

        {/* Sin la barra flotante del carrito: en una vista previa chica tapaba
            justo lo que se está editando. El contador de la cabecera queda.
            La barra de compra sí va, si la tienda la eligió: es parte de
            cómo se ve su ficha. */}
        <kit.Pie marco={marco} />
        {conBarra && producto ? (
          <BarraDeCompra producto={producto} slug={actual.slug} />
        ) : null}

        {conEjemplos ? (
          <p
            className={cn(
              "pointer-events-none fixed inset-x-0 z-50 mx-auto w-fit rounded-full px-2.5 py-1 text-xs font-semibold tracking-[0.04em] text-white sm:px-3 sm:py-1.5",
              conBarra ? "bottom-[5.5rem] md:bottom-3" : "bottom-2 sm:bottom-3"
            )}
            style={{
              background: MARCA,
              fontFamily: "var(--fuente-geist), sans-serif",
            }}
          >
            Productos de ejemplo
          </p>
        ) : null}
      </div>
    </ProveedorCarrito>
  )
}
