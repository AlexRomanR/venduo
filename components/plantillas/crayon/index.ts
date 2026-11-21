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
import { tieneOpcion } from "@/lib/variantes"

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
      // Solo donde hay talla: en un juguete o una mochila no tiene sentido.
      cuando: (producto) => tieneOpcion(producto.opciones, "Talla"),
    },
    textos: {
      sinProductos: "¡Ya casi está todo listo!",
      consulta: "¿Tienes dudas? Pregúntanos",
      sinResultados:
        "Nada por aquí todavía. Prueba con otra categoría o ve todo.",
    },
  }),
}
