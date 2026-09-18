"use client"

import * as React from "react"

import type { ProductoMarketplace } from "@/lib/marketplace"

export interface LineaMarketplace {
  productoId: string
  nombre: string
  precioCents: number
  imagen: string | null
  stock: number
  cantidad: number
  negocioId: string
  negocioNombre: string
  negocioSlug: string
  referido: string | null
}

interface CarritoMarketplace {
  lineas: LineaMarketplace[]
  unidades: number
  subtotalCents: number
  listo: boolean
  agregar: (
    producto: ProductoMarketplace,
    cantidad: number,
    referido?: string | null
  ) => void
  cambiar: (
    productoId: string,
    referido: string | null,
    cantidad: number
  ) => void
  quitar: (productoId: string, referido: string | null) => void
  vaciar: () => void
}

const Contexto = React.createContext<CarritoMarketplace | null>(null)
const CLAVE = "venduo:marketplace:carrito"

function esLinea(valor: unknown): valor is LineaMarketplace {
  if (!valor || typeof valor !== "object") return false
  const fila = valor as Record<string, unknown>
  return (
    typeof fila.productoId === "string" &&
    typeof fila.nombre === "string" &&
    typeof fila.precioCents === "number" &&
    typeof fila.stock === "number" &&
    typeof fila.cantidad === "number" &&
    typeof fila.negocioId === "string" &&
    typeof fila.negocioNombre === "string" &&
    typeof fila.negocioSlug === "string" &&
    (fila.referido === null || typeof fila.referido === "string")
  )
}

export function ProveedorCarritoMarketplace({
  children,
}: {
  children: React.ReactNode
}) {
  const [lineas, setLineas] = React.useState<LineaMarketplace[]>([])
  const [listo, setListo] = React.useState(false)

  React.useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE)
      const datos: unknown = guardado ? JSON.parse(guardado) : []
      if (Array.isArray(datos)) setLineas(datos.filter(esLinea))
    } catch {
      // Un almacenamiento bloqueado no impide comprar durante esta pestaña.
    }
    setListo(true)
  }, [])

  React.useEffect(() => {
    if (!listo) return
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(lineas))
    } catch {
      // El carrito sigue vivo en memoria aunque el navegador bloquee storage.
    }
  }, [lineas, listo])

  const valor = React.useMemo<CarritoMarketplace>(() => {
    const unidades = lineas.reduce((total, linea) => total + linea.cantidad, 0)
    const subtotalCents = lineas.reduce(
      (total, linea) => total + linea.precioCents * linea.cantidad,
      0
    )

    return {
      lineas,
      unidades,
      subtotalCents,
      listo,
      agregar(producto, cantidad, referido = null) {
        const limpio = referido?.trim().toUpperCase() || null
        setLineas((actuales) => {
          const indice = actuales.findIndex(
            (linea) =>
              linea.productoId === producto.id && linea.referido === limpio
          )
          if (indice < 0) {
            return [
              ...actuales,
              {
                productoId: producto.id,
                nombre: producto.nombre,
                precioCents: producto.precioCents,
                imagen: producto.imagenUrl,
                stock: producto.stock,
                cantidad: Math.min(Math.max(cantidad, 1), producto.stock),
                negocioId: producto.negocio.id,
                negocioNombre: producto.negocio.nombre,
                negocioSlug: producto.negocio.slug,
                referido: limpio,
              },
            ]
          }

          return actuales.map((linea, posicion) =>
            posicion === indice
              ? {
                  ...linea,
                  cantidad: Math.min(linea.cantidad + cantidad, producto.stock),
                  precioCents: producto.precioCents,
                  stock: producto.stock,
                }
              : linea
          )
        })
      },
      cambiar(productoId, referido, cantidad) {
        setLineas((actuales) =>
          actuales.flatMap((linea) => {
            if (
              linea.productoId !== productoId ||
              linea.referido !== referido
            ) {
              return [linea]
            }
            const nueva = Math.min(Math.max(cantidad, 0), linea.stock)
            return nueva === 0 ? [] : [{ ...linea, cantidad: nueva }]
          })
        )
      },
      quitar(productoId, referido) {
        setLineas((actuales) =>
          actuales.filter(
            (linea) =>
              linea.productoId !== productoId || linea.referido !== referido
          )
        )
      },
      vaciar() {
        setLineas([])
      },
    }
  }, [lineas, listo])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useCarritoMarketplace() {
  const contexto = React.useContext(Contexto)
  if (!contexto) {
    throw new Error("El carrito del Marketplace necesita su proveedor")
  }
  return contexto
}
