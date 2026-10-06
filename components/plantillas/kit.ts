import type { ComponentType } from "react"

import type { FiltrosDeCatalogo } from "@/lib/catalogo"
import type {
  BloquePublico,
  MarcoDeTienda,
  TiendaPublica,
} from "@/lib/data/tienda-publica"
import type { TipoDeBloque } from "@/lib/plantillas/bloques"
import type { Product } from "@/types"

/**
 * El kit de una plantilla: las piezas con las que dibuja una tienda.
 *
 * Las páginas de `app/t/[slug]` no saben qué plantilla tiene la tienda. Piden
 * el kit con `kitDePlantilla` y componen sus piezas; la diferencia entre una
 * plantilla y otra vive entera acá, en vez de repartida en condicionales por
 * cada pantalla.
 *
 * Lo que es igual en todas —el carrito, el checkout, el pago— no es parte del
 * kit: son componentes compartidos que toman la identidad de los tokens.
 */
export interface KitDeTienda {
  /** Es de cliente: muestra el contador del carrito. */
  Cabecera: ComponentType<PropsCabecera>
  Pie: ComponentType<PropsPie>
  /** La portada: cómo se ordenan los bloques y qué va alrededor. */
  Inicio: ComponentType<PropsInicio>
  /** El listado completo, con filtros. */
  Catalogo: ComponentType<PropsCatalogo>
  /** El detalle de un producto. */
  Ficha: ComponentType<PropsFicha>
  Tarjeta: ComponentType<PropsTarjeta>
  /** El título de una pantalla que no es la portada: carrito, pedido. */
  Encabezado: ComponentType<PropsEncabezado>
  /** Lo que se ve cuando no hay nada que mostrar. */
  Vacio: ComponentType<PropsVacio>
  /** Un componente por tipo de bloque. Todos, para que ninguno se pierda. */
  bloques: Record<TipoDeBloque, ComponentType<PropsBloque>>
}

export interface PropsCabecera {
  marco: MarcoDeTienda
  /** En el carrito y en el pago no se ofrece volver al carrito. */
  enlaceDelCarrito?: boolean
}

export interface PropsPie {
  marco: MarcoDeTienda
}

export interface PropsInicio {
  tienda: TiendaPublica
  filtros: FiltrosDeCatalogo
}

export interface PropsCatalogo {
  tienda: TiendaPublica
  filtros: FiltrosDeCatalogo
  /** Ya filtrados y ordenados. */
  productos: Product[]
}

export interface PropsFicha {
  tienda: TiendaPublica
  producto: Product
  relacionados: Product[]
}

export interface PropsTarjeta {
  producto: Product
  tienda: TiendaPublica
}

export interface PropsBloque {
  bloque: BloquePublico
  tienda: TiendaPublica
}

export interface PropsEncabezado {
  antetitulo?: string
  titulo: string
  bajada?: string
}

export interface PropsVacio {
  titulo: string
  texto: string
  accion?: { etiqueta: string; href: string }
}
