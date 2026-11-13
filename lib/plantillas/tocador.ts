import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Maquillaje y skincare.

 * El tocador de casa: las categorías como los pasos de una rutina, en orden,
 * y los tonos de cada producto a la vista para elegir sin probar. Leche, un
 * rojo labial para comprar y una serif de trazo suave.
 */
export const tocador: DefinicionDePlantilla = {
  nombre: "Tocador",
  descripcion:
    "Maquillaje y skincare. La rutina en pasos numerados, los tonos de cada producto a la vista y ayuda con el tono por WhatsApp.",
  rasgos: [
    "Las categorías como pasos de una rutina",
    "Los tonos de cada producto bajo la foto",
    "Leche, rojo labial y una serif suave",
  ],
  apariencia: {
    colores: {
      papel: "#fdf8f5",
      tinta: "#2b1418",
      senal: "#b3121f",
      senalAlta: "#c8202d",
    },
    tipografia: {
      titular: "fraunces",
      cuerpo: "geist",
      pesoTitular: 600,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
    forma: { radio: "redondo" },
    disposicion: { tarjeta: "cuadrada", columnas: 4 },
    ficha: {
      diseno: "dividida",
      barraFija: true,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "columnas", sugerencias: true },
  },
}
