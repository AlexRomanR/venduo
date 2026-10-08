import { BLOQUES_BAZAR } from "@/components/plantillas/bazar/bloques"
import { Cabecera } from "@/components/plantillas/bazar/cabecera"
import {
  Cierre,
  Encabezado,
  MARCO,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/bazar/piezas"
import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"

/** El kit de Bazar. */
export const KIT_BAZAR: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_BAZAR,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_BAZAR,
    grilla,
    Cierre,
    marcoDeFoto: MARCO,
    textos: {
      sinProductos: "Estamos acomodando el mostrador",
      consulta: "¿Tienes una duda? Pregúntanos",
      estado: "Estado del producto",
      sinResultados:
        "Nada coincide con lo que buscas. Prueba con otra palabra o pregúntanos por WhatsApp.",
    },
  }),
}
