import type { DefinicionDePlantilla } from "@/lib/plantillas/definicion"

/**
 * La base editorial de Venduo, como plantilla.
 *
 * No se ofrece en la galería. Es el respaldo con el que se dibuja toda tienda
 * cuya plantilla no tiene base en código: las del catálogo anterior, que se
 * retiraron sin borrarse, siguen viéndose exactamente como antes.
 */
export const clasica: DefinicionDePlantilla = {
  nombre: "Editorial",
  descripcion:
    "La tienda con el diseño de Venduo: papel, tinta y un rojo de señal, con el catálogo completo en la portada.",
  rasgos: [
    "Titulares en Archivo, un grotesco apretado",
    "Catálogo completo en la portada",
    "Rojo de señal para la acción",
  ],
  apariencia: {
    colores: {
      papel: "#f1f0ee",
      tinta: "#16171a",
      // 4,72:1 contra el papel: el rojo de antes, #d62d12, quedaba en 4,35.
      senal: "#cc2a10",
      senalAlta: "#ed3517",
    },
    tipografia: {
      titular: "archivo",
      cuerpo: "geist",
      pesoTitular: null,
      espaciadoTitular: null,
      mayusculas: false,
    },
    forma: { radio: "suave" },
    disposicion: { tarjeta: "cuadrada", columnas: 4 },
    ficha: {
      diseno: "dividida",
      barraFija: false,
      consulta: false,
      relacionados: true,
    },
    carrito: { diseno: "columnas", sugerencias: false },
  },
}
