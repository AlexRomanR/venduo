import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import { BLOQUES_CRAYON } from "@/components/plantillas/crayon/bloques"
import { Cabecera } from "@/components/plantillas/crayon/cabecera"
import {
  Cierre,
  Encabezado,
  Pie,
  RADIO,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/crayon/piezas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/** El kit de Crayón. */
export const KIT_CRAYON: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_CRAYON,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_CRAYON,
    grilla,
    Cierre,
    marcoDeFoto: `${RADIO} bg-tinta/[0.06]`,
    plegable: {
      titulo: "¿Qué talla elijo?",
      texto:
        "Cada marca talla distinto. Dinos la edad y la estatura de quien la va a usar y te recomendamos la talla.",
    },
    textos: {
      sinProductos: "Estamos doblando la ropita",
      consulta: "¿No sabes qué talla? Dinos la edad",
      estado: "Estado de la prenda",
      sinResultados: "Nada para esa edad por ahora. Prueba con otra o ve todo.",
    },
  }),
}
