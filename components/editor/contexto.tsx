"use client"

import * as React from "react"

import type { ClaveDePaso } from "@/lib/editor/pasos"
import type { EstadoDeFuncion } from "@/lib/funciones"
import type { Vista } from "@/lib/editor/protocolo"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import type { Cambio } from "@/lib/plantillas/borrador"
import type {
  Borrador,
  ContextoDeDiseno,
  DatosDeContexto,
  Operacion,
} from "@/lib/plantillas/borrador"
import type { DisenoParaEditar, ProductoDeMuestra } from "@/lib/data/editor"
import type {
  ResultadoDePropuesta,
  ResultadoDePublicar,
} from "@/app/editor/acciones"
import type { EstadoDelBorrador } from "@/components/editor/estado"
import type { TextosAMedida } from "@/components/editor/textos-a-medida"

export type { ClaveDePaso } from "@/lib/editor/pasos"

/** Cómo se mira la vista previa en la computadora. En el celular, siempre celular. */
export type Dispositivo = "celular" | "computadora"

/** Dónde se ve un cambio en la tienda. */
export type LugarDeCambio = Pick<Cambio, "seccion" | "ruta">

/** Lo que la IA propuso y todavía no se aplicó. */
export interface Propuesta {
  id: string | null
  resumen: string
  /** Lo que se dejó afuera y por qué, si algo se dejó. */
  aviso?: string
  operaciones: Operacion[]
  /** Cada cambio en palabras, con su color y dónde se ve, si se puede. */
  cambios: Array<{ texto: string; color?: string; lugar?: LugarDeCambio }>
  borrador: Borrador
  /** Las secciones que cambia, para marcarlas en la vista previa. */
  marcas: string[]
  /** Es la de los textos a medida: se decide en su tarjeta del paso Portada. */
  deTextos?: boolean
}

export interface ValorDelEditor {
  tienda: DisenoParaEditar["tienda"]
  base: Apariencia
  datos: DatosDeContexto
  productos: ProductoDeMuestra[]
  hayProductos: boolean
  esDemo: boolean
  contexto: ContextoDeDiseno
  borrador: EstadoDelBorrador
  /** La apariencia del borrador, sin corregir el contraste: la que se ve. */
  apariencia: Apariencia
  paso: ClaveDePaso
  irAPaso: (paso: ClaveDePaso) => void
  seleccion: string | null
  /** Selecciona una sección; con `enfocar`, la vista previa la trae a la vista. */
  seleccionar: (id: string | null, opciones?: { enfocar?: boolean }) => void
  productoId: string | null
  setProductoId: (id: string) => void
  /** Lo que muestra la vista previa cuando no es el paso actual. */
  vistaForzada: Vista | null
  setVistaForzada: (vista: Vista | null) => void
  dispositivo: Dispositivo
  setDispositivo: (dispositivo: Dispositivo) => void
  /** Antes o después, en el paso de publicar. */
  comparar: "antes" | "despues"
  setComparar: (valor: "antes" | "despues") => void
  propuesta: Propuesta | null
  setPropuesta: (propuesta: Propuesta | null) => void
  /** Las acciones del servidor. Llegan de la página, que es de servidor. */
  acciones: {
    publicar: (borrador: Borrador) => Promise<ResultadoDePublicar>
    proponer: (entrada: {
      pedido: string
      borrador: Borrador
    }) => Promise<ResultadoDePropuesta>
    decidir: (entrada: { id: string; aplicada: boolean }) => Promise<void>
  }
  ia: {
    /** Pedirle algo a la IA desde cualquier lugar del editor. */
    pedir: (pedido: string) => void
    /** Lo último que se le pidió, para mostrarlo mientras piensa y al responder. */
    pedido: string
    cargando: boolean
    error: string | null
    /** Si responde el modo demo y no un modelo. */
    demo: boolean
    /** Si Venduo dejó la IA del editor activa para esta tienda. */
    estado: EstadoDeFuncion
    aplicar: () => void
    descartar: () => void
    /** Mirar la tienda sin la propuesta, para comparar. */
    mirandoAntes: boolean
    setMirandoAntes: (valor: boolean) => void
  }
  /** Publicar: lo mismo desde la barra de arriba y desde el último paso. */
  publicacion: {
    enCurso: boolean
    /** Se acaba de publicar: el último paso lo celebra. */
    lista: boolean
    /** Lo que el servidor no dejó pasar. */
    problemas: string[]
    publicar: () => void
    /** Lleva la vista previa a donde se ve un cambio de la lista. */
    mirarCambio: (cambio: LugarDeCambio) => void
  }
  /** Los textos a medida. El editor de la app todavía no los muestra. */
  textos?: TextosAMedida
  /** El último color que tocó la persona: el que se ofrece corregir. */
  ultimoColor: keyof Apariencia["colores"] | null
  setUltimoColor: (token: keyof Apariencia["colores"]) => void
}

const Contexto = React.createContext<ValorDelEditor | null>(null)

export const ProveedorDelEditor = Contexto.Provider

export function useEditor(): ValorDelEditor {
  const valor = React.useContext(Contexto)
  if (!valor) {
    throw new Error("useEditor necesita estar dentro del editor")
  }
  return valor
}
