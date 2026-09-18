import { redirect } from "next/navigation"

/**
 * Sumarse a una tienda entera era del modelo anterior: ahora se promociona
 * producto por producto. La ruta queda para los enlaces que ya circulan.
 */
export default function ExplorarTiendas() {
  redirect("/vendedor/catalogo")
}
