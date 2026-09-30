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
import type { ResultadoDePublicar } from "@/app/editor/acciones"
import type { EstadoDelBorrador } from "@/components/editor/estado"

export type { ClaveDePaso } from "@/lib/editor/pasos"

/** Lo que la IA propuso y todavía no se aplicó. */
export interface Propuesta {
  id: string | null
  resumen: string
  operaciones: Operacion[]
  descripciones: string[]
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
