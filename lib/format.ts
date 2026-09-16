/**
 * Moneda y locale del sistema.
 *
 * Constantes y no configuración por tienda: Venduo opera solo en Bolivia.
 */
export const CURRENCY = "BOB"
export const LOCALE = "es-BO"

/**
 * El símbolo suelto, para rotular el campo donde alguien escribe un monto.
 *
 * Sale del mismo formateador que `formatMoney` y no de un "Bs" escrito a mano:
 * así hay un solo lugar del que depende la moneda.
 */
export const CURRENCY_SYMBOL =
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY })
    .formatToParts(0)
    .find((parte) => parte.type === "currency")?.value ?? "Bs"

/** Formatea un monto guardado en centavos. */
export function formatMoney(
  cents: number,
  currency = CURRENCY,
  locale = LOCALE
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * Formatea una tasa guardada en puntos básicos.
 *
 * Vive acá por la misma razón que `formatMoney`: la comisión se guarda como
 * entero en puntos básicos y dividir por 100 en el JSX es justo el error que
 * termina mostrando "1000%" en una pantalla.
 */
export function formatPercent(bps: number, locale = LOCALE) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(bps / 10000)
}

/**
 * Monto abreviado, para los ejes de un gráfico.
 *
 * Un eje con "Bs 1.284.500" repetido cinco veces no deja lugar para los datos.
 * Solo se usa donde el espacio manda: el valor completo va en el tooltip y en
 * las cifras, que es donde alguien lo lee de verdad.
 */
export function formatMoneyCompact(cents: number, locale = LOCALE) {
  const valor = cents / 100
  const absoluto = Math.abs(valor)

  if (absoluto >= 1_000_000) {
    return `Bs ${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(valor / 1_000_000)}M`
  }
  if (absoluto >= 1_000) {
    return `Bs ${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(valor / 1_000)}k`
  }
  return `Bs ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(valor)}`
}

/** Entero abreviado, por la misma razón que el monto. */
export function formatNumberCompact(value: number, locale = LOCALE) {
  if (Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1_000_000)}M`
  }
  if (Math.abs(value) >= 10_000) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / 1_000)}k`
  }
  return new Intl.NumberFormat(locale).format(value)
}

export function formatNumber(value: number, locale = LOCALE) {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDate(value: string | Date, locale = LOCALE) {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
  }).format(date)
}

/**
 * Saca el slug de una tienda de lo que una persona pegue.
 *
 * El vendedor recibe la tienda por WhatsApp, así que puede llegar el enlace
 * entero, el enlace sin protocolo o solo el nombre. Exigir un formato sería
 * trasladarle a él un trabajo que el sistema puede hacer.
 */
export function storeSlugFromInput(value: string) {
  const limpio = value.trim()
  if (!limpio) return ""

  const match = limpio.match(/\/t\/([^/?#\s]+)/i)
  if (match) return slugify(decodeURIComponent(match[1]))

  // El enlace de invitación lleva la tienda en `?t=`.
  const porParametro = limpio.match(/[?&]t=([^&#\s]+)/i)
  if (porParametro) return slugify(decodeURIComponent(porParametro[1]))

  // Un enlace sin `/t/` no sirve: se queda con el último tramo, sin la cadena
  // de consulta, que es lo más probable que sea el nombre.
  const sinConsulta = limpio.split(/[?#]/)[0]
  const ultimo = sinConsulta.split("/").filter(Boolean).pop() ?? sinConsulta
  return slugify(ultimo)
}

/**
 * Saca el código de invitación de un enlace, si lo trae.
 *
 * Es lo que distingue "me pasaron el enlace de la tienda" de "me invitaron":
 * la URL pública está en el código QR y la tiene cualquiera, el código de
 * invitación solo lo tiene quien lo recibió del dueño.
 */
export function inviteCodeFromInput(value: string) {
  const match = value.trim().match(/[?&]inv=([A-Za-z0-9]+)/i)
  return match ? match[1].toUpperCase() : null
}

/** Convierte un nombre en un slug apto para URL. */
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
