"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ExternalLink, Redo2, Send, Undo2, X } from "lucide-react"
import { toast } from "sonner"

import type {
  ResultadoDePropuesta,
  ResultadoDePublicar,
} from "@/app/editor/acciones"
import { ErrorDeImagen, subirImagen } from "@/lib/editor/imagenes"
import type { ClaveDePaso } from "@/lib/editor/pasos"
import type {
  EstadoParaLaVistaPrevia,
  MensajeAlEditor,
  Vista,
} from "@/lib/editor/protocolo"
import {
  combinarApariencia,
  type TokenDeColor,
} from "@/lib/plantillas/apariencia"
import {
  aplicarOperaciones,
  contextoDeDiseno,
  describirOperacion,
  type Borrador,
  type Operacion,
} from "@/lib/plantillas/borrador"
import { SECCIONES } from "@/lib/plantillas/secciones"
import { cn } from "@/lib/utils"
import type { DisenoParaEditar } from "@/lib/data/editor"
import { Asistente } from "@/components/editor/asistente"
import { Bienvenida, Recuperar } from "@/components/editor/avisos"
import {
  ProveedorDelEditor,
  useEditor,
  type Dispositivo,
  type Propuesta,
  type ValorDelEditor,
} from "@/components/editor/contexto"
import { useBorrador } from "@/components/editor/estado"
import { MarcoDeVistaPrevia } from "@/components/editor/marco"
import { PasoCarrito } from "@/components/editor/paso-carrito"
import { PasoCatalogo } from "@/components/editor/paso-catalogo"
import { PasoMarca } from "@/components/editor/paso-marca"
import { PasoPortada } from "@/components/editor/paso-portada"
import { PasoProducto } from "@/components/editor/paso-producto"
import { PasoPublicar } from "@/components/editor/paso-publicar"
import {
  BarraDePasos,
  pasoDe,
  PASOS,
  PestanasDePasos,
} from "@/components/editor/pasos"
import { MENSAJE_SIN_RESPUESTA } from "@/lib/ai/mensajes"

function distinto(a: unknown, b: unknown) {
  return JSON.stringify(a) !== JSON.stringify(b)
}

/** Las secciones que toca una propuesta: las que cambia y las que agrega. */
function seccionesTocadas(
  antes: Borrador,
  despues: Borrador,
  operaciones: Operacion[]
): string[] {
  const nuevas = despues.secciones
    .map((seccion) => seccion.id)
    .filter((id) => !antes.secciones.some((s) => s.id === id))
  const cambiadas = operaciones.flatMap((operacion) =>
    "seccion" in operacion && operacion.op !== "quitar"
      ? [operacion.seccion]
      : []
  )
  return [...new Set([...nuevas, ...cambiadas])]
}

/** Qué ajustes de la apariencia se ven en qué pantalla de la tienda. */
const VISTA_DE_AJUSTE: Array<[prefijo: string, vista: Vista]> = [
  ["disposicion.", "catalogo"],
  ["ficha.", "producto"],
  ["carrito.", "carrito"],
]

/** En qué pantalla de la tienda se ve mejor lo que cambia una propuesta. */
function vistaDeLaPropuesta(operaciones: Operacion[]): Vista | null {
  if (
    operaciones.some(
      (operacion) => "seccion" in operacion || operacion.op === "agregar"
    )
  ) {
    return "inicio"
  }
  const rutas = operaciones.flatMap((operacion) =>
    "ruta" in operacion ? [operacion.ruta] : []
  )
  if (rutas.length === 0 || rutas.length < operaciones.length) return null
  const lugar = VISTA_DE_AJUSTE.find(([prefijo]) =>
    rutas.every((ruta) => ruta.startsWith(prefijo))
  )
  return lugar?.[1] ?? null
}

/**
 * El editor de la tienda.
 *
 * Una sola pantalla con tres zonas: los pasos, los controles del paso y la
 * tienda de verdad en la vista previa. En la computadora van lado a lado; en
 * el celular la vista previa ocupa arriba, los controles se pliegan debajo y
 * los pasos quedan abajo, al alcance del pulgar. Cada zona existe una sola vez
 * y el CSS la ubica: con dos copias del panel, una escondida, cada control
 * existiría dos veces.
 */
