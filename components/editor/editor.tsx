"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Redo2,
  Send,
  Undo2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import type {
  ResultadoDePropuesta,
  ResultadoDePublicar,
} from "@/app/editor/acciones"
import { GUIA_DE_AJUSTES } from "@/lib/editor/guia-de-ajustes"
import { cambiosDeLaPropuesta } from "@/lib/editor/propuesta"
import { ErrorDeImagen, subirImagen } from "@/lib/editor/imagenes"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import type { EstadoDeFuncion } from "@/lib/funciones"
import type { ClaveDePaso } from "@/lib/editor/pasos"
import type {
  EstadoParaLaVistaPrevia,
  MensajeAlEditor,
  Vista,
} from "@/lib/editor/protocolo"
import {
  senalDelCambio,
  vistaDeAjuste,
  type SenalDeCambio,
} from "@/lib/editor/senales"
import {
  combinarApariencia,
  type RutaDeAjuste,
  type TokenDeColor,
} from "@/lib/plantillas/apariencia"
import {
  aplicarOperaciones,
  contextoDeDiseno,
  problemasParaPublicar,
  type Borrador,
  type Operacion,
} from "@/lib/plantillas/borrador"
import { SECCIONES } from "@/lib/plantillas/secciones"
import { cn } from "@/lib/utils"
import { useConfirmacion } from "@/components/panel/confirmar"
import { ConFuncion } from "@/components/panel/funcion"
import { useManija, type NivelDelPanel } from "@/components/panel/manija"
import { CerrarAviso, ContenidoDeAviso } from "@/components/panel/aviso"
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { archivoAncho, kalam } from "@/components/portada/letras"
import type { DisenoParaEditar } from "@/lib/data/editor"
import { Asistente } from "@/components/editor/asistente"
import { Bienvenida, Recuperar } from "@/components/editor/avisos"
import {
  ProveedorDelEditor,
  useEditor,
  type Dispositivo,
  type LugarDeCambio,
  type Propuesta,
  type ValorDelEditor,
} from "@/components/editor/contexto"
import { useBorrador } from "@/components/editor/estado"
import { MarcoDeVistaPrevia } from "@/components/editor/marco"
import { PasoCarrito } from "@/components/editor/paso-carrito"
import { PasoMarca } from "@/components/editor/paso-marca"
import { PasoPortada } from "@/components/editor/paso-portada"
import { PasoProductos } from "@/components/editor/paso-productos"
import { PasoPublicar } from "@/components/editor/paso-publicar"
import {
  BarraDePasos,
  pasoDe,
  PestanasDePasos,
} from "@/components/editor/pasos"
import { useTextosAMedida } from "@/components/editor/textos-a-medida"
import { MENSAJE_SIN_RESPUESTA } from "@/lib/ai/mensajes"

