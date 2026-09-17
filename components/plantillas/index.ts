import { plantillaDeTienda, type ClavePlantilla } from "@/lib/plantillas"
import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { KIT_FASHION } from "@/components/plantillas/fashion"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { KIT_PERFUME } from "@/components/plantillas/perfume"

/**
 * Qué kit dibuja cada plantilla.
 *
 * Tipado contra `ClavePlantilla`: una plantilla registrada en `lib/plantillas`
 * sin su kit no compila. Es la única tabla que relaciona una clave con
 * componentes; ninguna página pregunta qué plantilla tiene la tienda.
 */
const KITS: Record<ClavePlantilla, KitDeTienda> = {
  clasica: KIT_CLASICO,
  fashion: KIT_FASHION,
  perfume: KIT_PERFUME,
}

export function kitDePlantilla(clave: string | null | undefined): KitDeTienda {
  return KITS[plantillaDeTienda(clave)]
}

export type { KitDeTienda } from "@/components/plantillas/kit"
