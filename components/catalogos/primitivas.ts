import { Children, type ReactElement, type ReactNode } from "react"

import type { ClaveFuente } from "@/lib/plantillas/fuentes"

/*
 * Las cinco piezas con las que se dibuja un catálogo, y nada más.
 *
 * El mismo dibujo sale por dos lados: en HTML para la vista previa del editor,
 * que tiene que andar en un celular, y en PDF para el archivo, que se arma en
 * el servidor. Cada variante se escribe una sola vez con estas piezas, y cada
 * salida las implementa a su manera: `components/catalogos/html.tsx` con
 * `<div>` y `next/image`, `lib/catalogos/pdf.tsx` con `@react-pdf`.
 *
 * Por eso el estilo es un subconjunto cerrado de CSS que las dos entienden
 * igual: flexbox, medidas en puntos —en HTML un punto es un píxel, y la hoja
 * entera se escala—, interlineado como múltiplo y la letra por su clave. Dos
 * reglas que salen de cómo dibuja `@react-pdf`:
 *
 * - No hay `flexShrink: 0`: la biblioteca lo convierte en 1. Lo que no tiene
 *   que achicarse lleva su medida.
 * - Los componentes de las variantes no usan hooks ni contexto. El PDF los
 *   dibuja con otro reconciliador, y un hook ahí es un error de React.
 */

type Medida = number | `${number}%`

export interface EstiloDibujo {
  width?: Medida
  height?: Medida
  minWidth?: Medida
  minHeight?: Medida
  maxWidth?: Medida
  maxHeight?: Medida
  aspectRatio?: number
  flex?: number
  flexGrow?: number
  flexBasis?: Medida
  flexDirection?: "row" | "column"
  flexWrap?: "wrap" | "nowrap"
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch"
  alignSelf?: "flex-start" | "center" | "flex-end" | "stretch"
  justifyContent?:
    "flex-start" | "center" | "flex-end" | "space-between" | "space-around"
  /** Se traduce a `rowGap` y `columnGap` en las dos salidas. */
  gap?: number
  rowGap?: number
  columnGap?: number
  padding?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  paddingHorizontal?: number
  paddingVertical?: number
  margin?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  marginHorizontal?: number
  marginVertical?: number
  position?: "relative" | "absolute"
  top?: Medida
  right?: Medida
  bottom?: Medida
  left?: Medida
  backgroundColor?: string
  color?: string
  opacity?: number
  borderWidth?: number
  borderTopWidth?: number
  borderRightWidth?: number
  borderBottomWidth?: number
  borderLeftWidth?: number
  borderColor?: string
  borderStyle?: "solid" | "dashed"
  borderRadius?: number
  /** Las esquinas de arriba por separado: una foto en arco. */
  borderTopLeftRadius?: number
  borderTopRightRadius?: number
  overflow?: "hidden"
  fuente?: ClaveFuente
  fontSize?: number
  fontWeight?: number
  fontStyle?: "normal" | "italic"
  /** Un múltiplo del tamaño de la letra, como en CSS sin unidad. */
  lineHeight?: number
  /** En puntos. */
  letterSpacing?: number
  textAlign?: "left" | "center" | "right"
  textTransform?: "uppercase" | "none"
  textDecoration?: "line-through" | "none"
}

/**
 * Lo que la letra de un PDF no puede dibujar: emojis y sus uniones.
 *
 * Las tipografías del catálogo no los traen, y en el PDF saldrían como un
 * cuadro vacío. Se quitan en las dos salidas, para que la vista previa no
 * muestre algo que el archivo no va a tener.
 */
export function limpiarTexto(texto: string): string {
  return texto.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
}

/** Limpia los textos sueltos de los hijos, sin tocar los elementos. */
export function textoLimpio(hijos: ReactNode): ReactNode {
  if (typeof hijos === "string") return limpiarTexto(hijos)
  return Children.map(hijos, (hijo) =>
    typeof hijo === "string" ? limpiarTexto(hijo) : hijo
  )
}

export interface Primitivas {
  /** Una hoja del catálogo, de la medida exacta de la hoja. */
  Hoja: (props: {
    ancho: number
    alto: number
    estilo: EstiloDibujo
    children: ReactNode
  }) => ReactElement
  /** Una caja: flexbox en columna, como en `@react-pdf`. */
  Caja: (props: { estilo?: EstiloDibujo; children?: ReactNode }) => ReactElement
  /** Un párrafo. `lineas` lo corta con puntos suspensivos. */
  Texto: (props: {
    estilo?: EstiloDibujo
    lineas?: number
    children: ReactNode
  }) => ReactElement
  /** Un tramo dentro de un `Texto`: un precio tachado al lado del nuevo. */
  Tramo: (props: { estilo?: EstiloDibujo; children: ReactNode }) => ReactElement
  /** Una foto que llena su caja. Sin foto, la caja queda con su fondo. */
  Foto: (props: {
    src: string | null
    estilo: EstiloDibujo
    ajuste?: "cubrir" | "contener"
  }) => ReactElement
}
