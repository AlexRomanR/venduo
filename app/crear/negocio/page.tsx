import { redirect } from "next/navigation"

/**
 * Antes el paso 2 del alta, con la plantilla en la URL. Desde el 9 de
 * noviembre el negocio va primero, en `/crear`: un enlace viejo lleva ahí.
 */
export default function NegocioPage() {
  redirect("/crear")
}
