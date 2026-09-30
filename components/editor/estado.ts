import * as React from "react"

import { borradorSchema } from "@/lib/editor/protocolo"
import {
  aplicarOperaciones,
  type Borrador,
  type ContextoDeDiseno,
  type Operacion,
  type ResultadoDeOperaciones,
} from "@/lib/plantillas/borrador"

/** Cuántos pasos se pueden deshacer. */
const LIMITE = 60

/**
 * Escribir seguido en un mismo campo es un solo paso de deshacer. Sin esto,
 * deshacer un título de veinte letras pedía veinte toques.
 */
const VENTANA_DE_AGRUPACION = 1200

interface Historial {
  publicado: Borrador
  presente: Borrador
  pasado: Borrador[]
  futuro: Borrador[]
  agrupacion: { clave: string; momento: number } | null
}

type Accion =
  | { tipo: "poner"; borrador: Borrador; agrupar?: string; momento: number }
  | { tipo: "deshacer" }
  | { tipo: "rehacer" }
  | { tipo: "publicado"; borrador: Borrador }

function reducir(estado: Historial, accion: Accion): Historial {
  switch (accion.tipo) {
    case "poner": {
      const mismoGesto =
        accion.agrupar !== undefined &&
        estado.agrupacion?.clave === accion.agrupar &&
        accion.momento - estado.agrupacion.momento < VENTANA_DE_AGRUPACION

      return {
        ...estado,
        presente: accion.borrador,
        pasado: mismoGesto
          ? estado.pasado
          : [...estado.pasado, estado.presente].slice(-LIMITE),
        futuro: [],
        agrupacion: accion.agrupar
          ? { clave: accion.agrupar, momento: accion.momento }
          : null,
      }
    }
    case "deshacer": {
      const previo = estado.pasado.at(-1)
      if (!previo) return estado
      return {
        ...estado,
        presente: previo,
        pasado: estado.pasado.slice(0, -1),
        futuro: [estado.presente, ...estado.futuro],
        agrupacion: null,
      }
    }
    case "rehacer": {
      const siguiente = estado.futuro[0]
      if (!siguiente) return estado
      return {
        ...estado,
        presente: siguiente,
        pasado: [...estado.pasado, estado.presente],
        futuro: estado.futuro.slice(1),
        agrupacion: null,
      }
    }
    case "publicado":
      // Lo publicado es el nuevo punto de partida. Deshacer más atrás
      // devolvería al borrador cambios que ya están en la tienda.
      return {
        publicado: accion.borrador,
        presente: accion.borrador,
        pasado: [],
        futuro: [],
        agrupacion: null,
      }
  }
}

export function mismoBorrador(a: Borrador, b: Borrador) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Una huella corta de lo publicado, para saber si un borrador guardado le corresponde. */
function huella(borrador: Borrador): string {
  const texto = JSON.stringify(borrador)
  let valor = 5381
  for (let i = 0; i < texto.length; i++) {
    valor = ((valor << 5) + valor + texto.charCodeAt(i)) | 0
  }
  return (valor >>> 0).toString(36)
}

export interface BorradorRecuperable {
  borrador: Borrador
  fecha: number
}

/**
 * El borrador del editor y su historial.
 *
 * Toda modificación pasa por `aplicar`, que usa las mismas operaciones que la
 * IA: si alguna no vale, el borrador no cambia y se devuelven los motivos.
 *
 * El borrador se guarda en este dispositivo mientras tenga cambios sin
 * publicar. Al volver, si lo publicado sigue siendo el mismo del que partió,
 * se ofrece recuperarlo; si alguien publicó otra cosa desde entonces, se
 * descarta, porque pisaría lo nuevo con algo armado sobre lo viejo.
 */
