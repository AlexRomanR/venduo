import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { BLOQUES_FASHION } from "@/components/plantillas/fashion/bloques"
import { Cabecera } from "@/components/plantillas/fashion/cabecera"
import {
  Catalogo,
  Ficha,
  Inicio,
} from "@/components/plantillas/fashion/paginas"
import {
  Encabezado,
  Pie,
  Tarjeta,
  Vacio,
} from "@/components/plantillas/fashion/piezas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/** El kit de Pasarela: todas sus piezas son propias. */
export const KIT_FASHION: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Inicio,
  Catalogo,
  Ficha,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_FASHION,
}
