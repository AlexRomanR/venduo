import Image from "next/image"
import type { CSSProperties } from "react"

import { FUENTES } from "@/lib/plantillas/fuentes"
import {
  textoLimpio,
  type EstiloDibujo,
  type Primitivas,
} from "@/components/catalogos/primitivas"

/*
 * Las piezas del catálogo en HTML, para la vista previa del editor.
 *
 * Imitan cómo dibuja `@react-pdf`: toda caja es flexbox en columna, el ancho
 * incluye el relleno, y nada tiene un mínimo por su contenido —en CSS un ítem
 * de flex no se achica por debajo de su contenido, y en el PDF sí—. Un punto
 * es un píxel: la hoja se dibuja a su medida real y el editor la escala entera.
 */

function medida(valor: number | string | undefined) {
  if (valor === undefined) return undefined
  return typeof valor === "number" ? `${valor}px` : valor
}

/** Traduce el estilo de dibujo a CSS. */
function aCss(estilo: EstiloDibujo = {}): CSSProperties {
  const {
    fuente,
    gap,
    rowGap,
    columnGap,
    paddingHorizontal,
    paddingVertical,
    marginHorizontal,
    marginVertical,
    lineHeight,
    letterSpacing,
    borderStyle,
    ...resto
  } = estilo

  const css: CSSProperties = {}
  for (const [clave, valor] of Object.entries(resto)) {
    if (valor === undefined) continue
    const propiedad = clave as keyof CSSProperties
    ;(css as Record<string, unknown>)[propiedad] =
      typeof valor === "number" &&
      !["flex", "flexGrow", "opacity", "fontWeight", "aspectRatio"].includes(
        clave
      )
        ? `${valor}px`
        : valor
  }

  if (fuente) css.fontFamily = `var(${FUENTES[fuente].variable})`
  if (lineHeight !== undefined) css.lineHeight = lineHeight
  if (letterSpacing !== undefined) css.letterSpacing = `${letterSpacing}px`
  if (gap !== undefined) {
    css.rowGap = `${gap}px`
    css.columnGap = `${gap}px`
  }
  if (rowGap !== undefined) css.rowGap = `${rowGap}px`
  if (columnGap !== undefined) css.columnGap = `${columnGap}px`
  if (paddingHorizontal !== undefined) {
    css.paddingLeft ??= medida(paddingHorizontal)
    css.paddingRight ??= medida(paddingHorizontal)
  }
  if (paddingVertical !== undefined) {
    css.paddingTop ??= medida(paddingVertical)
    css.paddingBottom ??= medida(paddingVertical)
  }
  if (marginHorizontal !== undefined) {
    css.marginLeft ??= medida(marginHorizontal)
    css.marginRight ??= medida(marginHorizontal)
  }
  if (marginVertical !== undefined) {
    css.marginTop ??= medida(marginVertical)
    css.marginBottom ??= medida(marginVertical)
  }

  // En CSS un borde sin estilo no se ve; en el PDF, sí.
  const hayBorde = [
    estilo.borderWidth,
    estilo.borderTopWidth,
    estilo.borderRightWidth,
    estilo.borderBottomWidth,
    estilo.borderLeftWidth,
  ].some((ancho) => ancho !== undefined && ancho > 0)
  if (hayBorde) css.borderStyle = borderStyle ?? "solid"

  return css
}

/** Lo que toda caja trae en `@react-pdf` y en CSS hay que pedir. */
const CAJA: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxSizing: "border-box",
  minWidth: 0,
  minHeight: 0,
}

export const html: Primitivas = {
  Hoja: ({ ancho, alto, estilo, children }) => (
    <div
      style={{
        ...CAJA,
        ...aCss(estilo),
        width: ancho,
        height: alto,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  ),

  Caja: ({ estilo, children }) => (
    <div style={{ ...CAJA, ...aCss(estilo) }}>{children}</div>
  ),

  Texto: ({ estilo, lineas, children }) => (
    <div
      style={{
        margin: 0,
        boxSizing: "border-box",
        // El PDF respeta los saltos de línea y los espacios tal como vienen.
        whiteSpace: "pre-wrap",
        ...aCss(estilo),
        ...(lineas
          ? {
              display: "-webkit-box",
              WebkitLineClamp: lineas,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }
          : {}),
      }}
    >
      {textoLimpio(children)}
    </div>
  ),

  Tramo: ({ estilo, children }) => (
    <span style={aCss(estilo)}>{textoLimpio(children)}</span>
  ),

  Foto: ({ src, estilo, ajuste = "cubrir" }) => (
    <div style={{ ...CAJA, ...aCss(estilo), overflow: "hidden" }}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          // La hoja se dibuja a su medida en puntos y se escala entera: el
          // ancho de la caja es un buen límite para la variante que se pide.
          sizes={`${typeof estilo.width === "number" ? Math.round(estilo.width * 1.5) : 400}px`}
          style={{ objectFit: ajuste === "cubrir" ? "cover" : "contain" }}
        />
      ) : null}
    </div>
  ),
}
