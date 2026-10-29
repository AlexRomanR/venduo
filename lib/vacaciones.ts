import { diaEnBolivia, sumarDias } from "@/lib/format"

/**
 * La tienda de vacaciones: se sigue viendo, pero no recibe pedidos.
 *
 * Neutral: lo leen la tienda pública, el carrito y el panel. Es la misma regla
 * que impone la base (`tienda_de_vacaciones`): está de vacaciones si las
 * empezó y todavía no llegó el día de su vuelta, contado en Bolivia. El día de
 * la vuelta ya recibe pedidos, sin que nadie escriba nada.
 */

export interface Vacaciones {
  /** Desde cuándo, como lo guarda la base. `null`: no está de vacaciones. */
  desde: string | null
  /** El día que vuelve, `AAAA-MM-DD`. `null`: sin fecha. */
  hasta: string | null
}

export function deVacaciones(
  vacaciones: Vacaciones,
  ahora: Date = new Date()
): boolean {
  if (!vacaciones.desde) return false
  return !vacaciones.hasta || diaEnBolivia(ahora) < vacaciones.hasta
}

/** El tope para la fecha de vuelta: un año. Más que eso no son vacaciones. */
export const DIAS_MAXIMOS_DE_VACACIONES = 365

/** Si un día sirve como fecha de vuelta: desde mañana, hasta un año. */
export function fechaDeVueltaValida(dia: string, ahora: Date = new Date()) {
  const hoy = diaEnBolivia(ahora)
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(dia) &&
    dia > hoy &&
    dia <= sumarDias(hoy, DIAS_MAXIMOS_DE_VACACIONES)
  )
}

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
]
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

/**
 * Un día dicho como se dice: "lunes 5 de enero". Con el año solo si no es el
 * de hoy: "lunes 4 de enero de 2027". Escrito a mano, como `formatRelative`:
 * así dice lo mismo en el servidor, en todo navegador y en la app.
 */
export function diaEnPalabras(dia: string, ahora: Date = new Date()): string {
  const [anio, mes, numero] = dia.split("-").map(Number)
  const semana = new Date(Date.UTC(anio, mes - 1, numero)).getUTCDay()
  const texto = `${DIAS[semana]} ${numero} de ${MESES[mes - 1]}`
  return String(anio) === diaEnBolivia(ahora).slice(0, 4)
    ? texto
    : `${texto} de ${anio}`
}

/** El día corto, para una fila: "5 de enero", con el año solo si no es este. */
export function diaCorto(dia: string, ahora: Date = new Date()): string {
  const [anio, mes, numero] = dia.split("-").map(Number)
  const texto = `${numero} de ${MESES[mes - 1]}`
  return String(anio) === diaEnBolivia(ahora).slice(0, 4)
    ? texto
    : `${texto} de ${anio}`
}

/** "Volvemos el lunes 5 de enero." / "Volvemos pronto." */
export function textoDeVuelta(
  hasta: string | null,
  ahora: Date = new Date()
): string {
  return hasta
    ? `Volvemos el ${diaEnPalabras(hasta, ahora)}.`
    : "Volvemos pronto."
}
