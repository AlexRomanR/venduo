import { KIT_CLASICO } from "@/components/plantillas/clasica"
import { paginasDeKit } from "@/components/plantillas/comunes/paginas"
import type { KitDeTienda } from "@/components/plantillas/kit"
import { tieneOpcion } from "@/lib/variantes"
import { BLOQUES_PROBADOR } from "@/components/plantillas/probador/bloques"
import { Cabecera } from "@/components/plantillas/probador/cabecera"
import {
  Cierre,
  Encabezado,
  Pie,
  Rotulo,
  Tarjeta,
  Titulo,
  Vacio,
  grilla,
} from "@/components/plantillas/probador/piezas"

/** El kit de Probador. */
export const KIT_PROBADOR: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_PROBADOR,
  ...paginasDeKit({
    Tarjeta,
    Vacio,
    Titulo,
    Rotulo,
    bloques: BLOQUES_PROBADOR,
    grilla,
    Cierre,
    marcoDeFoto: "rounded-[calc(var(--radio)*0.6)]",
    plegable: {
      titulo: "¿Cuál es tu talla?",
      texto:
        "Mídete el busto, la cintura y la cadera con una cinta, sin apretar. Envíanos las medidas por WhatsApp y te decimos qué talla te queda.",
      // Solo donde hay talla: en una cartera o un perfume no tiene sentido.
      cuando: (producto) => tieneOpcion(producto.opciones, "Talla"),
    },
    textos: {
      sinProductos: "La colección está por llegar",
      consulta: "¿Tienes dudas? Pregúntanos",
      sinResultados:
        "No hay nada con eso. Prueba con otra ocasión o ve toda la colección.",
    },
  }),
}
