import { productosDeEjemplo } from "@/lib/editor/muestras"
import { formatMoney } from "@/lib/format"
import type { ClavePlantilla } from "@/lib/plantillas"
import type {
  DatosDeMiniatura,
  ProductoDeMiniatura,
} from "@/components/plantillas/miniatura"

/*
 * La tienda que se dibuja dentro de una miniatura de plantilla: su nombre, su
 * logo y tres productos. La usan Apariencia —con los productos de la tienda— y
 * el alta —con los de ejemplo, porque la tienda todavía no existe—. Módulo
 * neutral: sin cliente de Supabase, se importa de los dos lados.
 */

export interface FilaDeProducto {
  name: string
  price_cents: number
  compare_at_price_cents: number | null
  image_url: string | null
  product_variants: { price_cents: number | null; deleted_at: string | null }[]
}

/** Un producto como lo dibuja la miniatura: su foto, su precio y su rebaja. */
export function productoDeMuestra(fila: FilaDeProducto): ProductoDeMiniatura {
  const precios = fila.product_variants
    .filter((v) => v.deleted_at === null)
    .map((v) => v.price_cents ?? fila.price_cents)
  const desde = precios.length ? Math.min(...precios) : fila.price_cents
  const hasta = precios.length ? Math.max(...precios) : fila.price_cents
  const antes = fila.compare_at_price_cents
  return {
    foto: fila.image_url,
    precio:
      desde === hasta ? formatMoney(desde) : `Desde ${formatMoney(desde)}`,
    rebaja:
      antes && antes > fila.price_cents
        ? Math.round(((antes - fila.price_cents) / antes) * 100)
        : null,
  }
}

/**
 * La tienda para la miniatura: tres productos —primero los que tienen foto— y
 * la portada, que es la foto de un cuarto producto o, si no hay, la del
 * primero. Sin productos a la vista, los de ejemplo de su plantilla: los
 * mismos en todas las miniaturas, para comparar lo mismo vestido distinto.
 */
export function muestraDeTienda(
  nombre: string,
  logoUrl: string | null,
  plantilla: ClavePlantilla,
  filas: FilaDeProducto[]
): { muestra: DatosDeMiniatura; deEjemplo: boolean } {
  const ordenadas = [...filas].sort(
    (a, b) => Number(Boolean(b.image_url)) - Number(Boolean(a.image_url))
  )
  const deEjemplo = ordenadas.length === 0
  const fuente: FilaDeProducto[] = deEjemplo
    ? productosDeEjemplo(plantilla, "muestra").map((p) => ({
        name: p.name,
        price_cents: p.price_cents,
        compare_at_price_cents: p.compare_at_price_cents,
        image_url: p.image_url,
        product_variants: [],
      }))
    : ordenadas
  const productos = fuente.slice(0, 3).map(productoDeMuestra)
  return {
    muestra: {
      nombre,
      logoUrl,
      portada: fuente[3]?.image_url ?? fuente[0]?.image_url ?? null,
      productos,
    },
    deEjemplo,
  }
}
