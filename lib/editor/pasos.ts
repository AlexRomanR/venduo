/**
 * Los pasos del editor, por su clave.
 *
 * En un módulo neutral y no junto a los componentes: la página del editor, que
 * es de servidor, lee el paso de la URL, y una constante exportada desde un
 * archivo de cliente no llega como constante al servidor.
 */
export const CLAVES_DE_PASO = [
  "marca",
  "portada",
  "catalogo",
  "producto",
  "carrito",
  "publicar",
] as const

export type ClaveDePaso = (typeof CLAVES_DE_PASO)[number]

export function esClaveDePaso(valor: unknown): valor is ClaveDePaso {
  return (
    typeof valor === "string" &&
    (CLAVES_DE_PASO as readonly string[]).includes(valor)
  )
}
