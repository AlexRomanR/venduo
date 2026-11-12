import { after } from "next/server"
import { redirect } from "next/navigation"

import { rutaDeVistaDePlantilla } from "@/lib/api/miniaturas"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { enlaceLegible, urlDeTienda } from "@/lib/tienda"
import { pedirVista } from "@/lib/vista"
import { EscenaLista } from "@/components/onboarding/escena-lista"
import { Pasos, PASOS_CREAR } from "@/components/onboarding/pasos"

export const metadata = { title: "Tu tienda está lista" }

/**
 * Paso 3 del alta: la tienda ya existe, y se muestra en vez de describirla —en
 * vivo, dentro del celular del Resumen—. Ofrece el editor sin obligar: quien
 * tiene apuro va a su panel con un toque.
 */
export default async function ListoPage() {
  const [tienda, funciones] = await Promise.all([
    getMiTienda(),
    funcionesDeMiTienda(),
  ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const nombre = tienda?.name ?? "Tu tienda"
  const slug = tienda?.slug ?? "tu-tienda"
  const url = urlDeTienda(slug)
  const clave = tienda?.template_key ?? "fashion"

  // La captura de la portada todavía no existe: se pide ya, para que el
  // Resumen llegue con ella. Mientras, la de su plantilla.
  if (tienda && !tienda.vista_url) {
    const id = tienda.id
    after(() => pedirVista(id))
  }
  const vista = tienda?.vista_url
    ? { url: tienda.vista_url, real: true }
    : { url: rutaDeVistaDePlantilla(clave), real: false }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 overflow-x-clip px-4 pt-4 pb-14 sm:px-5 lg:gap-10 lg:pt-10 lg:pb-20">
      <Pasos pasos={PASOS_CREAR} actual={3} conVuelta={false} />
      <EscenaLista
        tienda={{
          nombre,
          legible: enlaceLegible(url),
          logoUrl: tienda?.logo_url ?? null,
        }}
        url={url}
        vista={vista}
        conEditor={funciones.editor !== "oculta"}
      />
    </div>
  )
}