export function Editor({
  diseno,
  pasoInicial,
  bienvenida,
  publicar,
  proponer,
  decidir,
  iaDemo,
}: {
  diseno: DisenoParaEditar
  pasoInicial: ClaveDePaso
  bienvenida: boolean
  publicar: (borrador: Borrador) => Promise<ResultadoDePublicar>
  proponer: (entrada: {
    pedido: string
    borrador: Borrador
  }) => Promise<ResultadoDePropuesta>
  decidir: (entrada: { id: string; aplicada: boolean }) => Promise<void>
  iaDemo: boolean
}) {
  const contexto = React.useMemo(
    () => contextoDeDiseno(diseno.base, diseno.datos),
    [diseno.base, diseno.datos]
  )
  const borrador = useBorrador(diseno.publicado, contexto, diseno.tienda.id)

  const [paso, setPaso] = React.useState<ClaveDePaso>(pasoInicial)
  const [seleccion, setSeleccion] = React.useState<string | null>(null)
  const [enfoque, setEnfoque] = React.useState<{
    seccion: string
    vez: number
  } | null>(null)
  const [productoId, setProductoId] = React.useState<string | null>(
    diseno.productos.find((p) => p.foto)?.id ?? diseno.productos[0]?.id ?? null
  )
  const [vistaForzada, setVistaForzada] = React.useState<Vista | null>(null)
  const [comparar, setComparar] = React.useState<"antes" | "despues">("despues")
  const [dispositivo, setDispositivo] = React.useState<Dispositivo>("celular")
  const [propuesta, setPropuesta] = React.useState<Propuesta | null>(null)
  const [ultimoColor, setUltimoColor] = React.useState<TokenDeColor | null>(
    null
  )
  const [panelAbierto, setPanelAbierto] = React.useState(true)
  const panel = React.useRef<HTMLDivElement>(null)
  const [conBienvenida, setConBienvenida] = React.useState(bienvenida)
  const [cargandoIa, setCargandoIa] = React.useState(false)
  const [ultimoPedido, setUltimoPedido] = React.useState("")
  const [errorIa, setErrorIa] = React.useState<string | null>(null)
  const [mirandoAntes, setMirandoAntes] = React.useState(false)

  // El borrador de este momento, para lo que llega de forma asíncrona: la
  // persona pudo seguir editando mientras la IA pensaba.
  const presente = React.useRef(borrador.presente)
  React.useEffect(() => {
    presente.current = borrador.presente
  })

  const apariencia = React.useMemo(
    () => combinarApariencia(diseno.base, borrador.presente.personalizacion),
    [diseno.base, borrador.presente.personalizacion]
  )

  const irAPaso = React.useCallback((siguiente: ClaveDePaso) => {
    setPaso(siguiente)
    setVistaForzada(null)
    setPanelAbierto(true)
    // Quien ya se movió de paso empezó: la bienvenida solo estorba.
    setConBienvenida(false)
  }, [])

  const seleccionar = React.useCallback(
    (id: string | null, opciones: { enfocar?: boolean } = {}) => {
      setSeleccion(id)
      if (id && opciones.enfocar) {
        setEnfoque((previo) => ({ seccion: id, vez: (previo?.vez ?? 0) + 1 }))
      }
    },
    []
  )

  // Cada paso empieza arriba: seguir a media altura del anterior dejaba el
  // título del paso nuevo fuera de la vista.
  React.useEffect(() => {
    panel.current?.scrollTo({ top: 0 })
  }, [paso])

  // El paso queda en la dirección: recargar no devuelve al principio.
  React.useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("paso", paso)
    url.searchParams.delete("bienvenida")
    window.history.replaceState(null, "", url)
  }, [paso])

  // Deshacer y rehacer con el teclado, salvo dentro de un campo de texto,
  // donde esas teclas son del campo.
  React.useEffect(() => {
    function tecla(evento: KeyboardEvent) {
      const objetivo = evento.target as HTMLElement | null
      if (objetivo?.closest("input, textarea, select, [contenteditable]")) {
        return
      }
      if (!(evento.metaKey || evento.ctrlKey)) return
      const letra = evento.key.toLowerCase()
      if (letra === "z" && !evento.shiftKey) {
        evento.preventDefault()
        borrador.deshacer()
      } else if ((letra === "z" && evento.shiftKey) || letra === "y") {
        evento.preventDefault()
        borrador.rehacer()
      }
    }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [borrador])

  const soltarImagen = React.useCallback(
    async (id: string, archivo: File) => {
      const seccion = borrador.presente.secciones.find((s) => s.id === id)
      const campo = seccion
        ? SECCIONES[seccion.tipo].campos.find((c) => c.tipo === "imagen")
        : undefined

      if (!seccion || !campo) {
        toast.error("Esa sección no lleva foto.", {
          description: "Suéltala sobre la portada o sobre «Sobre el negocio».",
        })
        return
      }
      if (diseno.esDemo) {
        toast.error("En modo demo no se suben imágenes.")
        return
      }

      setSeleccion(id)
      setPaso("portada")
      const aviso = toast.loading("Subiendo la foto…")
      try {
        const url = await subirImagen(diseno.tienda.id, "imagenes", archivo)
        const resultado = borrador.aplicar([
          { op: "editar", seccion: id, props: { [campo.clave]: url } },
        ])
        if (resultado.ok) {
          toast.success(`Foto nueva en «${SECCIONES[seccion.tipo].nombre}».`, {
            id: aviso,
          })
        } else {
          toast.error(resultado.errores[0], { id: aviso })
        }
      } catch (error) {
        toast.error(
          error instanceof ErrorDeImagen
            ? error.message
            : "No pudimos subir la foto.",
          { id: aviso }
        )
      }
    },
    [borrador, diseno.esDemo, diseno.tienda.id]
  )

  const alMensaje = React.useCallback(
    (mensaje: MensajeAlEditor) => {
      if (mensaje.tipo === "seleccionar") {
        setSeleccion(mensaje.seccion)
        setPaso("portada")
        setVistaForzada(null)
        setPanelAbierto(true)
      } else if (mensaje.tipo === "fija") {
        toast(`«${mensaje.nombre}» viene con tu plantilla`, {
          id: "parte-fija",
          description: mensaje.ayuda || undefined,
        })
      } else if (mensaje.tipo === "soltar-imagen") {
        void soltarImagen(mensaje.seccion, mensaje.archivo)
      }
    },
    [soltarImagen]
  )

  const pedirALaIa = React.useCallback(
    async (pedido: string) => {
      const limpio = pedido.trim()
      if (limpio.length < 3) return

      setUltimoPedido(limpio)
      setCargandoIa(true)
      setErrorIa(null)
      setPropuesta(null)
      setMirandoAntes(false)

      // Si la plataforma corta la función, la acción no devuelve nada: lanza.
      // Sin esto la barra se quedaba en "pensando" para siempre.
      const resultado = await proponer({
        pedido: limpio,
        borrador: presente.current,
      }).catch(() => ({ ok: false as const, error: MENSAJE_SIN_RESPUESTA }))
      setCargandoIa(false)

      if (!resultado.ok) {
        setErrorIa(resultado.error)
        return
      }

      // Se aplica sobre el borrador de ahora y no sobre el que se mandó. Si
      // ya no encaja, se dice en vez de pisar lo que la persona hizo.
      const antes = presente.current
      const aplicado = aplicarOperaciones(
        antes,
        resultado.operaciones,
        contexto,
        { exigirContraste: true }
      )
      if (!aplicado.ok) {
        setErrorIa(
          "Cambiaste algo mientras la IA pensaba y su propuesta ya no encaja. Pídeselo de nuevo."
        )
        if (resultado.id) void decidir({ id: resultado.id, aplicada: false })
        return
      }

      setPropuesta({
        id: resultado.id,
        resumen: resultado.resumen,
        aviso: resultado.aviso,
        operaciones: resultado.operaciones,
        // El tono al pasar el cursor sale solo del de los botones.
        cambios: resultado.operaciones
          .filter(
            (operacion) =>
              !("ruta" in operacion && operacion.ruta === "colores.senalAlta")
          )
          .map((operacion) => ({
            texto: describirOperacion(operacion, antes),
            color:
              operacion.op === "apariencia" &&
              operacion.ruta.startsWith("colores.") &&
              typeof operacion.valor === "string"
                ? operacion.valor
                : undefined,
          })),
        borrador: aplicado.borrador,
        marcas: seccionesTocadas(
          antes,
          aplicado.borrador,
          resultado.operaciones
        ),
      })

      const lugar = vistaDeLaPropuesta(resultado.operaciones)
      if (lugar) setVistaForzada(lugar)
      setPanelAbierto(true)
    },
    [proponer, decidir, contexto]
  )

  const aplicarPropuesta = React.useCallback(() => {
    if (!propuesta) return
    borrador.poner(propuesta.borrador)
    if (propuesta.id) void decidir({ id: propuesta.id, aplicada: true })
    setPropuesta(null)
    setMirandoAntes(false)
    toast.success("Listo, ya está en tu borrador.", {
      description: "Si no te convence, deshazlo.",
      action: { label: "Deshacer", onClick: () => borrador.deshacer() },
    })
  }, [propuesta, borrador, decidir])

  const descartarPropuesta = React.useCallback(() => {
    if (propuesta?.id) void decidir({ id: propuesta.id, aplicada: false })
    setPropuesta(null)
    setMirandoAntes(false)
    setVistaForzada(null)
  }, [propuesta, decidir])

  const conCambios = React.useMemo(() => {
    const pasos = new Set<ClaveDePaso>()
    const a = borrador.presente
    const b = borrador.publicado
    if (
      distinto(a.personalizacion.colores, b.personalizacion.colores) ||
      distinto(a.personalizacion.tipografia, b.personalizacion.tipografia) ||
      distinto(a.personalizacion.forma, b.personalizacion.forma) ||
      a.logoUrl !== b.logoUrl
    ) {
      pasos.add("marca")
    }
    if (distinto(a.secciones, b.secciones)) pasos.add("portada")
    if (
      distinto(a.personalizacion.disposicion, b.personalizacion.disposicion)
    ) {
      pasos.add("catalogo")
    }
    if (distinto(a.personalizacion.ficha, b.personalizacion.ficha)) {
      pasos.add("producto")
    }
    if (distinto(a.personalizacion.carrito, b.personalizacion.carrito)) {
      pasos.add("carrito")
    }
    return pasos
  }, [borrador.presente, borrador.publicado])

  const visible =
    propuesta && !mirandoAntes
      ? propuesta.borrador
      : paso === "publicar" && comparar === "antes"
        ? borrador.publicado
        : borrador.presente

  const vista = vistaForzada ?? pasoDe(paso).vista

  const estadoDeLaVista = React.useMemo<EstadoParaLaVistaPrevia>(
    () => ({
      tipo: "estado",
      borrador: visible,
      vista,
      productoId,
      seleccion: paso === "portada" ? seleccion : null,
      marcas: propuesta && !mirandoAntes ? propuesta.marcas : [],
    }),
    [visible, vista, productoId, seleccion, paso, propuesta, mirandoAntes]
  )

  const valor: ValorDelEditor = {
    tienda: diseno.tienda,
    base: diseno.base,
    datos: diseno.datos,
    productos: diseno.productos,
    esDemo: diseno.esDemo,
    contexto,
    borrador,
    apariencia,
    paso,
    irAPaso,
    seleccion,
    seleccionar,
    productoId,
    setProductoId,
    vistaForzada,
    setVistaForzada,
    comparar,
    setComparar,
    dispositivo,
    setDispositivo,
    propuesta,
    setPropuesta,
    acciones: { publicar, proponer, decidir },
    ia: {
      pedir: (pedido: string) => void pedirALaIa(pedido),
      pedido: ultimoPedido,
      cargando: cargandoIa,
      error: errorIa,
      demo: iaDemo,
      aplicar: aplicarPropuesta,
      descartar: descartarPropuesta,
      mirandoAntes,
      setMirandoAntes,
    },
    ultimoColor,
    setUltimoColor,
  }

  const actual = pasoDe(paso)
  const numero = PASOS.indexOf(actual) + 1

  return (
    <ProveedorDelEditor value={valor}>
      {/* Una columna de `minmax(0,1fr)` en el celular: sin ella, la columna
          implícita crecía hasta el contenido más ancho y la pantalla entera
          se desbordaba a los costados. */}
      <div className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden bg-papel text-tinta lg:grid-cols-[26rem_minmax(0,1fr)] lg:grid-rows-[auto_auto_minmax(0,1fr)]">
        <BarraDelEditor />

        <div className="hidden lg:col-span-2 lg:row-start-2 lg:block">
          <BarraDePasos
            actual={paso}
            conCambios={conCambios}
            alElegir={irAPaso}
          />
        </div>

        <main className="row-start-2 min-h-0 lg:col-start-2 lg:row-start-3">
          <MarcoDeVistaPrevia
            estado={estadoDeLaVista}
            enfoque={enfoque}
            alMensaje={alMensaje}
            dispositivo={dispositivo}
            setDispositivo={setDispositivo}
          />
        </main>

        <section
          aria-label={`Paso ${numero}: ${actual.nombre}`}
          className={cn(
            "row-start-3 flex min-h-0 flex-col border-t border-tinta/15 bg-papel lg:col-start-1 lg:row-start-3 lg:border-t-0 lg:border-r",
            panelAbierto ? "max-h-[44svh] lg:max-h-none" : ""
          )}
        >
          <button
            type="button"
            onClick={() => setPanelAbierto((abierto) => !abierto)}
            aria-expanded={panelAbierto}
            className="flex min-h-11 items-center justify-between gap-3 border-b border-tinta/15 px-5 text-left lg:hidden"
          >
            <span className="text-sm">
              <span className="tabular mr-2 text-xs font-semibold text-senal">
                {String(numero).padStart(2, "0")}
              </span>
              <span className="font-semibold">{actual.nombre}</span>
              <span className="ml-2 text-xs opacity-55">
                {panelAbierto ? "Ocultar controles" : "Mostrar controles"}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-5 transition-transform duration-300 motion-reduce:transition-none",
                panelAbierto ? "" : "rotate-180"
              )}
            />
          </button>

          <div
            ref={panel}
            className={cn(
              // `relative`: los campos de archivo ocultos son absolutos, y sin
              // un ancestro posicionado se escapaban del panel y estiraban la
              // página entera.
              "relative min-h-0 flex-1 overflow-y-auto overscroll-contain",
              !panelAbierto && "hidden lg:block"
            )}
          >
            <Recuperar />
            {conBienvenida ? (
              <Bienvenida alEmpezar={() => setConBienvenida(false)} />
            ) : null}
            <div
              key={paso}
              className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              {paso === "marca" ? <PasoMarca /> : null}
              {paso === "portada" ? <PasoPortada /> : null}
              {paso === "catalogo" ? <PasoCatalogo /> : null}
              {paso === "producto" ? <PasoProducto /> : null}
              {paso === "carrito" ? <PasoCarrito /> : null}
              {paso === "publicar" ? <PasoPublicar /> : null}
            </div>
          </div>

          {/* Fuera del desplazamiento: la IA queda a mano en todos los pasos. */}
          <div className={cn(!panelAbierto && "hidden lg:block")}>
            <Asistente />
          </div>
        </section>

        <div className="row-start-4 lg:hidden">
          <PestanasDePasos
            actual={paso}
            conCambios={conCambios}
            alElegir={irAPaso}
          />
        </div>
      </div>
    </ProveedorDelEditor>
  )
}

