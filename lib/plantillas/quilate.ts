import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Joyas y accesorios.
 *
 * Una joya se compra de cerca: el brillo del metal, el cierre, cómo cae puesta.
 * La tienda es un mostrador de joyería sin dorados: papel perla, tinta casi
 * negra y un grafito para comprar, para que la única joya de la página sea la
 * que se vende. Los títulos en una romana de inscripción, en mayúsculas y con
 * aire, y cada pieza en cuadrado, entera.
 */
export const quilate: DefinicionDePlantilla = {
  nombre: "Quilate",
  descripcion:
    "Joyas y accesorios. La pieza de cerca, cómo se ve puesta en un círculo, y el material en un sello.",
  rasgos: [
    "La pieza de cerca y puesta, en un círculo",
    "Categorías por dónde se lleva, con íconos",
    "Perla y grafito: la única joya es la tuya",
  ],
  apariencia: {
    colores: {
      papel: "#f5f4f2",
      tinta: "#1a1a1a",
      senal: "#4a4744",
      senalAlta: "#5c5955",
    },
    tipografia: {
      titular: "marcellus",
      cuerpo: "jost",
      pesoTitular: 400,
      espaciadoTitular: "abierto",
      mayusculas: true,
    },
    forma: { radio: "suave" },
    disposicion: { tarjeta: "cuadrada", columnas: 4 },
    // La vitrina: una joya se mira entera y al centro, no al lado del texto.
    ficha: {
      diseno: "vitrina",
      barraFija: false,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "boleta", sugerencias: false },
  },
}
