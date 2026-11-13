import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import { BLOQUES_CORREA } from "@/components/plantillas/correa/bloques"
import { Cabecera } from "@/components/plantillas/correa/cabecera"
import {
  Cierre,
  Encabezado,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/correa/piezas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/** El kit de Correa. */
export const KIT_CORREA: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_CORREA,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_CORREA,
    grilla,
    Cierre,
    marcoDeFoto: "rounded-[1.25rem] bg-tinta/[0.04]",
    textos: {
      sinProductos: "Las carteras están en camino",
      consulta: "¿Quieres saber las medidas? Pregúntanos",
      estado: "Estado de la cartera",
      sinResultados:
        "Ninguna cartera con eso. Prueba con otro tamaño o ve todas.",
    },
  }),
}
