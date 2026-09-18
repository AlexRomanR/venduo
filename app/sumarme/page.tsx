import { redirect } from "next/navigation"

/**
 * El alta del promotor del modelo anterior: sumarse a una tienda, con o sin
 * código de invitación. Ya no hay nada que aprobar ni a qué sumarse; el panel
 * del promotor le explica cómo empezar. Queda la ruta porque los botones
 * "vende para esta tienda" de las plantillas y los enlaces viejos apuntan acá.
 */
export default function SumarmePage() {
  redirect("/vendedor")
}
