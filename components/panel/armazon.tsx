import { cookies } from "next/headers"

import { getAIStatus } from "@/lib/ai"
import { getBarraLateral, tienePanel } from "@/lib/data/barra"
import { isSupabaseConfigured } from "@/lib/env"
import { COOKIE_BARRA } from "@/lib/preferencias"
import { Marco } from "@/components/onboarding/marco"
import {
  BarraLateralEscritorio,
  BarraLateralMovil,
} from "@/components/panel/barra-lateral"

/**
 * El armazón del panel: la barra lateral en escritorio, el cajón en el
 * celular y el contenido al lado.
 *
 * Una sola pieza para todas las pantallas que lo llevan, así la barra no
 * aparece en unas y falta en otras según en qué carpeta cayó la ruta. Cuáles
 * lo llevan está en `.agents/rules/ui-styling.md`, "Cuándo aparece la barra".
 *
 * Lo que muestra la barra lo deciden los datos, no `primary_role`: alguien
 * que tiene tienda y además vende para otras ve las dos secciones.
 */
export async function ArmazonDelPanel({
  children,
}: {
  children: React.ReactNode
}) {
  const [barra, galletas] = await Promise.all([getBarraLateral(), cookies()])
  const ai = getAIStatus()
  const plegada = galletas.get(COOKIE_BARRA)?.value === "plegada"

  return (
    <div className="min-h-screen bg-papel text-tinta lg:flex">
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

/**
 * El marco de una pantalla que puede ser del alta o de la cuenta: las
 * vitrinas del vendedor y `/sumarme`.
 *
 * Quien ya tiene panel —una tienda o un vínculo de vendedor— llegó desde la
 * barra y tiene que seguir viéndola: antes, tocar "Buscar tiendas" la hacía
 * desaparecer. Quien recién se registró y todavía no tiene nada está en su
 * alta, y una barra vacía no le serviría de nada: ve el marco del alta.
 *
 * El contenido llega sin contenedor propio: los dos marcos le ponen el mismo
 * ancho y el mismo margen.
 */
export async function MarcoDeCuenta({
  children,
}: {
  children: React.ReactNode
}) {
  const barra = await getBarraLateral()

  if (tienePanel(barra)) {
    return <ArmazonDelPanel>{children}</ArmazonDelPanel>
  }

  return (
    <Marco>
      <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">{children}</div>
    </Marco>
  )
}
