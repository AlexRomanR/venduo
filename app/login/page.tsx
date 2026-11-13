import { isSupabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { Acceso, type EstadoDelRegistro } from "@/components/auth/acceso"
import { Marco } from "@/components/onboarding/marco"

export const metadata = { title: "Entrar" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; modo?: string }>
}) {
  const [{ next, error, modo }, supabase] = await Promise.all([
    searchParams,
    createClient(),
  ])
  // Sin respuesta de la base se muestra abierto: si de verdad está cerrado, el
  // disparador lo rechaza igual al registrarse.
  const lectura = supabase ? await supabase.rpc("estado_del_registro") : null
  const estadoDelRegistro: EstadoDelRegistro =
    lectura?.data === "cerrado" || lectura?.data === "invitacion"
      ? lectura.data
      : "abierto"

  // El mismo marco que el alta, en el cuaderno: el ingreso es su puerta.
  return (
    <Marco publico>
      <Acceso
        next={next}
        configured={isSupabaseConfigured}
        initialError={error}
        registro={modo === "registro"}
        estadoDelRegistro={estadoDelRegistro}
      />
    </Marco>
  )
}
