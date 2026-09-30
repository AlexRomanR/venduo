import { redirect } from "next/navigation"

import { getAIStatus } from "@/lib/ai"
import { getDisenoParaEditar } from "@/lib/data/editor"
import { esClaveDePaso } from "@/lib/editor/pasos"
import { Editor } from "@/components/editor/editor"
import { decidirPropuesta, proponerCambios, publicarDiseno } from "./acciones"

// Pedirle un cambio a la IA puede llevar dos vueltas al modelo: la segunda
// corrige lo que la primera no pudo aplicar.
export const maxDuration = 60

export const metadata = {
  title: "Editar tu tienda",
  robots: { index: false, follow: false },
}

/**
 * El editor de la tienda, a pantalla completa y fuera del armazón del panel:
 * en un celular, la barra del panel y el editor no caben juntos.
 *
 * `?paso=` abre un paso concreto y `?bienvenida=1` llega desde el final del
 * alta, con la tienda recién creada.
 */
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string; bienvenida?: string }>
}) {
  const { paso, bienvenida } = await searchParams
  const diseno = await getDisenoParaEditar()

  // Sin tienda terminada no hay nada que editar: primero el alta.
  if (!diseno) redirect("/crear")

  return (
    <Editor
      diseno={diseno}
      pasoInicial={esClaveDePaso(paso) ? paso : "marca"}
      bienvenida={bienvenida === "1"}
      publicar={publicarDiseno}
      proponer={proponerCambios}
      decidir={decidirPropuesta}
      iaDemo={getAIStatus().demo}
    />
  )
}
