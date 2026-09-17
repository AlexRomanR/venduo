import { KIT_CLASICO } from "@/components/plantillas/clasica"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { BLOQUES_PERFUME } from "@/components/plantillas/perfume/bloques"
import { Cabecera } from "@/components/plantillas/perfume/cabecera"
import {
  Catalogo,
  Ficha,
  Inicio,
} from "@/components/plantillas/perfume/paginas"
import {
  Encabezado,
  Pie,
  Tarjeta,
  Vacio,
} from "@/components/plantillas/perfume/piezas"

/**
 * El kit de Esencia. Toma de la base solo el bloque de contacto, que ya se
 * dibuja bien con sus tokens.
 */
export const KIT_PERFUME: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Inicio,
  Catalogo,
  Ficha,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_PERFUME,
}
