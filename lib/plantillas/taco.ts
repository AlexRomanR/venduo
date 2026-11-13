import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Zapatos de mujer.

 * Una zapatería en voz baja: cada par de perfil sobre su repisa —una regla de
 * tinta donde se apoya— y los números que quedan a la vista. Nude, charol y
 * un petróleo para comprar; los títulos en minúsculas.
 */
export const taco: DefinicionDePlantilla = {
  nombre: "Taco",
  descripcion:
    "Zapatos de mujer. Cada par de perfil, sobre su repisa, con los números que quedan a la vista.",
  rasgos: [
    "Los pares de perfil, sobre su repisa",
    "Los números disponibles en cada tarjeta",
    "Nude, charol y petróleo, en minúsculas",
  ],
  apariencia: {
    colores: {
      papel: "#f2e8de",
      tinta: "#14181c",
      senal: "#0d5c63",
      senalAlta: "#11707a",
    },
    tipografia: {
      titular: "jost",
      cuerpo: "geist",
      pesoTitular: 500,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
    forma: { radio: "recto" },
    disposicion: { tarjeta: "cuadrada", columnas: 4 },
    ficha: {
      diseno: "dividida",
      barraFija: true,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "boleta", sugerencias: false },
  },
}
