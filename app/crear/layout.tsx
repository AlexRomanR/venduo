import { getBarraLateral, tienePanel } from "@/lib/data/barra"
import { Marco } from "@/components/onboarding/marco"

/**
 * El alta de la tienda va sin la barra del panel: es un recorrido de tres
 * pasos y la barra solo distraería. Quien ya tiene panel ve cómo volver.
 */
export default async function CrearLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const barra = await getBarraLateral()
  return <Marco conPanel={tienePanel(barra)}>{children}</Marco>
}
