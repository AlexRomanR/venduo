import { BLOQUES_AMBAR } from "@/components/plantillas/ambar/bloques"
import { Cabecera } from "@/components/plantillas/ambar/cabecera"
import {
  Cierre,
  Encabezado,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
  seVendePorMl,
} from "@/components/plantillas/ambar/piezas"
import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/** El kit de Ámbar. */
export const KIT_AMBAR: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_AMBAR,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_AMBAR,
    grilla,
    Cierre,
    marcoDeFoto: "bg-tinta/[0.06]",
    plegable: {
      titulo: "¿Qué es un decant?",
      texto:
        "Es el mismo perfume, pasado de su frasco original a uno más chico. Sirve para usarlo varios días antes de llevar el frasco entero.",
      cuando: seVendePorMl,
    },
    textos: {
      sinProductos: "Los frascos están en camino",
      consulta: "¿No sabes cuál elegir? Te asesoramos",
      estado: "Estado del frasco",
      sinResultados:
        "Ningún perfume de esa familia por ahora. Prueba con otra o ve todos.",
    },
  }),
}
