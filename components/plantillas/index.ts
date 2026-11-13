import { plantillaDeTienda, type ClavePlantilla } from "@/lib/plantillas"
import { KIT_AMBAR } from "@/components/plantillas/ambar"
import { KIT_ATELIER } from "@/components/plantillas/atelier"
import { KIT_BAZAR } from "@/components/plantillas/bazar"
import { KIT_CALLE } from "@/components/plantillas/calle"
import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { KIT_CORREA } from "@/components/plantillas/correa"
import { KIT_CRAYON } from "@/components/plantillas/crayon"
import { KIT_FASHION } from "@/components/plantillas/fashion"
import { KIT_FORMULA } from "@/components/plantillas/formula"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { KIT_PERFUME } from "@/components/plantillas/perfume"
import { KIT_PISADA } from "@/components/plantillas/pisada"
import { KIT_PROBADOR } from "@/components/plantillas/probador"
import { KIT_QUILATE } from "@/components/plantillas/quilate"
import { KIT_TACO } from "@/components/plantillas/taco"
import { KIT_TOCADOR } from "@/components/plantillas/tocador"

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
  quilate: KIT_QUILATE,
  probador: KIT_PROBADOR,
  ambar: KIT_AMBAR,
  correa: KIT_CORREA,
  taco: KIT_TACO,
  tocador: KIT_TOCADOR,
  crayon: KIT_CRAYON,
}

export function kitDePlantilla(clave: string | null | undefined): KitDeTienda {
  return KITS[plantillaDeTienda(clave)]
}

export type { KitDeTienda } from "@/components/plantillas/kit"
