import { redirect } from "next/navigation"

/**
 * El alta pasó a tener una sola pantalla.
 *
 * Esta ruta era el paso 2, después de elegir plantilla. Se queda como redirección
 * porque su enlace pudo haber quedado en un correo o en una pestaña abierta.
 */
export default function NegocioPage() {
  redirect("/crear")
}
