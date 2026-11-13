import { getAparienciaDeMiTienda } from "@/lib/data/apariencia"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { PasarelaParaLaApp } from "@/components/panel/pasarela-para-la-app"
import { Miniatura } from "@/components/plantillas/miniatura"

export const metadata = {
  title: "Pasarela de plantillas",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * La pasarela de Apariencia, para la app: cada plantilla dibujada con la
 * tienda adentro, como en `/panel/apariencia`. La app no copia las plantillas:
 * muestra estos dibujos y pone lo suyo alrededor —el nombre, "Usar", la hoja
 * para cambiar—. Los mismos datos y el mismo orden que la página del panel.
 */
export default async function PasarelaParaLaAppPage() {
  const [datos, funciones] = await Promise.all([
    getAparienciaDeMiTienda(),
    funcionesDeMiTienda(),
  ])
  if (!datos) return null

  const { actual, disponibles, muestra, muestraDeEjemplo, aparienciaActual } =
    datos
  // Si Venduo ocultó el cambio de plantilla, la pasarela muestra solo la tuya.
  const otras = funciones.cambiar_plantilla === "oculta" ? [] : disponibles

  const notas = [
    ...(muestraDeEjemplo
      ? ["Con productos de ejemplo hasta que subas los tuyos."]
      : []),
    ...(actual.personalizada
      ? [
          "Con los colores de {plantilla}. Los tuyos quedan guardados en el historial.",
        ]
      : []),
  ]

  const plantillas = [
    {
      clave: actual.clave,
      nombre: actual.retirada ? "Plantilla anterior" : actual.nombre,
      rubro: actual.rubro,
      descripcion: actual.retirada
        ? "Ya no se ofrece, pero tu tienda se ve igual. Puedes pasarte a otra cuando quieras."
        : actual.descripcion,
      rasgos: actual.rasgos,
      recomendada: actual.recomendada,
      nueva: actual.nueva,
    },
    ...otras.map((plantilla) => ({
      clave: plantilla.clave,
      nombre: plantilla.nombre,
      rubro: plantilla.rubro,
      descripcion: plantilla.descripcion,
      rasgos: plantilla.rasgos,
      recomendada: plantilla.recomendada,
      nueva: plantilla.nueva,
    })),
  ]

  return (
    <PasarelaParaLaApp
      plantillas={plantillas}
      notas={notas}
      // La tuya con tus colores; las otras con los de su base, porque al
      // cambiar la personalización no viaja a la plantilla nueva.
      miniaturas={[
        <Miniatura
          key={actual.clave}
          clave={actual.clave}
          apariencia={actual.retirada ? null : aparienciaActual}
          datos={actual.retirada ? null : muestra}
        />,
        ...otras.map((plantilla) => (
          <Miniatura
            key={plantilla.clave}
            clave={plantilla.clave}
            datos={muestra}
          />
        )),
      ]}
    />
  )
}
