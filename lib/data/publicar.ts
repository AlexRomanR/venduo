import "server-only"

import { cache } from "react"

import type { Estilo } from "@/lib/catalogos/modelo"
import { getMaterialDelCatalogo } from "@/lib/data/catalogos"
import type { ProductoParaPublicar } from "@/lib/publicar"

export interface MaterialParaPublicar {
  productos: ProductoParaPublicar[]
  tienda: {
    nombre: string
    /** El enlace de la tienda, sin marca de origen. */
    url: string
    /** El mismo, sin el protocolo, para leerlo en una imagen. */
    enlace: string
  }
  /** Los colores y la letra de la tienda: las imágenes son su publicidad. */
  estilo: Estilo
  esDemo: boolean
}

/**
 * Lo que se publica: los productos que la tienda muestra hoy, con su precio y
 * su stock, y la tienda con su estilo. Sale del mismo material que el
 * catálogo en PDF —un solo viaje, y con memoria por pedido—, pero con el
 * enlace limpio: el del catálogo lleva la marca `?o=catalogo`, y una visita
 * que llega desde una publicación no viene del catálogo. De qué red vino lo
 * dice el navegador de cada app (`detectarOrigen`).
 */
export const getMaterialParaPublicar = cache(
  async function getMaterialParaPublicar(): Promise<MaterialParaPublicar> {
    const { datos, estiloDeTienda, esDemo } = await getMaterialDelCatalogo()
    return {
      productos: Object.values(datos.productos).map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        descripcion: producto.descripcion,
        precioCents: producto.precioCents,
        precioAnteriorCents: producto.precioAnteriorCents,
        stock: producto.stock,
        foto: producto.foto,
      })),
      tienda: {
        nombre: datos.tienda.nombre,
        url: datos.tienda.url.split("?")[0],
        enlace: datos.tienda.enlace,
      },
      estilo: estiloDeTienda,
      esDemo,
    }
  }
)

/** El enlace de un producto en la tienda. */
export function enlaceDelProducto(url: string, productoId: string): string {
  return `${url}/p/${productoId}`
}
