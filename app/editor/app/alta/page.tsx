import { getPlantillasPorRubro } from "@/lib/data/plantillas"
import { PLANTILLAS, plantillaDeTienda } from "@/lib/plantillas"
import { muestraDeTienda } from "@/lib/plantillas/muestra"
import { PasarelaParaLaApp } from "@/components/panel/pasarela-para-la-app"
import { Miniatura } from "@/components/plantillas/miniatura"

export const metadata = {
  title: "Elige tu plantilla",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * La pasarela del alta, para la app: las plantillas en el mismo orden que
 * `/crear/plantilla`, cada una con el nombre del negocio adentro. La app la
 * abre en un WebView con `?nombre=` —lo que se escribió en el paso 1— y, si
 * eligió un rubro, `?rubro=`; el nombre, las fichas y "Crear mi tienda con X"
 * los dibuja la app.
 *
 * Todavía no hay tienda: no se lee nada de la cuenta, solo el catálogo de
 * plantillas, que es el mismo para todos.
 */
export default async function AltaParaLaAppPage({
  searchParams,
}: {
  searchParams: Promise<{ nombre?: string; rubro?: string }>
}) {
  const [{ nombre, rubro }, rubros] = await Promise.all([
    searchParams,
    getPlantillasPorRubro(),
  ])
  const nombreDelNegocio = (nombre ?? "").trim().slice(0, 60) || "Tu tienda"

  const todas = rubros
    .filter((r) => !rubro || r.key === rubro)
    .flatMap((r) => r.plantillas.map((plantilla) => ({ rubro: r, plantilla })))

  return (
    <PasarelaParaLaApp
      plantillas={todas.map(({ rubro: r, plantilla }) => ({
        clave: plantilla.key,
        nombre: plantilla.name,
        rubro: r.name,
        descripcion: plantilla.description,
        rasgos: PLANTILLAS[plantillaDeTienda(plantilla.key)].rasgos,
        recomendada: Boolean(plantilla.recomendada),
        nueva: Boolean(plantilla.nueva),
      }))}
      notas={["Con productos de ejemplo."]}
      miniaturas={todas.map(({ plantilla }) => (
        <Miniatura
          key={plantilla.key}
          clave={plantilla.key}
          datos={
            muestraDeTienda(
              nombreDelNegocio,
              null,
              plantillaDeTienda(plantilla.key),
              []
            ).muestra
          }
        />
      ))}
    />
  )
}