export function useBorrador(
  publicadoInicial: Borrador,
  contexto: ContextoDeDiseno,
  tiendaId: string
) {
  const [estado, despachar] = React.useReducer(
    reducir,
    publicadoInicial,
    (publicado): Historial => ({
      publicado,
      presente: publicado,
      pasado: [],
      futuro: [],
      agrupacion: null,
    })
  )

  const actual = React.useRef(estado)
  React.useEffect(() => {
    actual.current = estado
  })

  const clave = `venduo:editor:${tiendaId}`
  const [recuperable, setRecuperable] =
    React.useState<BorradorRecuperable | null>(null)
  // Hasta decidir qué hacer con un borrador guardado no se escribe encima.
  const [guardar, setGuardar] = React.useState(false)

  React.useEffect(() => {
    try {
      const crudo = window.localStorage.getItem(clave)
      if (crudo) {
        const guardado = JSON.parse(crudo) as {
          huella?: string
          borrador?: unknown
          fecha?: number
        }
        const borrador = borradorSchema.safeParse(guardado.borrador)
        if (
          guardado.huella === huella(publicadoInicial) &&
          borrador.success &&
          !mismoBorrador(borrador.data, publicadoInicial)
        ) {
          setRecuperable({
            borrador: borrador.data,
            fecha: guardado.fecha ?? Date.now(),
          })
          return
        }
      }
    } catch {
      // Almacenamiento bloqueado o dañado: se empieza de lo publicado.
    }
    setGuardar(true)
    // Solo al abrir: después, lo publicado cambia por `marcarPublicado`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  React.useEffect(() => {
    if (!guardar) return
    try {
      if (mismoBorrador(estado.presente, estado.publicado)) {
        window.localStorage.removeItem(clave)
      } else {
        window.localStorage.setItem(
          clave,
          JSON.stringify({
            huella: huella(estado.publicado),
            borrador: estado.presente,
            fecha: Date.now(),
          })
        )
      }
    } catch {
      // Sin almacenamiento el borrador dura lo que dure la pestaña.
    }
  }, [clave, estado.presente, estado.publicado, guardar])

  const aplicar = React.useCallback(
    (
      operaciones: Operacion[],
      opciones: { agrupar?: string } = {}
    ): ResultadoDeOperaciones => {
      const resultado = aplicarOperaciones(
        actual.current.presente,
        operaciones,
        contexto
      )
      if (resultado.ok) {
        despachar({
          tipo: "poner",
          borrador: resultado.borrador,
          agrupar: opciones.agrupar,
          momento: Date.now(),
        })
      }
      return resultado
    },
    [contexto]
  )

  /** Pone un borrador ya validado, como la propuesta de la IA que se acepta. */
  const poner = React.useCallback((borrador: Borrador) => {
    despachar({ tipo: "poner", borrador, momento: Date.now() })
  }, [])

  const deshacer = React.useCallback(() => despachar({ tipo: "deshacer" }), [])
  const rehacer = React.useCallback(() => despachar({ tipo: "rehacer" }), [])

  const marcarPublicado = React.useCallback((borrador: Borrador) => {
    despachar({ tipo: "publicado", borrador })
  }, [])

  const recuperar = React.useCallback(() => {
    if (recuperable) {
      despachar({
        tipo: "poner",
        borrador: recuperable.borrador,
        momento: Date.now(),
      })
    }
    setRecuperable(null)
    setGuardar(true)
  }, [recuperable])

  const olvidarRecuperable = React.useCallback(() => {
    setRecuperable(null)
    setGuardar(true)
  }, [])

  return {
    publicado: estado.publicado,
    presente: estado.presente,
    hayCambios: !mismoBorrador(estado.presente, estado.publicado),
    puedeDeshacer: estado.pasado.length > 0,
    puedeRehacer: estado.futuro.length > 0,
    aplicar,
    poner,
    deshacer,
    rehacer,
    marcarPublicado,
    recuperable,
    recuperar,
    olvidarRecuperable,
  }
}

export type EstadoDelBorrador = ReturnType<typeof useBorrador>
