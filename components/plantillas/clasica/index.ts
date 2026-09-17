import {
  BLOQUES_CLASICOS,
  Tarjeta,
} from "@/components/plantillas/clasica/bloques"
import { Cabecera, Pie } from "@/components/plantillas/clasica/marco"
import {
  Catalogo,
  Encabezado,
  Ficha,
  Inicio,
  Vacio,
} from "@/components/plantillas/clasica/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/**
 * El kit de la base editorial.
 *
 * Es también el punto de partida de los demás: un kit nuevo toma este y
 * reemplaza solo las piezas que cambian. Así una plantilla a medio escribir se
 * ve completa, y un tipo de bloque nuevo existe en todas desde el primer día.
 */
export const KIT_CLASICO: KitDeTienda = {
  Cabecera,
  Pie,
  Inicio,
  Catalogo,
  Ficha,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_CLASICOS,
}
