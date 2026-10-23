import { redirect } from "next/navigation"

import { getCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { getVariantesDeMiTienda } from "@/lib/data/variantes"
import { isSupabaseConfigured } from "@/lib/env"
import { Cabecera, Volver } from "@/components/panel/piezas"
import { TituloDeLaBarra } from "@/components/panel/titulo-de-barra"
import {
  NuevaVenta,
  type ProductoParaVender,
} from "@/components/pedidos/nueva-venta"
import { registrarVenta } from "../acciones"

export const metadata = { title: "Nueva venta" }

/**
 * Registrar lo que se vendió fuera de la tienda: en el chat de Instagram o
 * TikTok, o en persona. Sin esto, esas ventas no bajan el stock ni aparecen
 * en las estadísticas, y el stock miente.
 *
 * Entran también los productos ocultos —en persona se vende lo que hay en el
 * mostrador—, pero no los que Venduo ocultó.
 */
export default async function NuevaVentaPage() {
  const [tienda, { productos, esDemo }, variantes] = await Promise.all([
    getMiTienda(),
    getCatalogo(),
    getVariantesDeMiTienda(),
  ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const paraVender: ProductoParaVender[] = productos
    .filter((p) => !p.moderated_at)
    .map((p) => ({
      id: p.id,
      nombre: p.name,
      foto: p.image_url,
      precioCents: p.price_cents,
      stock: p.stock,
      categoria: p.category,
      variantes: (variantes[p.id] ?? []).map((v) => ({
        id: v.id,
        nombre: v.nombre,
        stock: v.stock,
        precioCents: v.precioCents,
      })),
    }))
    // Lo que tiene stock primero: es lo que se vende.
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
      <TituloDeLaBarra titulo="Nueva venta" volver="/panel/pedidos" />
      <Volver href="/panel/pedidos">Pedidos</Volver>
      <Cabecera
        titulo="Nueva venta."
        bajada="Lo que vendiste en el chat o en persona. Se descuenta del stock."
      />
      <NuevaVenta
        productos={paraVender}
        registrar={registrarVenta}
        soloLectura={esDemo}
      />
    </div>
  )
}
