import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Ropa de niños y bebés.

 * La ropa de quienes crecen se elige por edad: un tallímetro para buscar, un
 * garabato de crayón bajo los títulos y todo redondito. Es la única con el
 * papel frío —un celeste nube— y el verde hoja para comprar.
 */
export const crayon: DefinicionDePlantilla = {
  nombre: "Crayón",
  descripcion:
    "Ropa de bebés y de niñas y niños. Se busca por edad en un tallímetro, con tarjetas redondas y garabatos de crayón.",
  rasgos: [
    "Un tallímetro para buscar por edad",
    "La talla o la edad en cada tarjeta",
    "Celeste, verde hoja y letra redonda",
  ],
  apariencia: {
    colores: {
      papel: "#edf4f6",
      tinta: "#1b2a33",
      senal: "#357018",
      senalAlta: "#3f7f1d",
    },
    tipografia: {
      titular: "fredoka",
      cuerpo: "geist",
      pesoTitular: 600,
      espaciadoTitular: "normal",
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
    carrito: { diseno: "pasos", sugerencias: true },
  },
}
