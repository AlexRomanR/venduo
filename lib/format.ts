/** Formatea un monto guardado en centavos. */
export function formatMoney(cents: number, currency = "ARS", locale = "es-AR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatNumber(value: number, locale = "es-AR") {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDate(value: string | Date, locale = "es-AR") {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
  }).format(date)
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
