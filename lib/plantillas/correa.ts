import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Carteras y bolsos de color.

 * Carteras para el día a día, cada una sobre su azulejo de color, como una
 * vidriera de verano. Los azulejos salen del color de la tienda —giran con
 * él— y los colores de cada modelo se ven bajo la foto. Letra ancha y
 * botones redondos.
 */
export const correa: DefinicionDePlantilla = {
  nombre: "Correa",
  descripcion:
    "Carteras y bolsos de todos los días. Cada pieza sobre un azulejo de color, con sus colores a la vista.",
  rasgos: [
    "Cada cartera sobre su azulejo de color",
    "Los colores de cada modelo bajo la foto",
    "Letra ancha y botones redondos",
  ],
  apariencia: {
    colores: {
      papel: "#fafaf8",
      tinta: "#2a1d14",
      senal: "#8a4a1c",
      senalAlta: "#a0571f",
    },
    tipografia: {
      titular: "syne",
      cuerpo: "geist",
      pesoTitular: 700,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
    forma: { radio: "redondo" },
    disposicion: { tarjeta: "retrato", columnas: 3 },
    ficha: {
      diseno: "dividida",
      barraFija: false,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "columnas", sugerencias: true },
  },
}
