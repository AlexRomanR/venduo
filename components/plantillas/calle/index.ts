import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { BLOQUES_CALLE } from "@/components/plantillas/calle/bloques"
import { Cabecera } from "@/components/plantillas/calle/cabecera"
import {
  Cierre,
  Encabezado,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/calle/piezas"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/** El kit de Calle. */
export const KIT_CALLE: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_CALLE,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_CALLE,
    grilla,
    Cierre,
    textos: {
      sinProductos: "Se viene la primera tanda",
      consulta: "¿Dudas con la talla? Pregúntanos",
      estado: "Estado de la prenda",
      sinResultados:
        "Nada coincide con lo que elegiste. Prueba con otra sección o mira todo.",
    },
  }),
}
