"use client"

import * as React from "react"

import type { ClaveDePaso } from "@/lib/editor/pasos"
import type { Vista } from "@/lib/editor/protocolo"
import type { Apariencia } from "@/lib/plantillas/apariencia"
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

export type { ClaveDePaso } from "@/lib/editor/pasos"

/** Lo que la IA propuso y todavía no se aplicó. */
export interface Propuesta {
  id: string | null
  resumen: string
  /** Lo que se dejó afuera y por qué, si algo se dejó. */
  aviso?: string
  operaciones: Operacion[]
  /** Cada cambio en palabras, con su color si es un color. */
  cambios: Array<{ texto: string; color?: string }>
  borrador: Borrador
  /** Las secciones que cambia, para marcarlas en la vista previa. */
  marcas: string[]
}

export interface ValorDelEditor {
  tienda: DisenoParaEditar["tienda"]
  base: Apariencia
  datos: DatosDeContexto
  productos: ProductoDeMuestra[]
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
    aplicar: () => void
    descartar: () => void
    /** Mirar la tienda sin la propuesta, para comparar. */
    mirandoAntes: boolean
    setMirandoAntes: (valor: boolean) => void
  }
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
