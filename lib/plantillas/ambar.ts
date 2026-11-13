import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Perfumes árabes y decants.

 * Una perfumería de zoco de noche: bandas de tinta con una regla de estrellas,
 * tarjetas oscuras como una vitrina iluminada y el precio del decant primero,
 * porque se prueba antes de llevar el frasco. Arena, tinta y un púrpura oud
 * para comprar; los títulos en un cúfico geométrico.
 */
export const ambar: DefinicionDePlantilla = {
  nombre: "Ámbar",
  descripcion:
    "Perfumes árabes y decants. Bandas de noche, una regla de estrellas y el precio del decant primero.",
  rasgos: [
    "Tarjetas de tinta, como una vitrina de noche",
    "El precio del decant primero",
    "Arena, tinta y púrpura oud",
  ],
  apariencia: {
    colores: {
      papel: "#ebe3d5",
      tinta: "#1b1612",
      senal: "#4a2c7a",
      senalAlta: "#5b3893",
    },
    tipografia: {
      titular: "reemkufi",
      cuerpo: "jost",
      pesoTitular: 600,
      espaciadoTitular: "normal",
      mayusculas: false,
    },
    forma: { radio: "recto" },
    disposicion: { tarjeta: "retrato", columnas: 4 },
    ficha: {
      diseno: "dividida",
      barraFija: false,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "boleta", sugerencias: false },
  },
}
