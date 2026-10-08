import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Carteras, bolsos y accesorios de cuero.
 *
 * Una cartera se compra como un objeto: se mira entera, de frente, con aire
 * alrededor. La tienda es una vitrina de marroquinería: papel hueso, tinta de
 * cuero oscuro, un burdeos para comprar y una didona de revista de moda. Cada
 * pieza va sobre su paño, en cuadrado y sin recortar.
 */
export const atelier: DefinicionDePlantilla = {
  nombre: "Atelier",
  descripcion:
    "Carteras, bolsos y accesorios. Cada pieza sobre su paño, títulos de revista de moda y una ficha que la muestra entera.",
  rasgos: [
    "Titulares en una didona de revista",
    "Cada pieza entera, sobre su paño",
    "Hueso, cuero oscuro y burdeos",
  ],
  apariencia: {
    colores: {
      papel: "#f6f2ec",
      tinta: "#1f1a17",
      senal: "#7b2234",
      senalAlta: "#922a3f",
    },
    tipografia: {
      titular: "bodoni",
      cuerpo: "jost",
      pesoTitular: 500,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
    forma: { radio: "suave" },
    disposicion: { tarjeta: "cuadrada", columnas: 3 },
    // La vitrina: una cartera se juzga entera, y en dividida la foto se corta.
    ficha: {
      diseno: "vitrina",
      barraFija: false,
      consulta: true,
      relacionados: true,
    },
    carrito: { diseno: "boleta", sugerencias: false },
  },
}
