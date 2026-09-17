import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * Moda: ropa, calzado y carteras.
 *
 * Se vende con la foto. Todo lo demás se retira para dejarle lugar: blanco y
 * negro, una sola tinta de acción —un azul profundo que no compite con
 * ninguna prenda—, titulares condensados en mayúsculas que ocupan poco ancho,
 * y la foto en retrato, que es como se fotografía una prenda puesta.
 */
export const fashion: DefinicionDePlantilla = {
  nombre: "Pasarela",
  descripcion:
    "Ropa, calzado y carteras. Fotos grandes en retrato, las categorías a la vista y la segunda mano con vitrina propia.",
  rasgos: [
    "Titulares condensados en mayúsculas",
    "Fotos en retrato, dos por fila en el celular",
    "Blanco, negro y un azul para comprar",
  ],
  apariencia: {
    colores: {
      papel: "#f5f4f0",
      tinta: "#0e0e10",
      senal: "#2340d0",
      senalAlta: "#3553e6",
    },
    tipografia: {
      titular: "oswald",
      cuerpo: "geist",
      pesoTitular: 600,
      espaciadoTitular: "abierto",
      mayusculas: true,
    },
    forma: { radio: "recto" },
    disposicion: { tarjeta: "retrato", columnas: 4 },
  },
}
