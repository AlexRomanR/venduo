import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Ropa de mujer con aire de boutique.
 *
 * Una prenda se elige por cómo cae en el cuerpo y por si hay en la talla de
 * una. La tienda es un probador: fotos altas de cuerpo entero, las tallas bajo
 * cada prenda antes de entrar, rosa empolvado, ciruela para comprar y una
 * serif de contraste alto, de portada de revista.
 */
export const probador: DefinicionDePlantilla = {
  nombre: "Probador",
  descripcion:
    "Ropa de mujer con aire de boutique. Fotos de cuerpo entero y las tallas a la vista antes de entrar al producto.",
  rasgos: [
    "Fotos altas, de cuerpo entero",
    "Las tallas bajo cada prenda",
    "Rosa empolvado, ciruela y una serif de revista",
  ],
  apariencia: {
    colores: {
      papel: "#f8f1ee",
      tinta: "#24161f",
      senal: "#66285c",
      senalAlta: "#7a3270",
    },
    tipografia: {
      titular: "gloock",
      cuerpo: "jost",
      pesoTitular: 400,
      espaciadoTitular: "normal",
      mayusculas: false,
    },
    forma: { radio: "suave" },
    disposicion: { tarjeta: "retrato", columnas: 4 },
    ficha: {
      diseno: "dividida",
      barraFija: true,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "columnas", sugerencias: true },
  },
}
