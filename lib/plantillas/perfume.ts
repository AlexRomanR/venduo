import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Perfumería: fragancias y cuidado personal.
 *
 * Un perfume no se prueba por internet, así que la tienda tiene que transmitir
 * lo que la foto no alcanza. Marfil en vez de blanco, una tinta de ciruela casi
 * negra, oro viejo para la acción, una antigua de alto contraste en cursiva y
 * mucho aire. El producto va sobre un pedestal, centrado, como en una vitrina.
 */
export const perfume: DefinicionDePlantilla = {
  nombre: "Esencia",
  descripcion:
    "Perfumes, fragancias y cuidado personal. Una vitrina serena, fichas con presencia y asesoría por WhatsApp.",
  rasgos: [
    "Titulares en una antigua de alto contraste",
    "Productos centrados sobre un pedestal",
    "Marfil, ciruela y oro viejo",
  ],
  apariencia: {
    colores: {
      papel: "#f4eee5",
      tinta: "#241b1f",
      senal: "#7d5c33",
      senalAlta: "#94703f",
    },
    tipografia: {
      titular: "cormorant",
      cuerpo: "jost",
      pesoTitular: 500,
      espaciadoTitular: "normal",
      mayusculas: false,
    },
    forma: { radio: "redondo" },
    disposicion: { tarjeta: "retrato", columnas: 3 },
    // Un aroma no se elige leyendo: la consulta por WhatsApp viene puesta.
    ficha: {
      diseno: "dividida",
      barraFija: false,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "columnas", sugerencias: false },
  },
}
