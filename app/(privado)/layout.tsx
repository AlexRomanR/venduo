import { getAIStatus } from "@/lib/ai"
import { getBarraLateral } from "@/lib/data/barra"
import { isSupabaseConfigured } from "@/lib/env"
import {
  BarraLateralEscritorio,
  BarraLateralMovil,
} from "@/components/panel/barra-lateral"

/**
 * Shell de las áreas privadas: `/panel`, `/vendedor` y `/cuenta`.
 *
 * Una barra lateral en escritorio y un cajón en el celular. La barra horizontal
 * de antes envolvía en dos filas a 375 px y no tenía dónde mostrar lo que pide
 * atención —cuántos pedidos esperan, qué se quedó sin stock— ni la tienda y su
 * enlace, que es lo que un emprendedor busca más veces por día.
 *
 * Lo que muestra lo deciden los datos, no `primary_role`: alguien que tiene
 * tienda y además vende para otras ve las dos secciones.
 */
export default async function PrivadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const barra = await getBarraLateral()
  const ai = getAIStatus()

  return (
    <div className="min-h-screen bg-papel text-tinta lg:flex">
      <BarraLateralEscritorio datos={barra} />

      <div className="flex min-w-0 flex-1 flex-col">
        <BarraLateralMovil datos={barra} />

        {!isSupabaseConfigured || ai.demo ? (
          <p className="border-b border-senal/30 bg-senal/5 px-5 py-2 text-center text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            {!isSupabaseConfigured
              ? "Modo demo · Supabase sin configurar"
              : "IA en modo demo · las respuestas son simuladas"}
          </p>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
