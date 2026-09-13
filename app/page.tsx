import { redirect } from "next/navigation"

/**
 * La aplicación arranca en el login.
 *
 * No hay landing: este scaffold deja la infraestructura montada
 * (Supabase, capa de IA, QR, validación) y la UI se construye
 * sobre `/panel` y `/vendedor`.
 */
export default function Home() {
  redirect("/login")
}
