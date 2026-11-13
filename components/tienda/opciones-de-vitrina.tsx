import type * as React from "react"

import { cn } from "@/lib/utils"
import type { ProductoPublico } from "@/lib/data/tienda-publica"
import {
  MUESTRAS_DE_COLOR,
  fotoDe,
  hayStockDe,
  leerOpciones,
  ordenarValores,
  tipoDe,
} from "@/lib/variantes"

/**
 * Las tallas, los números o los colores de un producto, bajo su foto.
 *
 * Quien compra ropa o zapatos pregunta primero "¿hay en mi talla?": verlo en
 * la tarjeta le ahorra entrar a cada producto. Lo usan las plantillas que lo
 * piden, cada una con su forma —fichas, puntos de color o el rango "Tallas 2
 * a 6"—. Un valor sin stock en ninguna variante se tacha. Si el producto no
 * tiene esa opción, no dibuja nada: la tarjeta queda como siempre.
 *
 * No es de cliente y no lee el carrito: solo las variantes que la tienda
 * pública ya trae con cada producto.
 */

/** Los nombres de opción que cuentan para cada pedido. "Tono" es un color. */
const NOMBRES = {
  talla: ["talla"],
  numero: ["número", "numero"],
  color: ["color", "tono"],
} as const

export function OpcionesDeVitrina({
  producto,
  opcion,
  forma,
  maximo = 5,
  respaldo = null,
  className,
}: {
  producto: ProductoPublico
  opcion: keyof typeof NOMBRES
  forma: "fichas" | "puntos" | "rango"
  /** Cuántos valores se ven; los demás se cuentan: "+2". */
  maximo?: number
  /** Lo que va si el producto no tiene esa opción: "1 a 3 años". */
  respaldo?: React.ReactNode
  className?: string
}) {
  const buscada = leerOpciones(producto.opciones).find((o) =>
    (NOMBRES[opcion] as readonly string[]).includes(
      o.nombre.trim().toLowerCase()
    )
  )
  if (!buscada || buscada.valores.length === 0) return respaldo

  const valores = ordenarValores(tipoDe(buscada), buscada.valores)
  const variantes = producto.variantes ?? []
  const conStock = (valor: string) =>
    variantes.length === 0 || hayStockDe(variantes, buscada.nombre, valor, {})

  if (forma === "rango") {
    const hay = valores.filter(conStock)
    if (hay.length === 0) return respaldo
    const texto =
      hay.length === 1
        ? `${buscada.nombre} ${hay[0]}`
        : `${plural(buscada.nombre)} ${hay[0]} a ${hay[hay.length - 1]}`
    return <p className={cn("tabular text-xs", className)}>{texto}</p>
  }

  if (forma === "puntos") {
    // Cada punto es la foto de la variante o su color de la lista. Si alguno
    // no tiene ni una ni otro —un tono escrito a mano, sin foto—, un punto
    // gris no diría nada: se cuentan en palabras.
    const muestras = valores.map((valor) => ({
      valor,
      foto: fotoDe(variantes, buscada.nombre, valor),
      color: MUESTRAS_DE_COLOR[valor] ?? null,
    }))
    if (muestras.some((m) => !m.foto && !m.color)) {
      return (
        <p className={cn("text-xs opacity-75", className)}>
          {valores.length === 1
            ? `1 ${buscada.nombre.toLowerCase()}`
            : `${valores.length} ${plural(buscada.nombre).toLowerCase()}`}
        </p>
      )
    }

    const vistos = muestras.slice(0, maximo)
    const resto = muestras.length - vistos.length
    return (
      <ul
        aria-label={plural(buscada.nombre)}
        className={cn("flex items-center gap-1.5", className)}
      >
        {vistos.map(({ valor, foto, color }) => {
          const hay = conStock(valor)
          return (
            <li key={valor} className="flex">
              <span
                title={valor}
                className={cn(
                  "block size-3.5 rounded-full bg-cover bg-center ring-1 ring-tinta/25",
                  !hay && "opacity-35"
                )}
                style={
                  foto
                    ? { backgroundImage: `url("${foto}")` }
                    : { backgroundColor: color ?? undefined }
                }
              >
                <span className="sr-only">
                  {valor}
                  {hay ? "" : ", agotado"}
                </span>
              </span>
            </li>
          )
        })}
        {resto > 0 ? (
          <li className="tabular pl-0.5 text-xs opacity-70">+{resto}</li>
        ) : null}
      </ul>
    )
  }

  const vistos = valores.slice(0, maximo)
  const resto = valores.length - vistos.length

  return (
    <ul
      aria-label={plural(buscada.nombre)}
      className={cn("flex items-center gap-1", className)}
    >
      {vistos.map((valor) => {
        const hay = conStock(valor)
        return (
          <li key={valor} className="flex">
            <span
              className={cn(
                "tabular flex h-6 min-w-6 items-center justify-center rounded-[calc(var(--radio)*0.3)] border border-tinta/25 px-1 text-xs leading-none",
                !hay && "border-tinta/10 line-through opacity-45"
              )}
            >
              {valor}
            </span>
            {!hay ? <span className="sr-only">, agotado</span> : null}
          </li>
        )
      })}
      {resto > 0 ? (
        <li className="tabular pl-0.5 text-xs opacity-70">+{resto}</li>
      ) : null}
    </ul>
  )
}

/** "Talla" → "Tallas", "Color" → "Colores", "Número" → "Números". */
function plural(nombre: string): string {
  return /[aeiouáéíóú]$/i.test(nombre) ? `${nombre}s` : `${nombre}es`
}
