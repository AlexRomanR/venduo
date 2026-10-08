import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Zapatillas y calzado.
 *
 * El calzado se vende de perfil, sobre un fondo liso, y se compara de a
 * muchos. La tienda toma el idioma de la cancha: una condensada en cursiva que
 * va hacia adelante, un verde de pista para comprar, cifras grandes y cada par
 * sobre su placa gris, cuatro por fila en la computadora.
 */
export const pisada: DefinicionDePlantilla = {
  nombre: "Pisada",
  descripcion:
    "Zapatillas y calzado. Cada par de perfil sobre su placa, titulares en cursiva que van hacia adelante y precios a la vista.",
  rasgos: [
    "Titulares condensados en cursiva",
    "Cada par sobre su placa, de a cuatro",
    "Blanco frío, negro y verde de cancha",
  ],
  apariencia: {
    colores: {
      papel: "#f0f1f3",
      tinta: "#0f1216",
      senal: "#0a7240",
      senalAlta: "#0c8a4e",
    },
    tipografia: {
      titular: "barlow",
      cuerpo: "geist",
      pesoTitular: 800,
      espaciadoTitular: "normal",
      mayusculas: true,
    },
    forma: { radio: "redondo" },
    disposicion: { tarjeta: "cuadrada", columnas: 4 },
    // Elegir talla pide preguntar: la consulta y el botón a la vista vienen puestos.
    ficha: {
      diseno: "dividida",
      barraFija: true,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "pasos", sugerencias: true },
  },
}
