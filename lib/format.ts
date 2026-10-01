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
 * La hora del sistema es la de Bolivia, que no cambia en el año: UTC−4.
 *
 * El servidor corre en UTC, así que sin esto un pedido de las nueve de la
 * noche en La Paz caía en el día siguiente y el gráfico del panel se corría.
 */
export const ZONA_HORARIA = "America/La_Paz"

/** El día de una fecha en Bolivia, como `AAAA-MM-DD`. */
export function diaEnBolivia(value: string | Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value
  // `en-CA` escribe la fecha como AAAA-MM-DD, que es lo que hace falta.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

/** `AAAA-MM-DD` corrido `dias` días, sin que la zona horaria lo mueva. */
export function sumarDias(dia: string, dias: number): string {
  const [anio, mes, numero] = dia.split("-").map(Number)
  return new Date(Date.UTC(anio, mes - 1, numero + dias))
    .toISOString()
    .slice(0, 10)
}

/**
 * Un día `AAAA-MM-DD` dicho corto: "lun 14 sep".
 *
 * Se lee al mediodía UTC y se escribe en UTC: así ninguna zona horaria lo
 * corre al día anterior.
 */
export function formatDia(
  dia: string,
  { conSemana = true }: { conSemana?: boolean } = {},
  locale = LOCALE
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: conSemana ? "short" : undefined,
    day: "numeric",
    month: "short",
  })
    .format(new Date(`${dia}T12:00:00Z`))
    .replace(/[.,]/g, "")
}

/**
 * Hace cuánto: "hace 12 min", "hace 3 h", "ayer"; pasada una semana, la fecha.
 *
 * En una lista de pedidos importa más cuánto lleva esperando que el día exacto.
 */
export function formatRelative(
  value: string | Date,
  ahora: Date = new Date(),
  locale = LOCALE
) {
  const date = typeof value === "string" ? new Date(value) : value
  const minutos = Math.round((ahora.getTime() - date.getTime()) / 60_000)

  if (minutos < 1) return "recién"

  const relativo = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "short",
  })
  if (minutos < 60) return relativo.format(-minutos, "minute")
  if (minutos < 60 * 24) {
    return relativo.format(-Math.round(minutos / 60), "hour")
  }

  const dias =
    (Date.parse(diaEnBolivia(ahora)) - Date.parse(diaEnBolivia(date))) /
    86_400_000
  if (dias < 7) return relativo.format(-dias, "day")

  return formatDia(diaEnBolivia(date), { conSemana: false }, locale)
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
