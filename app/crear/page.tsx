import { redirect } from "next/navigation"

import { getMiTienda } from "@/lib/data/panel"
import {
  getNombresDeBloque,
  getPlantillasPorRubro,
} from "@/lib/data/plantillas"
import { GaleriaPlantillas } from "@/components/onboarding/galeria-plantillas"
import { Pasos, PASOS_CREAR } from "@/components/onboarding/pasos"

export const metadata = { title: "Elige tu plantilla" }

/**
 * Paso 1 del alta: la galería de plantillas.
 *
 * Quien ya eligió plantilla no vuelve acá: su tienda existe y lo que
 * corresponde es el panel.
 */
export default async function CrearPage() {
  // Lo que no depende de la tienda arranca a la vez: una cuenta nueva siempre
  // llega acá, y no tiene por qué esperar dos viajes en fila.
  const [tienda, rubros, nombresDeBloque] = await Promise.all([
    getMiTienda(),
    getPlantillasPorRubro(),
    getNombresDeBloque(),
  ])

  if (tienda?.template_key) redirect("/panel")

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-16">
        <div>
          <h1 className="max-w-[15ch] font-titular text-[clamp(2.25rem,7vw,3.75rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
            Elige por dónde empieza tu tienda.
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed opacity-70">
            Cada plantilla tiene su propia forma de verse —la letra, los
            colores, cómo muestra tus productos— y trae las secciones que ese
            rubro necesita. No es definitiva: puedes cambiarla después desde tu
            panel sin perder nada.
          </p>
        </div>

        <Pasos pasos={PASOS_CREAR} actual={1} />
      </div>

      <div className="mt-14 border-t border-tinta/15 pt-12">
        <GaleriaPlantillas rubros={rubros} nombresDeBloque={nombresDeBloque} />
      </div>
    </div>
  )
}
