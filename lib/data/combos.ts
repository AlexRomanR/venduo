import "server-only"

import { cache } from "react"

import { catalogoSchema } from "@/lib/catalogos/modelo"
import { funcionDeTienda } from "@/lib/data/funciones"
import {
  getTiendaPublica,
  type ProductoPublico,
  type TiendaPublica,
} from "@/lib/data/tienda-publica"
import { createClient } from "@/lib/supabase/server"

/** Un combo de un catálogo, listo para dibujar en la tienda. */
export interface ComboPublico {
  /** El `share_token` de su catálogo. */
  catalogo: string
  id: string
  nombre: string
  nota: string
  /** El del catálogo guardado: es el que cobra `create_order`. */
  precioCents: number
  /** En el orden del combo: un producto repetido va dos veces. */
  productos: ProductoPublico[]
}

/**
 * Un combo de un catálogo, en su tienda.
 *
 * `combo` es `null` cuando no se puede pedir: el catálogo se borró o no es de
 * esta tienda, el combo ya no está —o ninguna hoja lo muestra—, uno de sus
 * productos ya no se vende o los combos están apagados. La tienda se devuelve
 * igual, para dibujar el aviso con su cabecera. Lo que se ve acá lo vuelve a
 * comprobar `create_order` al pedir.
 */
export const getComboDeTienda = cache(async function getComboDeTienda(
  slug: string,
  token: string,
  comboId: string
): Promise<{ tienda: TiendaPublica; combo: ComboPublico | null } | null> {
  const supabase = await createClient()
  const [tienda, compartido] = await Promise.all([
    getTiendaPublica(slug),
    supabase
      ? supabase.rpc("catalogo_compartido", { p_token: token })
      : Promise.resolve(null),
  ])
  if (!tienda) return null
  const nada = { tienda, combo: null }

  const fila = compartido?.data?.[0]
  if (!fila || fila.store_id !== tienda.id) return nada
  if (!(await funcionDeTienda(tienda.id, "combos"))) return nada

  const catalogo = catalogoSchema.safeParse(fila.config)
  if (!catalogo.success) return nada

  const pack = catalogo.data.packs.find((p) => p.id === comboId)
  const conHoja = catalogo.data.bloques.some(
    (bloque) => bloque.tipo === "pack" && bloque.pack === comboId
  )
  if (!pack || !conHoja || pack.precioCents <= 0) return nada

  // Un producto que ya no se vende deja el combo sin poder pedirse: no se
  // vende con uno menos al mismo precio.
  const porId = new Map(tienda.productos.map((p) => [p.id, p]))
  const productos = pack.productos.map((id) => porId.get(id))
  if (productos.length === 0 || productos.some((p) => !p)) return nada

  return {
    tienda,
    combo: {
      catalogo: token,
      id: pack.id,
      nombre: pack.nombre,
      nota: pack.nota,
      precioCents: pack.precioCents,
      productos: productos as ProductoPublico[],
    },
  }
})
