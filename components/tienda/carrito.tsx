"use client"

import * as React from "react"

export interface LineaCarrito {
  productoId: string
  nombre: string
  precioCents: number
  imagen: string | null
  cantidad: number
  /** El stock al momento de agregarlo. Solo para no dejar pedir de más acá. */
  stock: number
}

interface EstadoCarrito {
  lineas: LineaCarrito[]
  unidades: number
  subtotalCents: number
  listo: boolean
  agregar: (linea: Omit<LineaCarrito, "cantidad">, cantidad: number) => void
  cambiar: (productoId: string, cantidad: number) => void
  quitar: (productoId: string) => void
  vaciar: () => void
}

const Contexto = React.createContext<EstadoCarrito | null>(null)

/**
 * El carrito vive en el navegador, por tienda.
 *
 * No en la base: obligaría a identificar a un comprador que no da ningún dato,
 * y a limpiar carritos abandonados. Lo que sí se guarda en la base es el
 * pedido que se manda por WhatsApp, y ahí `create_order` recalcula cada
 * precio desde el catálogo — lo que el carrito diga de los montos es solo
 * para mostrar.
 *
 * La clave incluye el slug porque una misma persona puede estar comprando en
 * dos tiendas a la vez desde la misma pestaña.
 */
export function ProveedorCarrito({
  slug,
  muestra,
  children,
}: {
  slug: string
  /**
   * Un carrito de ejemplo que vive solo en memoria: ni se lee ni se escribe
   * el del navegador. Es el de la vista previa del editor, donde el dueño mira
   * su tienda y no tiene que encontrarse después su propio carrito tocado.
   */
  muestra?: LineaCarrito[]
  children: React.ReactNode
}) {
  const clave = `venduo:carrito:${slug}`

  const [lineas, setLineas] = React.useState<LineaCarrito[]>(muestra ?? [])
  // Hasta que no se leyó el almacenamiento no se dibuja el contador: pintar
  // cero y corregirlo un instante después se ve como un parpadeo, y en la
  // primera pantalla de una tienda eso parece un error.
  const [listo, setListo] = React.useState(Boolean(muestra))
  const deMuestra = Boolean(muestra)

  React.useEffect(() => {
    if (deMuestra) return
    try {
      const crudo = window.localStorage.getItem(clave)
      if (crudo) {
        const datos = JSON.parse(crudo) as { lineas?: LineaCarrito[] }
        setLineas(Array.isArray(datos.lineas) ? datos.lineas : [])
      }
    } catch {
      // Almacenamiento bloqueado o contenido corrupto: se empieza vacío. Un
      // carrito perdido es molesto; una tienda que no abre es peor.
    }
    setListo(true)
  }, [clave, deMuestra])

  React.useEffect(() => {
    if (!listo || deMuestra) return
    try {
      window.localStorage.setItem(clave, JSON.stringify({ lineas }))
    } catch {
      // Sin almacenamiento el carrito dura lo que dure la pestaña.
    }
  }, [clave, lineas, listo, deMuestra])

  const valor = React.useMemo<EstadoCarrito>(() => {
    const unidades = lineas.reduce((total, l) => total + l.cantidad, 0)
    const subtotalCents = lineas.reduce(
      (total, l) => total + l.precioCents * l.cantidad,
      0
    )

    return {
      lineas,
      unidades,
      subtotalCents,
      listo,

      agregar(linea, cantidad) {
        setLineas((previas) => {
          const existente = previas.find(
            (l) => l.productoId === linea.productoId
          )
          if (!existente) return [...previas, { ...linea, cantidad }]

          // Nunca más de lo que hay: el tope real lo impone `create_order`,
          // pero avisar acá evita un pedido que va a fallar.
          return previas.map((l) =>
            l.productoId === linea.productoId
              ? {
                  ...l,
                  cantidad: Math.min(l.cantidad + cantidad, linea.stock),
                  precioCents: linea.precioCents,
                  stock: linea.stock,
                }
              : l
          )
        })
      },

      cambiar(productoId, cantidad) {
        setLineas((previas) =>
          previas.flatMap((l) => {
            if (l.productoId !== productoId) return [l]
            const nueva = Math.min(Math.max(cantidad, 0), l.stock)
            return nueva === 0 ? [] : [{ ...l, cantidad: nueva }]
          })
        )
      },

      quitar(productoId) {
        setLineas((previas) =>
          previas.filter((l) => l.productoId !== productoId)
        )
      },

      vaciar() {
        // Si ya está vacío no se asigna nada. Un `[]` nuevo cambia el estado
        // aunque el contenido sea el mismo, y eso rehace el contexto, que
        // vuelve a disparar el efecto que llamó acá: bucle infinito.
        setLineas((previas) => (previas.length === 0 ? previas : []))
      },
    }
  }, [lineas, listo])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useCarrito() {
  const valor = React.useContext(Contexto)
  if (!valor) {
    throw new Error("useCarrito necesita estar dentro de ProveedorCarrito")
  }
  return valor
}