/** En el celular: solo su barra, compartiendo con la tienda, o casi entero. */
function altoDelPanel(nivel: NivelDelPanel, pantalla: number) {
  if (nivel === 0) return 45
  // En un celular bajo, el 44% no alcanza ni para un campo.
  if (nivel === 1) {
    return Math.round(Math.max(pantalla * 0.44, Math.min(320, pantalla * 0.5)))
  }
  // Que siempre quede a la vista un pedazo de lo que se edita.
  return pantalla - 260
}

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
  const lugar = vistaDeAjuste(rutas[0])
  return rutas.every((ruta) => vistaDeAjuste(ruta) === lugar) ? lugar : null
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
  iaEstado = "activa",
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
  iaEstado?: EstadoDeFuncion
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
  const [senal, setSenal] = React.useState<{
    ruta: string
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
  const [nivel, setNivel] = React.useState<NivelDelPanel>(1)
  const panelAbierto = nivel > 0
  const { alto, arrastrando, propsDeManija } = useManija({
    nivel,
    alCambiarNivel: setNivel,
    altoDe: altoDelPanel,
  })
  const panel = React.useRef<HTMLDivElement>(null)
  const [conBienvenida, setConBienvenida] = React.useState(bienvenida)
  const [cargandoIa, setCargandoIa] = React.useState(false)
  const [ultimoPedido, setUltimoPedido] = React.useState("")
  const [errorIa, setErrorIa] = React.useState<string | null>(null)
  const [mirandoAntes, setMirandoAntes] = React.useState(false)
  const [publicando, setPublicando] = React.useState(false)
  const [recienPublicado, setRecienPublicado] = React.useState(false)
  const [problemasAlPublicar, setProblemasAlPublicar] = React.useState<
    string[]
  >([])
  const textos = useTextosAMedida(!diseno.esDemo)
  // La de los textos a medida se decide en su tarjeta, sin tapar el paso.
  const decidiendo = Boolean(propuesta && !propuesta.deTextos)
  // Un borrador de la vez anterior se resuelve antes de seguir editando.
  const porRecuperar = Boolean(borrador.recuperable)
  const enEspera = decidiendo || porRecuperar

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

  const irAPaso = React.useCallback(
    (siguiente: ClaveDePaso) => {
      if (publicando) return
      if (porRecuperar) {
        toast("Primero decide sobre tus cambios guardados", {
          id: "recuperar-pendiente",
        })
        return
      }
      if (decidiendo) {
        toast("Primero decide sobre la propuesta de la IA", {
          id: "propuesta-pendiente",
          description: "Aplícala o descártala para seguir editando.",
        })
        return
      }
      setPaso(siguiente)
      setVistaForzada(null)
      setNivel((actual) => (actual === 0 ? 1 : actual))
      // Quien ya se movió de paso empezó: la bienvenida solo estorba.
      setConBienvenida(false)
    },
    [decidiendo, publicando, porRecuperar]
  )

  // El sello y los problemas son de esta visita al último paso.
  React.useEffect(() => {
    if (paso === "publicar") return
    setRecienPublicado(false)
    setProblemasAlPublicar([])
  }, [paso])

  // Primero lleva al último paso: ahí se ve el resultado, y sin los controles
  // a mano nadie edita algo que publicar pisaría al terminar.
  const publicarCambios = async () => {
    irAPaso("publicar")
    if (publicando || enEspera) return

    if (diseno.esDemo) {
      toast("Estás en modo demo: los cambios no se publican.")
      return
    }
    const { problemas } = problemasParaPublicar(borrador.presente, contexto)
    if (problemas.length > 0) {
      // Al llegar, el paso ya los muestra; si ya estaba, el toque debe responder.
      if (paso === "publicar") {
        toast.error("Antes de publicar, arregla esto", {
          description: problemas[0],
        })
      }
      return
    }

    setPublicando(true)
    setProblemasAlPublicar([])
    const resultado = await publicar(borrador.presente).catch(() => ({
      ok: false as const,
      error: "No pudimos publicar. Inténtalo de nuevo en un momento.",
      problemas: undefined,
    }))
    setPublicando(false)

    if (!resultado.ok) {
      toast.error(resultado.error)
      setProblemasAlPublicar(resultado.problemas ?? [])
      return
    }
    borrador.marcarPublicado(resultado.publicado)
    setComparar("despues")
    setRecienPublicado(true)
  }

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
          description: "Suéltala sobre «Presentación» o «Sobre el negocio».",
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

  const ultimaSenal = React.useRef<SenalDeCambio | null>(null)

  // Lleva la vista previa a donde se ve un cambio.
  const mostrarLugar = React.useCallback((lugar: LugarDeCambio) => {
    if (lugar.seccion) {
      const seccion = lugar.seccion
      setVistaForzada("inicio")
      setEnfoque((previo) => ({ seccion, vez: (previo?.vez ?? 0) + 1 }))
    } else if (lugar.ruta) {
      const ruta = lugar.ruta
      setVistaForzada(vistaDeAjuste(ruta) ?? "inicio")
      setSenal((previa) => ({ ruta, vez: (previa?.vez ?? 0) + 1 }))
    }
  }, [])

  const alMensaje = React.useCallback(
    (mensaje: MensajeAlEditor) => {
      if (mensaje.tipo === "seleccionar") {
        if (enEspera || publicando) return
        setSeleccion(mensaje.seccion)
        setPaso("portada")
        setVistaForzada(null)
        setNivel((actual) => (actual === 0 ? 1 : actual))
      } else if (mensaje.tipo === "fija") {
        toast(
          mensaje.navegacion
            ? mensaje.nombre
              ? `«${mensaje.nombre}» no se abre aquí`
              : "Esto no se abre aquí"
            : `«${mensaje.nombre}» viene con tu plantilla`,
          {
            id: "parte-fija",
            description: mensaje.ayuda || undefined,
          }
        )
      } else if (mensaje.tipo === "sin-senal") {
        const ultima = ultimaSenal.current
        const motivo = GUIA_DE_AJUSTES[mensaje.ruta as RutaDeAjuste]?.sinSenal
        if (
          motivo &&
          ultima?.tipo === "ajuste" &&
          ultima.ruta === mensaje.ruta &&
          !ultima.apagado
        ) {
          toast("Todavía no se ve en tu tienda", {
            id: "sin-senal",
            description: motivo,
          })
        }
      } else if (mensaje.tipo === "soltar-imagen" && !enEspera) {
        void soltarImagen(mensaje.seccion, mensaje.archivo)
      }
    },
    [soltarImagen, enEspera, publicando]
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

      const cambios = cambiosDeLaPropuesta(
        resultado.operaciones,
        antes,
        aplicado.borrador
      )
      setPropuesta({
        id: resultado.id,
        resumen: resultado.resumen,
        aviso: resultado.aviso,
        operaciones: resultado.operaciones,
        // El tono al pasar el cursor sale solo del de los botones.
        cambios,
        borrador: aplicado.borrador,
        marcas: seccionesTocadas(
          antes,
          aplicado.borrador,
          resultado.operaciones
        ),
      })

      const lugar = vistaDeLaPropuesta(resultado.operaciones)
      if (lugar) setVistaForzada(lugar)
      // A media altura: la propuesta y la tienda se tienen que ver juntas.
      setNivel(1)

      // Decidir sin ver el cambio es decidir a ciegas. Se espera a que la
      // vista previa tenga la propuesta dibujada.
      const primero = cambios.find((cambio) => cambio.lugar)?.lugar
      if (primero) window.setTimeout(() => mostrarLugar(primero), 350)
    },
    [proponer, decidir, contexto, mostrarLugar]
  )

  const aplicarPropuesta = React.useCallback(() => {
    if (!propuesta) return
    toast.dismiss("propuesta-pendiente")
    borrador.poner(propuesta.borrador)
    if (propuesta.id) void decidir({ id: propuesta.id, aplicada: true })
    setPropuesta(null)
    setMirandoAntes(false)
    // Abajo: arriba tapaba el nombre de la tienda y si falta publicar.
    toast.success("Cambios aplicados.", {
      description: "Todavía no los publicas. Si no te convencen, deshazlos.",
      position: "bottom-center",
      action: { label: "Deshacer", onClick: () => borrador.deshacer() },
    })
  }, [propuesta, borrador, decidir])

  const descartarPropuesta = React.useCallback(() => {
    toast.dismiss("propuesta-pendiente")
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
      distinto(a.personalizacion.disposicion, b.personalizacion.disposicion) ||
      distinto(a.personalizacion.ficha, b.personalizacion.ficha)
    ) {
      pasos.add("productos")
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

  const pantalla = React.useRef({ vista, paso })
  React.useEffect(() => {
    pantalla.current = { vista, paso }
  })

  // Todo cambio se muestra en la tienda, venga de donde venga. Escribir o
  // arrastrar un color son muchos cambios seguidos: se espera a que paren.
  const conocido = React.useRef(borrador.presente)
  React.useEffect(() => {
    const antes = conocido.current
    conocido.current = borrador.presente
    if (antes === borrador.presente) return

    const cambio = senalDelCambio(antes, borrador.presente, diseno.base)
    if (!cambio) return

    const reloj = window.setTimeout(
      () => {
        const { vista: mirando, paso: pasoActual } = pantalla.current
        if (pasoActual === "publicar") return
        ultimaSenal.current = cambio

        if (cambio.tipo === "seccion") {
          if (mirando !== "inicio") return
          setEnfoque((previo) => ({
            seccion: cambio.seccion,
            vez: (previo?.vez ?? 0) + 1,
          }))
          return
        }
        const donde = vistaDeAjuste(cambio.ruta)
        if (donde && donde !== mirando) return
        setSenal((previa) => ({
          ruta: cambio.ruta,
          vez: (previa?.vez ?? 0) + 1,
        }))
      },
      cambio.tipo === "seccion" ? 350 : 80
    )
    return () => window.clearTimeout(reloj)
  }, [borrador.presente, diseno.base])

  // "Antes y después" se mira en la pantalla donde está el cambio.
  function mirarCambio(lugar: LugarDeCambio) {
    setComparar("despues")
    setMirandoAntes(false)
    mostrarLugar(lugar)
  }

  const estadoDeLaVista = React.useMemo<EstadoParaLaVistaPrevia>(
    () => ({
      tipo: "estado",
      borrador: visible,
      vista,
      productoId,
      seleccion: paso === "portada" ? seleccion : null,
      marcas: propuesta && !mirandoAntes ? propuesta.marcas : [],
      conPistas: paso === "portada" && !seleccion,
    }),
    [visible, vista, productoId, seleccion, paso, propuesta, mirandoAntes]
  )

  const valor: ValorDelEditor = {
    tienda: diseno.tienda,
    base: diseno.base,
    datos: diseno.datos,
    productos: diseno.productos,
    hayProductos: diseno.hayProductos,
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
      estado: iaEstado,
      aplicar: aplicarPropuesta,
      descartar: descartarPropuesta,
      mirandoAntes,
      setMirandoAntes,
    },
    publicacion: {
      enCurso: publicando,
      lista: recienPublicado,
      problemas: problemasAlPublicar,
      publicar: () => void publicarCambios(),
      mirarCambio,
    },
    textos,
    ultimoColor,
    setUltimoColor,
  }
  const porDecidir = textos.vista?.estado === "lista" ? "portada" : null

  const actual = pasoDe(paso)

  return (
    <ProveedorDelEditor value={valor}>
      {/* Una columna de `minmax(0,1fr)` en el celular: sin ella, la columna
          implícita crecía hasta el contenido más ancho y la pantalla entera
          se desbordaba a los costados. */}
      {/* Fuera del armazón, pero en el cuaderno: la marca viste las piezas
          (`app/globals.css`) y trae sus letras. La vista previa de la tienda
          vive en un <iframe>, así que el cuaderno no la toca. */}
      <div
        data-registro="cuaderno"
        className={cn(
          archivoAncho.variable,
          kalam.variable,
          "grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden bg-papel text-tinta lg:grid-cols-[26rem_minmax(0,1fr)] lg:grid-rows-[auto_auto_minmax(0,1fr)]"
        )}
      >
        <BarraDelEditor />

        <div className="hidden lg:col-span-2 lg:row-start-2 lg:block">
          <BarraDePasos
            actual={paso}
            conCambios={conCambios}
            porDecidir={porDecidir}
            alElegir={irAPaso}
          />
        </div>

        <section
          aria-label={actual.nombre}
          style={{ "--alto-del-panel": `${alto}px` } as React.CSSProperties}
          className={cn(
            "row-start-3 flex min-h-0 flex-col border-t border-tinta/15 bg-papel max-lg:h-[var(--alto-del-panel)] lg:col-start-1 lg:row-start-3 lg:border-t-0 lg:border-r",
            !arrastrando &&
              "motion-safe:max-lg:transition-[height] motion-safe:max-lg:duration-300 motion-safe:max-lg:ease-out"
          )}
        >
          <div className="flex shrink-0 items-stretch border-b border-tinta/15 lg:hidden">
            <button
              type="button"
              {...propsDeManija}
              aria-expanded={panelAbierto}
              className="flex min-h-11 min-w-0 flex-1 touch-none items-center gap-3 pl-5 text-left"
            >
              <span
                aria-hidden="true"
                className="h-1 w-7 shrink-0 rounded-full bg-tinta/30"
              />
              <span className="min-w-0 truncate text-sm">
                <span className="font-semibold">{actual.nombre}</span>
                <span className="ml-2 text-xs opacity-70">
                  {decidiendo
                    ? panelAbierto
                      ? "Ocultar la propuesta"
                      : "Ver la propuesta"
                    : panelAbierto
                      ? "Ocultar controles"
                      : "Mostrar controles"}
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label={
                nivel === 2 ? "Achicar el panel" : "Agrandar el panel"
              }
              onClick={() => setNivel(nivel === 2 ? 1 : 2)}
              className="flex size-11 shrink-0 items-center justify-center"
            >
              {nivel === 2 ? (
                <ChevronDown aria-hidden="true" className="size-5" />
              ) : (
                <ChevronUp aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>

          {porRecuperar ? (
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain",
                !panelAbierto && "hidden lg:block"
              )}
            >
              <Recuperar />
            </div>
          ) : null}

          <div
            ref={panel}
            // Escribir en el celular con el panel grande era escribir sin ver la
            // tienda: al tocar un campo, el panel baja a la mitad.
            onFocusCapture={(evento) => {
              if (
                nivel === 2 &&
                window.matchMedia("(max-width: 1023px)").matches &&
                (evento.target as HTMLElement).matches?.(
                  "input:not([type=file]), textarea"
                )
              ) {
                setNivel(1)
              }
            }}
            className={cn(
              // `relative`: los campos de archivo ocultos son absolutos, y sin
              // un ancestro posicionado se escapaban del panel y estiraban la
              // página entera.
              "relative min-h-0 flex-1 overflow-y-auto overscroll-contain",
              enEspera ? "hidden" : !panelAbierto && "hidden lg:block"
            )}
          >
            {conBienvenida ? (
              <Bienvenida alEmpezar={() => setConBienvenida(false)} />
            ) : null}
            <div
              key={paso}
              className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              {paso === "marca" ? <PasoMarca /> : null}
              {paso === "portada" ? <PasoPortada /> : null}
              {paso === "productos" ? <PasoProductos /> : null}
              {paso === "carrito" ? <PasoCarrito /> : null}
              {paso === "publicar" ? <PasoPublicar /> : null}
            </div>
          </div>

          {/* Fuera del desplazamiento: la IA queda a mano en todos los pasos. */}
          <ConFuncion
            estado={porRecuperar ? "oculta" : iaEstado}
            className={cn(!panelAbierto && "hidden lg:block")}
          >
            <div
              className={
                decidiendo
                  ? cn(
                      "min-h-0 flex-1 flex-col lg:flex",
                      panelAbierto ? "flex" : "hidden"
                    )
                  : cn(
                      !panelAbierto && "hidden lg:block",
                      // En el celular, escribir o revisar necesita ese lugar.
                      (paso === "publicar" ||
                        (paso === "portada" && seleccion)) &&
                        "max-lg:hidden"
                    )
              }
            >
              <Asistente />
            </div>
          </ConFuncion>
        </section>

        {/* Después de los controles: con el teclado se llega primero a lo que
            se edita, no a cada enlace de la tienda. */}
        <main className="row-start-2 min-h-0 lg:col-start-2 lg:row-start-3">
          <MarcoDeVistaPrevia
            estado={estadoDeLaVista}
            enfoque={enfoque}
            senal={senal}
            alMensaje={alMensaje}
            dispositivo={dispositivo}
            setDispositivo={setDispositivo}
          />
        </main>

        <div className="row-start-4 lg:hidden">
          <PestanasDePasos
            actual={paso}
            conCambios={conCambios}
            porDecidir={porDecidir}
            alElegir={irAPaso}
          />
        </div>
      </div>
    </ProveedorDelEditor>
  )
}

