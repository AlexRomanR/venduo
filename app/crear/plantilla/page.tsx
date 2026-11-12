import { redirect } from "next/navigation"

import { leerBorradorDelAlta } from "@/lib/data/alta"
import { getMiTienda } from "@/lib/data/panel"
import { getPlantillasPorRubro } from "@/lib/data/plantillas"
import { PLANTILLAS, plantillaDeTienda } from "@/lib/plantillas"
import { muestraDeTienda } from "@/lib/plantillas/muestra"
import { Cabecera } from "@/components/panel/piezas"
import { ElegirPlantilla } from "@/components/onboarding/elegir-plantilla"
import { Pasos, PASOS_CREAR } from "@/components/onboarding/pasos"
import { Miniatura } from "@/components/plantillas/miniatura"

export const metadata = { title: "Tu plantilla" }

/**
 * Paso 2 del alta: la plantilla, en la pasarela de Apariencia. Cada dibujo
 * lleva el nombre del negocio que se escribió en el paso 1 y los productos de
 * ejemplo de su plantilla, porque la tienda todavía no tiene.
 *
 * Sin borrador —llegó directo, o venció— se vuelve al paso 1; con tienda, al
 * panel.
 */
export default async function PlantillaPage() {
  const [tienda, borrador, rubros] = await Promise.all([
    getMiTienda(),
    leerBorradorDelAlta(),
    getPlantillasPorRubro(),
  ])
  if (tienda?.template_key) redirect("/panel")
  if (!borrador) redirect("/crear")

  const todas = rubros.flatMap((rubro) =>
    rubro.plantillas.map((plantilla) => ({ rubro, plantilla }))
  )

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-4 pb-32 sm:px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-14 lg:pt-10 lg:pb-20">
      <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:gap-10">
        <Pasos pasos={PASOS_CREAR} actual={2} />
        <Cabecera
          titulo="Elige tu plantilla."
          resaltar="tu plantilla"
          bajada="Puedes cambiarla después."
        />
      </div>

      <ElegirPlantilla
        rubros={rubros.map((rubro) => ({
          clave: rubro.key,
          nombre: rubro.name,
        }))}
        plantillas={todas.map(({ rubro, plantilla }) => ({
          clave: plantilla.key,
          nombre: plantilla.name,
          rubro: rubro.name,
          descripcion: plantilla.description,
          rasgos: PLANTILLAS[plantillaDeTienda(plantilla.key)].rasgos,
          recomendada: Boolean(plantilla.recomendada),
          nueva: Boolean(plantilla.nueva),
        }))}
        rubroDe={todas.map(({ rubro }) => rubro.key)}
        miniaturas={todas.map(({ plantilla }) => (
          <Miniatura
            key={plantilla.key}
            clave={plantilla.key}
            datos={
              muestraDeTienda(
                borrador.nombre,
                null,
                plantillaDeTienda(plantilla.key),
                []
              ).muestra
            }
          />
        ))}
      />
    </div>
  )
}
