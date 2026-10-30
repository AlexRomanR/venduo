import { redirect } from "next/navigation"

import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { getMaterialParaPublicar } from "@/lib/data/publicar"
import { isSupabaseConfigured, isTikTokConfigured } from "@/lib/env"
import { Cabecera } from "@/components/panel/piezas"
import { Publicador } from "@/components/publicar/publicador"
import { escribirTextos } from "./acciones"

// La IA de esta pantalla corre en su acción: con un tope explícito, un pedido
// que se demora termina con un aviso en vez de quedar colgado.
export const maxDuration = 60

export const metadata = { title: "Publicar en redes" }

/**
 * Publicar en redes: la imagen y el texto de un producto, listos para
 * compartir. `?producto=` llega con uno ya elegido, desde su pantalla.
 */
export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string }>
}) {
  const [tienda, funciones, material, parametros] = await Promise.all([
    getMiTienda(),
    funcionesDeMiTienda(),
    getMaterialParaPublicar(),
    searchParams,
  ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")
  if (funciones.marketing !== "activa") redirect("/panel")

  const inicial =
    material.productos.find((p) => p.id === parametros.producto)?.id ?? null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Publica tus productos."
        bajada="Elige un producto y preparamos la imagen y el texto para tus redes."
      />
      <Publicador
        productos={material.productos}
        tienda={{ nombre: material.tienda.nombre, url: material.tienda.url }}
        ia={funciones.ia_marketing}
        tiktok={isTikTokConfigured ? funciones.tiktok : null}
        inicial={inicial}
        escribir={escribirTextos}
      />
    </div>
  )
}