function BarraDelEditor() {
  const { tienda, borrador, esDemo, irAPaso, paso, publicacion } = useEditor()
  const [preguntando, setPreguntando] = React.useState(false)
  const router = useRouter()
  const confirmacion = useConfirmacion()

  async function descartarYSalir() {
    setPreguntando(false)
    const si = await confirmacion.preguntar({
      titulo: "¿Descartar tus cambios?",
      texto: "Se borran de este dispositivo. Tu tienda publicada no cambia.",
      confirmar: "Descartar y salir",
    })
    if (!si) return
    borrador.poner(borrador.publicado)
    router.push("/panel/apariencia")
  }

  return (
    <header className="flex h-14 items-center gap-1 border-b border-tinta/15 px-2 sm:px-3 lg:col-span-2">
      <Link
        href="/panel/apariencia"
        aria-label="Salir del editor"
        onClick={(evento) => {
          // Quien sale puede creer que sus cambios ya están en la tienda.
          if (borrador.hayCambios && !esDemo) {
            evento.preventDefault()
            setPreguntando(true)
          }
        }}
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-sm font-semibold transition-colors hover:opacity-60"
      >
        <X aria-hidden="true" className="size-5" />
        <span className="max-sm:hidden">Salir</span>
      </Link>

      {confirmacion.dialogo}
      <AlertDialog open={preguntando} onOpenChange={setPreguntando}>
        <ContenidoDeAviso>
          <div className="p-5 sm:p-6">
            <AlertDialogTitle className="font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
              Tus cambios todavía no se ven en tu tienda
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3 text-sm leading-relaxed text-tinta/70">
              Si sales ahora, quedan guardados solo en este dispositivo. En otro
              celular o computadora no van a estar.
            </AlertDialogDescription>
          </div>
          <div className="flex flex-col gap-3 border-t border-tinta/15 p-5 sm:p-6">
            <button
              type="button"
              onClick={() => {
                setPreguntando(false)
                publicacion.publicar()
              }}
              className={BOTON_PRIMARIO}
            >
              <Send aria-hidden="true" className="size-4" />
              Publicar ahora
            </button>
            <CerrarAviso className={BOTON_SECUNDARIO}>
              Seguir editando
            </CerrarAviso>
            <div className="grid grid-cols-2">
              <Link
                href="/panel/apariencia"
                className="flex min-h-11 items-center justify-center text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                Salir
              </Link>
              <button
                type="button"
                onClick={() => void descartarYSalir()}
                className="flex min-h-11 items-center justify-center text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                Descartar y salir
              </button>
            </div>
          </div>
        </ContenidoDeAviso>
      </AlertDialog>

      <div className="min-w-0 flex-1 px-2">
        <p className="truncate font-titular text-base leading-tight font-extrabold tracking-[-0.01em]">
          {tienda.nombre}
        </p>
        <p className="truncate text-xs opacity-70">
          {esDemo
            ? "Modo demo · los cambios no se publican"
            : borrador.recuperable
              ? "Cambios por recuperar"
              : borrador.hayCambios
                ? // El mismo texto en el celular y en la computadora.
                  "Sin publicar · solo aquí"
                : "Todo publicado"}
        </p>
      </div>

      <a
        href={tienda.url}
        target="_blank"
        rel="noreferrer noopener"
        className="mr-2 hidden min-h-11 items-center gap-1.5 px-2 text-sm font-semibold transition-colors hover:opacity-60 lg:flex"
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
        className="flex size-11 items-center justify-center transition-colors hover:opacity-60 disabled:opacity-30 disabled:hover:opacity-30"
      >
        <Undo2 aria-hidden="true" className="size-5" />
      </button>
      <button
        type="button"
        onClick={borrador.rehacer}
        disabled={!borrador.puedeRehacer}
        aria-label="Rehacer"
        title="Rehacer (Ctrl+Shift+Z)"
        className={cn(
          "flex size-11 items-center justify-center transition-colors hover:opacity-60 disabled:opacity-30 disabled:hover:opacity-30",
          // En el celular, solo cuando hay algo que rehacer: le deja lugar a
          // la palabra "Publicar".
          !borrador.puedeRehacer && "max-sm:hidden"
        )}
      >
        <Redo2 aria-hidden="true" className="size-5" />
      </button>

      <button
        type="button"
        onClick={() =>
          borrador.hayCambios ? publicacion.publicar() : irAPaso("publicar")
        }
        disabled={
          publicacion.enCurso || (!borrador.hayCambios && paso === "publicar")
        }
        className={cn(
          "relative ml-1 flex min-h-11 items-center gap-2 rounded-plantilla px-3 text-sm font-semibold transition-colors sm:px-4",
          borrador.hayCambios
            ? "bg-accion text-white hover:bg-accion-alta"
            : "border-2 border-tinta hover:bg-tinta hover:text-papel",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        {publicacion.enCurso ? (
          <Loader2
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : borrador.hayCambios ? (
          <Send aria-hidden="true" className="size-4" />
        ) : (
          <Check aria-hidden="true" className="size-4" />
        )}
        {/* Sin cambios no hay nada que publicar: dice que ya está, y lleva al
            paso por si se quiere volver a mirar. */}
        {publicacion.enCurso
          ? "Publicando…"
          : borrador.hayCambios || esDemo
            ? "Publicar"
            : "Publicado"}
        {borrador.hayCambios && !publicacion.enCurso ? (
          <span
            role="img"
            aria-label="con cambios sin publicar"
            className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-papel bg-senal"
          />
        ) : null}
      </button>
    </header>
  )
}
