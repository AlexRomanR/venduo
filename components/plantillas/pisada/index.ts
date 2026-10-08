import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { BLOQUES_PISADA } from "@/components/plantillas/pisada/bloques"
import { Cabecera } from "@/components/plantillas/pisada/cabecera"
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
} from "@/components/plantillas/pisada/piezas"

/** El kit de Pisada. */
export const KIT_PISADA: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_PISADA,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_PISADA,
    grilla,
    Cierre,
    marcoDeFoto: PLACA,
    textos: {
      sinProductos: "Los modelos están en camino",
      consulta: "¿No sabes tu talla? Pregúntanos",
      estado: "Estado del par",
      sinResultados:
        "Ningún modelo coincide con lo que elegiste. Prueba con otro estilo o mira todo.",
    },
  }),
}
