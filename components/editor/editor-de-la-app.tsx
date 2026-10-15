"use client"

import * as React from "react"

import type { TiendaPublica } from "@/lib/data/tienda-publica"
import type { DisenoParaEditar } from "@/lib/data/editor"
import type { MensajeAlaVistaPrevia, Vista } from "@/lib/editor/protocolo"
import {
  mensajeDeLaApp,
  type MensajeAlaApp,
  type MensajeDeLaApp,
} from "@/lib/editor/protocolo-app"
import { combinarApariencia } from "@/lib/plantillas/apariencia"
import {
  aplicarOperaciones,
  cambiosEntre,
  contextoDeDiseno,
  problemasParaPublicar,
  type Borrador,
  type Operacion,
} from "@/lib/plantillas/borrador"
import type { Product } from "@/types"
import { useBorrador } from "@/components/editor/estado"
import { VistaPrevia, type Puente } from "@/components/editor/vista-previa"
import type { LineaCarrito } from "@/components/tienda/carrito"

declare global {
  interface Window {
    /** Lo que pone el WebView de React Native para hablarle a la app. */
    ReactNativeWebView?: { postMessage: (texto: string) => void }
    /** Por donde la app le habla a esta página, con `injectJavaScript`. */
    venduoApp?: { recibir: (mensaje: unknown) => void }
  }
}

function alaApp(mensaje: MensajeAlaApp) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(mensaje))
}

/**
 * Lo que llega de la app viaja en JSON, que no tiene `undefined`: un campo que
 * se vacía —una foto que se quita— llega como `null`. Las secciones lo
 * entienden como ausente, así que se traduce antes de aplicar.
 */
function sinNulos(operaciones: Operacion[]): Operacion[] {
  return operaciones.map((operacion) =>
    operacion.op === "editar" || operacion.op === "agregar"
      ? {
          ...operacion,
          props: Object.fromEntries(
            Object.entries(operacion.props).map(([clave, valor]) => [
              clave,
              valor === null ? undefined : valor,
            ])
          ),
        }
      : operacion
  )
}

/** Las secciones que cambian entre dos borradores: las que marca una propuesta. */
function seccionesTocadas(antes: Borrador, despues: Borrador): string[] {
  const previas = new Map(antes.secciones.map((s) => [s.id, JSON.stringify(s)]))
  return despues.secciones
    .filter((seccion) => previas.get(seccion.id) !== JSON.stringify(seccion))
    .map((seccion) => seccion.id)
}

/**
 * El editor de la tienda que usa la app móvil: sin controles, solo el borrador
 * y la vista previa.
 *
 * La app dibuja sus propios controles y manda operaciones; acá se aplican con
 * `useBorrador` —el mismo del editor de la web, con su deshacer y el borrador
 * guardado en el dispositivo— y se le devuelve a la app cómo quedó, qué
 * cambió y qué impide publicar. La vista previa es la misma del editor de la
 * web: la tienda real, dibujada con el kit de su plantilla.
 */
