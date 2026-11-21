import type { Vista } from "@/lib/editor/protocolo"
import {
  combinarApariencia,
  RUTAS_DE_AJUSTE,
  type Apariencia,
} from "@/lib/plantillas/apariencia"
import type { Borrador, Seccion } from "@/lib/plantillas/borrador"

/**
 * Qué mostrarle a la persona después de un cambio en el borrador.
 *
 * Compara estados y no escucha a cada control: así vale igual para un
 * interruptor, un campo de texto, deshacer o una propuesta aplicada, y un
 * control nuevo queda cubierto sin hacer nada.
 */
export type SenalDeCambio =
  | { tipo: "seccion"; seccion: string }
  | { tipo: "ajuste"; ruta: string; apagado: boolean }

const VISTA_DE_AJUSTE: Array<[prefijo: string, vista: Vista]> = [
  ["disposicion.", "catalogo"],
  ["ficha.", "producto"],
  ["carrito.", "carrito"],
]

/** La pantalla donde se ve un ajuste; sin ella, se ve en todas. */
export function vistaDeAjuste(ruta: string): Vista | null {
  return (
    VISTA_DE_AJUSTE.find(([prefijo]) => ruta.startsWith(prefijo))?.[1] ?? null
  )
}

function seccionTocada(antes: Seccion[], despues: Seccion[]): string | null {
  const previas = new Map(antes.map((seccion) => [seccion.id, seccion]))
  const cambiada = despues.find((seccion) => {
    const previa = previas.get(seccion.id)
    return !previa || JSON.stringify(previa) !== JSON.stringify(seccion)
  })
  if (cambiada) return cambiada.id

  const quitada = antes.find((s) => !despues.some((o) => o.id === s.id))
  if (quitada) return quitada.id

  const lugar = despues.findIndex((s, indice) => s.id !== antes[indice]?.id)
  if (lugar === -1) return null
  // Al bajar una sección, la primera diferencia es la que subió por su cuenta.
  return antes[lugar + 1]?.id === despues[lugar].id
    ? antes[lugar].id
    : despues[lugar].id
}

export function senalDelCambio(
  antes: Borrador,
  despues: Borrador,
  base: Apariencia
): SenalDeCambio | null {
  const seccion = seccionTocada(antes.secciones, despues.secciones)
  if (seccion) return { tipo: "seccion", seccion }

  if (antes.logoUrl !== despues.logoUrl) {
    return { tipo: "ajuste", ruta: "logo", apagado: false }
  }

  const previa = combinarApariencia(base, antes.personalizacion)
  const actual = combinarApariencia(base, despues.personalizacion)
  for (const ruta of RUTAS_DE_AJUSTE) {
    // Tiñen o cambian toda la tienda: se ven solos, sin nada que señalar.
    if (ruta.startsWith("colores.") || ruta.startsWith("tipografia.")) continue
    const [grupo, clave] = ruta.split(".") as [keyof Apariencia, string]
    const valor = (actual[grupo] as Record<string, unknown>)[clave]
    if ((previa[grupo] as Record<string, unknown>)[clave] !== valor) {
      return { tipo: "ajuste", ruta, apagado: valor === false }
    }
  }
  return null
}
