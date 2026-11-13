import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { BLOQUES_TOCADOR } from "@/components/plantillas/tocador/bloques"
import { Cabecera } from "@/components/plantillas/tocador/cabecera"
import {
  Cierre,
  Encabezado,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/tocador/piezas"

/** El kit de Tocador. */
export const KIT_TOCADOR: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_TOCADOR,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_TOCADOR,
    grilla,
    Cierre,
    marcoDeFoto: "rounded-[1.25rem] bg-tinta/[0.04]",
    textos: {
      sinProductos: "Estamos armando el tocador",
      consulta: "¿No sabes tu tono? Mándanos una foto",
      estado: "Estado del producto",
      sinResultados: "Nada en ese paso por ahora. Prueba con otro o ve todo.",
    },
  }),
}
