import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Perfumería de autor: decants, fragancias de nicho, aceites.
 *
 * Es la otra cara de Esencia. Donde aquella es una vitrina dorada, esta es un
 * laboratorio: papel gris de etiqueta, letras de máquina de escribir para los
 * datos, una romana fina para los nombres y un verde oliva de botica. Cada
 * frasco lleva su número, como en un recetario.
 */
export const formula: DefinicionDePlantilla = {
  nombre: "Fórmula",
  descripcion:
    "Perfumería de autor, decants y aceites. Una botica moderna: cada frasco con su etiqueta numerada y su ficha sin adornos.",
  rasgos: [
    "Nombres en una romana fina, datos a máquina",
    "Cada frasco con su etiqueta numerada",
    "Gris de etiqueta, carbón y verde oliva",
  ],
  apariencia: {
    colores: {
      papel: "#ebeae5",
      tinta: "#1c1c1a",
      senal: "#4f5a26",
      senalAlta: "#606d2f",
    },
    tipografia: {
      titular: "instrument",
      cuerpo: "geist",
      pesoTitular: 400,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
    forma: { radio: "recto" },
    disposicion: { tarjeta: "retrato", columnas: 3 },
    ficha: {
      diseno: "dividida",
      barraFija: false,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "boleta", sugerencias: false },
  },
}
