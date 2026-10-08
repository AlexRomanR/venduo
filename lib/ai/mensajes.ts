/**
 * Lo que se le dice a la persona cuando la IA falla, según cómo falló.
 *
 * Saturación, demora y error real piden cosas distintas: las dos primeras se
 * arreglan esperando unos segundos y la tercera, quizá, pidiéndolo de otra
 * forma. Un "no pudo responder" para todo no dice qué hacer.
 */
export function mensajeDeErrorDeIa(error: unknown): string {
  const detalle = error instanceof Error ? error.message : ""

  if (/503|UNAVAILABLE|429|high demand/i.test(detalle)) {
    return "La IA está saturada en este momento. Vuelve a pedirlo en unos segundos."
  }
  if (/tardó demasiado|timed out|timeout/i.test(detalle)) {
    return "La IA está tardando más de lo normal y cortamos el pedido. Vuelve a pedirlo en un momento."
  }
  return "La IA no pudo responder ahora. Inténtalo de nuevo en un momento."
}

/**
 * El mismo aviso del lado del navegador, para cuando la respuesta no llega
 * nunca: la plataforma cortó la función y la acción terminó en una excepción.
 */
export const MENSAJE_SIN_RESPUESTA =
  "La IA no respondió a tiempo. Vuelve a pedirlo en un momento."
