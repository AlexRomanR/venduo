import { redirect } from "next/navigation"

import { leerBorradorDelAlta } from "@/lib/data/alta"
import { getMiTienda } from "@/lib/data/panel"
import { Cabecera } from "@/components/panel/piezas"
import { FormularioNegocio } from "@/components/onboarding/formulario-negocio"
import { Pasos, PASOS_CREAR } from "@/components/onboarding/pasos"

export const metadata = { title: "Tu negocio" }

/**
 * Paso 1 del alta: el negocio. Va primero para que, al elegir la plantilla,
 * cada una ya se vea con su nombre (brief `docs/briefs/2026-11-09-alta.md`).
 *
 * Quien ya tiene tienda no vuelve acá: lo que corresponde es el panel.
 */
export default async function CrearPage() {
  const [tienda, borrador] = await Promise.all([
    getMiTienda(),
    leerBorradorDelAlta(),
  ])
  if (tienda?.template_key) redirect("/panel")

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-4 pb-14 sm:px-5 lg:grid-cols-[1fr_32rem] lg:items-center lg:gap-16 lg:pt-10 lg:pb-20">
      <div className="flex flex-col gap-6 lg:gap-10">
        <Pasos pasos={PASOS_CREAR} actual={1} />
        <Cabecera
          titulo="Cuéntanos de tu negocio."
          resaltar="tu negocio"
          bajada="Con esto armamos tu tienda."
        />
      </div>

      <FormularioNegocio inicial={borrador} />
    </div>
  )
}