export function EditorDeLaApp({
  diseno,
  tienda,
  muestra,
  ejemplos,
}: {
  diseno: DisenoParaEditar
  tienda: TiendaPublica
  muestra: LineaCarrito[]
  ejemplos: Product[]
}) {
  const contexto = React.useMemo(
    () => contextoDeDiseno(diseno.base, diseno.datos),
    [diseno]
  )
  const borrador = useBorrador(diseno.publicado, contexto, diseno.tienda.id)

  const [vista, setVista] = React.useState<Vista>("inicio")
  const [productoId, setProductoId] = React.useState<string | null>(null)
  const [seleccion, setSeleccion] = React.useState<string | null>(null)
  const [mirando, setMirando] = React.useState<Borrador | null>(null)

  // Quienes escuchan del lado de la vista previa: la tienda dibujada.
  const oyentes = React.useRef(new Set<(m: MensajeAlaVistaPrevia) => void>())

  const mostrado = mirando ?? borrador.presente
  const marcas = React.useMemo(
    () => (mirando ? seccionesTocadas(borrador.presente, mirando) : []),
    [mirando, borrador.presente]
  )

  const estadoDeLaVista = React.useMemo<MensajeAlaVistaPrevia>(
    () => ({
      tipo: "estado",
      borrador: mostrado,
      vista,
      productoId,
      seleccion,
      marcas,
    }),
    [mostrado, vista, productoId, seleccion, marcas]
  )

  const ultimoEstado = React.useRef(estadoDeLaVista)
  React.useEffect(() => {
    ultimoEstado.current = estadoDeLaVista
    oyentes.current.forEach((oyente) => oyente(estadoDeLaVista))
  }, [estadoDeLaVista])

  const puente = React.useMemo<Puente>(
    () => ({
      escuchar(alRecibir) {
        oyentes.current.add(alRecibir)
        return () => oyentes.current.delete(alRecibir)
      },
      enviar(mensaje) {
        if (mensaje.tipo === "lista") {
          // La tienda se dibujó: recibe el borrador de entrada.
          oyentes.current.forEach((oyente) => oyente(ultimoEstado.current))
        } else if (mensaje.tipo === "seleccionar") {
          setSeleccion(mensaje.seccion)
          alaApp({ tipo: "seleccionar", seccion: mensaje.seccion })
        } else if (mensaje.tipo === "fija") {
          alaApp({ tipo: "fija", nombre: mensaje.nombre, ayuda: mensaje.ayuda })
        }
        // Soltar una foto encima es del mouse: en el celular no pasa.
      },
    }),
    []
  )

  // Cada cambio del borrador se le cuenta a la app, con lo que impide
  // publicar y lo que cambió desde lo publicado.
  const { presente, publicado, hayCambios, puedeDeshacer, puedeRehacer } =
    borrador
  const recuperable = borrador.recuperable?.fecha ?? null
  React.useEffect(() => {
    alaApp({
      tipo: "estado",
      borrador: presente,
      publicado,
      apariencia: combinarApariencia(diseno.base, presente.personalizacion),
      hayCambios,
      puedeDeshacer,
      puedeRehacer,
      problemas: hayCambios
        ? problemasParaPublicar(presente, contexto).problemas
        : [],
      cambios: cambiosEntre(publicado, presente, diseno.base),
      recuperable,
    })
  }, [
    presente,
    publicado,
    hayCambios,
    puedeDeshacer,
    puedeRehacer,
    recuperable,
    contexto,
    diseno.base,
  ])

  const recibir = React.useCallback(
    (mensaje: MensajeDeLaApp) => {
      switch (mensaje.tipo) {
        case "operaciones": {
          setMirando(null)
          const resultado = borrador.aplicar(sinNulos(mensaje.operaciones), {
            agrupar: mensaje.agrupar,
          })
          if (!resultado.ok) {
            alaApp({ tipo: "rechazado", motivos: resultado.errores })
          }
          return
        }
        case "deshacer":
          return borrador.deshacer()
        case "rehacer":
          return borrador.rehacer()
        case "descartar":
          setMirando(null)
          return borrador.poner(borrador.publicado)
        case "vista":
          setVista(mensaje.vista)
          setProductoId(mensaje.productoId ?? null)
          return
        case "seleccionar":
          return setSeleccion(mensaje.seccion)
        case "enfocar":
          setSeleccion(mensaje.seccion)
          oyentes.current.forEach((oyente) =>
            oyente({ tipo: "enfocar", seccion: mensaje.seccion })
          )
          return
        case "mirar": {
          if (!mensaje.operaciones) return setMirando(null)
          const resultado = aplicarOperaciones(
            borrador.presente,
            sinNulos(mensaje.operaciones),
            contexto
          )
          if (resultado.ok) setMirando(resultado.borrador)
          else alaApp({ tipo: "rechazado", motivos: resultado.errores })
          return
        }
        case "publicado":
          setMirando(null)
          return borrador.marcarPublicado(mensaje.borrador as Borrador)
        case "recuperar":
          return mensaje.si
            ? borrador.recuperar()
            : borrador.olvidarRecuperable()
      }
    },
    [borrador, contexto]
  )

  React.useEffect(() => {
    window.venduoApp = {
      recibir(crudo) {
        const leido = mensajeDeLaApp.safeParse(
          typeof crudo === "string" ? JSON.parse(crudo) : crudo
        )
        if (leido.success) recibir(leido.data)
      },
    }
    return () => {
      delete window.venduoApp
    }
  }, [recibir])

  return (
    <VistaPrevia
      tienda={tienda}
      muestra={muestra}
      ejemplos={ejemplos}
      puente={puente}
    />
  )
}

/** Sin tienda o sin permiso: se le avisa a la app, que muestra su propio error. */
export function SinTiendaParaLaApp() {
  React.useEffect(() => alaApp({ tipo: "sin-tienda" }), [])
  return null
}
