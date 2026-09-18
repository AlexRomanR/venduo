/**
 * El precio se construye, no se fija.
 *
 *     precio publicado = costo base + comisión del promotor + take-rate
 *
 * El negocio declara **lo que quiere recibir** y los dos porcentajes salen del
 * tramo que le toca a ese costo base. El modelo está en
 * `docs/modelo-de-negocio.md`.
 *
 * **La base de datos manda.** `precio_publicado()` en Postgres calcula lo mismo
 * y es lo que se guarda; esto es para mostrarle a alguien el desglose antes de
 * guardar —el formulario de un producto, la portada— sin ir y volver al
 * servidor con cada tecla. Los tramos se leen de `pricing_tiers` y se pasan
 * hasta acá: no hay una copia de los porcentajes en el código.
 *
 * Sin dependencias de servidor: lo usan componentes de cliente.
 */

export interface Tramo {
  /** Desde qué costo base, en centavos. */
  desdeCents: number
  /** Hasta cuál. `null` es el último tramo, sin techo. */
  hastaCents: number | null
  comisionBps: number
  takeBps: number
  /** La comisión indirecta, cuando la venta la trae un comprador ya asociado. */
  indirectaBps: number
}

export interface Precio {
  baseCents: number
  comisionBps: number
  takeBps: number
  comisionCents: number
  takeCents: number
  /** El precio que ve el comprador. Es la suma exacta de los tres componentes. */
  precioCents: number
}

/** El tramo que le toca a un costo base. */
export function tramoDe(baseCents: number, tramos: Tramo[]): Tramo | null {
  const base = Math.max(Math.round(baseCents), 0)

  return (
    tramos.find(
      (tramo) =>
        base >= tramo.desdeCents &&
        (tramo.hastaCents === null || base <= tramo.hastaCents)
    ) ?? null
  )
}

/**
 * El precio publicado de un costo base.
 *
 * Cada componente se redondea al centavo y el precio es su **suma**, nunca un
 * redondeo aparte: si el total no es la suma exacta, el reparto entre negocio,
 * promotor y plataforma queda descuadrado por centavos.
 */
export function construirPrecio(baseCents: number, tramos: Tramo[]): Precio {
  const base = Math.max(Math.round(baseCents), 0)
  const tramo = tramoDe(base, tramos)

  if (!tramo) {
    // Sin tramos —modo demo sin base, o una tabla vacía— se publica al costo.
    return {
      baseCents: base,
      comisionBps: 0,
      takeBps: 0,
      comisionCents: 0,
      takeCents: 0,
      precioCents: base,
    }
  }

  const comisionCents = Math.round((base * tramo.comisionBps) / 10000)
  const takeCents = Math.round((base * tramo.takeBps) / 10000)

  return {
    baseCents: base,
    comisionBps: tramo.comisionBps,
    takeBps: tramo.takeBps,
    comisionCents,
    takeCents,
    precioCents: base + comisionCents + takeCents,
  }
}

/** Un porcentaje en puntos básicos, como se escribe en pantalla: `12%`. */
export function porcentaje(bps: number): string {
  const valor = bps / 100
  return `${Number.isInteger(valor) ? valor : valor.toFixed(1)}%`
}
