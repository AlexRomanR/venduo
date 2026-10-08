import { BLOQUES_ATELIER } from "@/components/plantillas/atelier/bloques"
import { Cabecera } from "@/components/plantillas/atelier/cabecera"
import {
  Cierre,
  Encabezado,
  PANO,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/atelier/piezas"
import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/** El kit de Atelier. */
export const KIT_ATELIER: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_ATELIER,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_ATELIER,
    grilla,
    Cierre,
    marcoDeFoto: PANO,
    fotoEntera: true,
    textos: {
      sinProductos: "La colección está en camino",
      consulta: "¿Quieres más fotos o las medidas? Pregúntanos",
      estado: "Estado de la pieza",
      sinResultados:
        "Ninguna pieza coincide con lo que elegiste. Prueba con otra línea o mira toda la colección.",
    },
  }),
}