function BarraDelEditor() {
  const { tienda, borrador, esDemo, irAPaso, paso } = useEditor()

  return (
    <header className="flex h-14 items-center gap-1 border-b border-tinta/15 px-2 sm:px-3 lg:col-span-2">
      <Link
        href="/panel/apariencia"
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-sm font-semibold transition-colors hover:text-senal"
      >
        <X aria-hidden="true" className="size-5" />
        <span className="hidden sm:inline">Salir</span>
      </Link>

      <div className="min-w-0 flex-1 px-2">
        <p className="truncate font-titular text-[0.95rem] leading-tight font-extrabold tracking-[-0.01em]">
          {tienda.nombre}
        </p>
        <p className="truncate text-xs opacity-55">
          {esDemo
            ? "Modo demo · los cambios no se publican"
            : borrador.hayCambios
              ? "Cambios sin publicar · guardados en este dispositivo"
              : "Todo publicado"}
        </p>
      </div>

      <a
        href={tienda.url}
        target="_blank"
        rel="noreferrer noopener"
        className="mr-2 hidden min-h-11 items-center gap-1.5 px-2 text-sm font-semibold transition-colors hover:text-senal lg:flex"
      >
        Ver mi tienda
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>

      <button
        type="button"
        onClick={borrador.deshacer}
        disabled={!borrador.puedeDeshacer}
        aria-label="Deshacer"
        title="Deshacer (Ctrl+Z)"
        className="flex size-11 items-center justify-center transition-colors hover:text-senal disabled:opacity-30 disabled:hover:text-inherit"
      >
        <Undo2 aria-hidden="true" className="size-5" />
      </button>
      <button
        type="button"
        onClick={borrador.rehacer}
        disabled={!borrador.puedeRehacer}
        aria-label="Rehacer"
        title="Rehacer (Ctrl+Shift+Z)"
        className="flex size-11 items-center justify-center transition-colors hover:text-senal disabled:opacity-30 disabled:hover:text-inherit"
      >
        <Redo2 aria-hidden="true" className="size-5" />
      </button>

      <button
        type="button"
        onClick={() => irAPaso("publicar")}
        disabled={paso === "publicar"}
        className={cn(
          "ml-1 flex min-h-11 items-center gap-2 rounded-plantilla px-4 text-sm font-semibold transition-colors",
          borrador.hayCambios
            ? "bg-senal text-white hover:bg-senal-alta"
            : "border-2 border-tinta hover:bg-tinta hover:text-papel",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <Send aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Publicar</span>
      </button>
    </header>
  )
}
