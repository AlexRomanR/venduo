import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import { BLOQUES_FORMULA } from "@/components/plantillas/formula/bloques"
import { Cabecera } from "@/components/plantillas/formula/cabecera"
import {
  Cierre,
  Encabezado,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/formula/piezas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/** El kit de Fórmula. */
export const KIT_FORMULA: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_FORMULA,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_FORMULA,
    grilla,
    Cierre,
    textos: {
      sinProductos: "El catálogo está en camino",
      consulta: "¿No sabes cuál elegir? Te asesoramos",
      sinResultados:
        "Nada coincide con lo que elegiste. Prueba con otra categoría o ve todo el catálogo.",
    },
  }),
}
