import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getMiTienda } from "@/lib/data/panel"
import { getPlantillasPorRubro } from "@/lib/data/plantillas"
import { FormularioNegocio } from "@/components/onboarding/formulario-negocio"
import { Pasos, PASOS_CREAR } from "@/components/onboarding/pasos"
import { Miniatura } from "@/components/plantillas/miniatura"

export const metadata = { title: "Cuenta tu negocio" }

/**
 * Paso 2 del alta: el nombre y la descripción del negocio.
 *
 * La plantilla llega por la URL y se valida contra el catálogo: si no existe
 * —enlace viejo, clave inventada— se vuelve al paso 1 en vez de crear una
 * tienda con una plantilla que no se puede sembrar.
 */
export default async function NegocioPage({
  searchParams,
}: {
  searchParams: Promise<{ plantilla?: string }>
}) {
  const { plantilla } = await searchParams

  const tienda = await getMiTienda()
  if (tienda?.template_key) redirect("/panel")

  const rubros = await getPlantillasPorRubro()
  const elegida = rubros
    .flatMap((rubro) => rubro.plantillas)
    .find((item) => item.key === plantilla)

  if (!elegida) redirect("/crear")

  const rubro = rubros.find((item) => item.key === elegida.sector)

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
      <Pasos pasos={PASOS_CREAR} actual={2} />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
        <div>
          <h1 className="max-w-[14ch] font-titular text-[clamp(2.25rem,7vw,3.5rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
            Cuéntanos qué vendes.
          </h1>
          <p className="mt-5 max-w-[50ch] text-lg leading-relaxed opacity-70">
            Con un párrafo alcanza. Es lo que la IA va a usar para llenar tu
            catálogo, escribir las descripciones y ordenar las categorías.
          </p>

          <div className="mt-10">
            <FormularioNegocio plantilla={elegida.key} />
          </div>
        </div>

        <div className="lg:pt-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Tu plantilla
          </p>

          <div className="mt-5 border-t-2 border-tinta pt-5">
            <Miniatura clave={elegida.key} className="border border-tinta" />
            <h2 className="mt-4 font-titular text-lg font-bold tracking-[-0.02em]">
              {elegida.name}
              {rubro ? (
                <span className="ml-2 font-sans text-sm font-normal opacity-55">
                  {rubro.name}
                </span>
              ) : null}
            </h2>
            {elegida.description ? (
              <p className="mt-2 text-sm leading-relaxed opacity-70">
                {elegida.description}
              </p>
            ) : null}
          </div>

          <Link
            href="/crear"
            className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Elegir otra plantilla
          </Link>
        </div>
      </div>
    </div>
  )
}
