import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Ropa urbana: poleras, buzos, gorras, lo que sale en tandas.
 *
 * Una tienda de calle se vende como un cartel pegado en un poste: letra de
 * afiche pesada y angosta, papel de cemento, tinta casi negra y un naranja de
 * obra para lo que se compra. Las prendas van en cuadrado y enmarcadas, como
 * un fanzine, y cada tanda se numera: "Drop 01".
 */
export const calle: DefinicionDePlantilla = {
  nombre: "Calle",
  descripcion:
    "Ropa urbana y de tanda. Letra de afiche, prendas enmarcadas como un fanzine y una cinta que corre con lo nuevo.",
  rasgos: [
    "Titulares de afiche, enormes y angostos",
    "Prendas en cuadro, con marco grueso",
    "Cemento, negro y un naranja de obra",
  ],
  apariencia: {
    colores: {
      papel: "#e9e7e2",
      tinta: "#151515",
      senal: "#b23a0e",
      senalAlta: "#d0471a",
    },
    tipografia: {
      titular: "anton",
      cuerpo: "geist",
      pesoTitular: 400,
      espaciadoTitular: "normal",
      mayusculas: true,
    },
    forma: { radio: "recto" },
    disposicion: { tarjeta: "cuadrada", columnas: 3 },
    ficha: {
      diseno: "dividida",
      barraFija: true,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "columnas", sugerencias: true },
  },
}
