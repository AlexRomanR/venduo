import {
  resolverApariencia,
  type Apariencia,
} from "@/lib/plantillas/apariencia"
import { atelier } from "@/lib/plantillas/atelier"
import { bazar } from "@/lib/plantillas/bazar"
import { calle } from "@/lib/plantillas/calle"
import { clasica } from "@/lib/plantillas/clasica"
import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"
import { fashion } from "@/lib/plantillas/fashion"
import { formula } from "@/lib/plantillas/formula"
import { perfume } from "@/lib/plantillas/perfume"
import { pisada } from "@/lib/plantillas/pisada"

export type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * El registro de plantillas con base en código.
 *
 * Agregar una plantilla es sumarla acá, escribir su kit en
 * `components/plantillas` y darla de alta en `templates` con una migración.
 * El tipo `ClavePlantilla` sale de este objeto, así que el registro de kits no
 * compila si le falta una.
 */
export const PLANTILLAS = {
  clasica,
  fashion,
  perfume,
  calle,
  atelier,
  pisada,
  formula,
  bazar,
} satisfies Record<string, DefinicionDePlantilla>

export type ClavePlantilla = keyof typeof PLANTILLAS

/** La base con la que se dibuja lo que no tiene base propia. */
export const PLANTILLA_DE_RESPALDO: ClavePlantilla = "clasica"

export function esClavePlantilla(valor: unknown): valor is ClavePlantilla {
  return typeof valor === "string" && Object.hasOwn(PLANTILLAS, valor)
}

/**
 * La plantilla con la que se dibuja una tienda.
 *
 * `stores.template_key` puede traer una clave del catálogo anterior, o ninguna.
 * Las dos caen en la base editorial: esas tiendas se siguen viendo como antes,
 * en vez de romperse porque su plantilla se retiró.
 */
export function plantillaDeTienda(
  clave: string | null | undefined
): ClavePlantilla {
  return esClavePlantilla(clave) ? clave : PLANTILLA_DE_RESPALDO
}

/** La apariencia final de una tienda: su base y lo que ella cambió. */
export function aparienciaDeTienda(
  clave: string | null | undefined,
  personalizacion: unknown
): Apariencia {
  return resolverApariencia(
    PLANTILLAS[plantillaDeTienda(clave)].apariencia,
    personalizacion
  )
}
