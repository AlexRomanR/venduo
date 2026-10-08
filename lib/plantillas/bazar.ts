import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * La tienda de todo un poco: accesorios, regalos, hogar, tecnología chica.
 *
 * Un bazar no tiene un producto estrella: tiene muchos, y quien entra viene a
 * curiosear. La tienda es un mostrador de feria: papel crema, un fucsia de
 * etiqueta de precio, un grotesco con carácter y todo redondeado y a mano,
 * con los precios en círculos como los de una góndola.
 */
export const bazar: DefinicionDePlantilla = {
  nombre: "Bazar",
  descripcion:
    "Tiendas de todo un poco: regalos, accesorios, hogar y tecnología. Muchas cosas a la vista, categorías grandes y precios que se ven.",
  rasgos: [
    "Un grotesco con carácter, de letrero",
    "Categorías grandes y muchos productos a la vista",
    "Crema, tinta y un fucsia de etiqueta",
  ],
  apariencia: {
    colores: {
      papel: "#f8f2e2",
      tinta: "#1e1b16",
      senal: "#b0225c",
      senalAlta: "#c82b6a",
    },
    tipografia: {
      titular: "bricolage",
      cuerpo: "geist",
      pesoTitular: 800,
      espaciadoTitular: "apretado",
      mayusculas: false,
    },
    forma: { radio: "redondo" },
    disposicion: { tarjeta: "cuadrada", columnas: 4 },
    ficha: {
      diseno: "dividida",
      barraFija: true,
      consulta: false,
      relacionados: true,
    },
    carrito: { diseno: "columnas", sugerencias: true },
  },
}
