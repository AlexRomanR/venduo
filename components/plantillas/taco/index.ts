import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { BLOQUES_TACO } from "@/components/plantillas/taco/bloques"
import { Cabecera } from "@/components/plantillas/taco/cabecera"
import {
  Cierre,
  Encabezado,
  PLACA,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/taco/piezas"

/** El kit de Taco. */
export const KIT_TACO: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_TACO,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_TACO,
    grilla,
    Cierre,
    marcoDeFoto: PLACA,
    plegable: {
      titulo: "¿Qué número eres?",
      texto:
        "Pon el pie sobre una hoja, marca el talón y la punta del dedo más largo, y mide en centímetros. Envíanos la medida y te decimos qué número te queda.",
    },
    textos: {
      sinProductos: "los pares están en camino",
      consulta: "¿Dudas con tu número? Pregúntanos",
      estado: "Estado del par",
      sinResultados:
        "Ningún par con eso. Prueba con otro tipo de taco o ve todos.",
    },
  }),
}
