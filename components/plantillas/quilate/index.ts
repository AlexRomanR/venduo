import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { BLOQUES_QUILATE } from "@/components/plantillas/quilate/bloques"
import { Cabecera } from "@/components/plantillas/quilate/cabecera"
import {
  Cierre,
  ESTUCHE,
  Encabezado,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/quilate/piezas"

/** El kit de Quilate. */
export const KIT_QUILATE: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_QUILATE,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_QUILATE,
    grilla,
    Cierre,
    marcoDeFoto: ESTUCHE,
    fotoEntera: false,
    plegable: {
      titulo: "Cuidados",
      texto:
        "Guárdala seca y separada de las demás piezas. Póntela después del perfume y la crema.",
    },
    textos: {
      sinProductos: "Las piezas están en camino",
      consulta: "¿Quieres verla de cerca? Pregúntanos",
      estado: "Estado de la pieza",
      sinResultados:
        "Ninguna pieza con eso. Prueba con otra categoría o ve todas.",
    },
  }),
}
