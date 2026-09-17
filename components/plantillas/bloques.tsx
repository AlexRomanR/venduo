import { esTipoDeBloque, type TipoDeBloque } from "@/lib/plantillas/bloques"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import type { KitDeTienda } from "@/components/plantillas/kit"

/**
 * Los bloques de la portada, en su orden, con los componentes de un kit.
 *
 * Un tipo desconocido no se dibuja: puede llegar un bloque sembrado antes de
 * que exista su componente, y eso no tiene que romper la tienda.
 */
export function Bloques({
  componentes,
  tienda,
  codigo,
  omitir = [],
}: {
  componentes: KitDeTienda["bloques"]
  tienda: TiendaPublica
  codigo: string | null
  /** Tipos que la portada del kit ya resuelve por su cuenta. */
  omitir?: TipoDeBloque[]
}) {
  return tienda.bloques.map((bloque) => {
    if (!esTipoDeBloque(bloque.tipo) || omitir.includes(bloque.tipo)) {
      return null
    }

    const Componente = componentes[bloque.tipo]
    return (
      <Componente
        key={bloque.id}
        bloque={bloque}
        tienda={tienda}
        codigo={codigo}
      />
    )
  })
}
