import { cookies } from "next/headers"

import { getAIStatus } from "@/lib/ai"
import { getBarraLateral } from "@/lib/data/barra"
import { isSupabaseConfigured } from "@/lib/env"
import { COOKIE_BARRA } from "@/lib/preferencias"
import {
  BarraLateralEscritorio,
  BarraLateralMovil,
} from "@/components/panel/barra-lateral"
import { EstiloDePlantilla } from "@/components/plantillas/estilo"

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
 *
 * Quien tiene tienda trabaja con la identidad de su plantilla: la misma letra,
 * papel y color de acción que ve su comprador. Cambia la piel, no la
 * estructura —las pantallas de trabajo son las mismas en todas las
 * plantillas—, y así el panel se siente de su negocio sin dejar de ser una
 * herramienta que se aprende una sola vez.
 */
export default async function PrivadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [barra, galletas] = await Promise.all([getBarraLateral(), cookies()])
  const ai = getAIStatus()
  const plegada = galletas.get(COOKIE_BARRA)?.value === "plegada"

  return (
    <div className="min-h-screen bg-papel text-tinta lg:flex">
      {barra.apariencia ? (
        <EstiloDePlantilla apariencia={barra.apariencia} />
      ) : null}
      <BarraLateralEscritorio datos={barra} plegadaInicial={plegada} />

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
