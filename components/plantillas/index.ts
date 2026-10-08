import { plantillaDeTienda, type ClavePlantilla } from "@/lib/plantillas"
import { KIT_ATELIER } from "@/components/plantillas/atelier"
import { KIT_BAZAR } from "@/components/plantillas/bazar"
import { KIT_CALLE } from "@/components/plantillas/calle"
import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { KIT_FASHION } from "@/components/plantillas/fashion"
import { KIT_FORMULA } from "@/components/plantillas/formula"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { KIT_PERFUME } from "@/components/plantillas/perfume"
import { KIT_PISADA } from "@/components/plantillas/pisada"

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
  calle: KIT_CALLE,
  atelier: KIT_ATELIER,
  pisada: KIT_PISADA,
  formula: KIT_FORMULA,
  bazar: KIT_BAZAR,
}

export function kitDePlantilla(clave: string | null | undefined): KitDeTienda {
  return KITS[plantillaDeTienda(clave)]
}

export type { KitDeTienda } from "@/components/plantillas/kit"
