import { esTipoDeBloque, type TipoDeBloque } from "@/lib/plantillas/bloques"
import { SECCIONES } from "@/lib/plantillas/secciones"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import type { KitDeTienda } from "@/components/plantillas/kit"

/**
 * Los bloques de la portada, en su orden, con los componentes de un kit.
 *
 * Un tipo desconocido no se dibuja: puede llegar un bloque sembrado antes de
 * que exista su componente, y eso no tiene que romper la tienda.
 *
 * Dentro del editor cada bloque va envuelto en una marca con su id y su
 * nombre: es lo que permite tocar una sección de la vista previa para
 * editarla. Afuera del editor no se agrega nada, y la tienda pública queda
 * exactamente igual.
 */
export function Bloques({
  componentes,
  tienda,
  omitir = [],
}: {
  componentes: KitDeTienda["bloques"]
  tienda: TiendaPublica
  /** Tipos que la portada del kit ya resuelve por su cuenta. */
  omitir?: TipoDeBloque[]
}) {
  return tienda.bloques.map((bloque) => {
    if (!esTipoDeBloque(bloque.tipo) || omitir.includes(bloque.tipo)) {
      return null
    }

    const Componente = componentes[bloque.tipo]
    const dibujado = (
      <Componente key={bloque.id} bloque={bloque} tienda={tienda} />
    )

    return tienda.enEdicion ? (
      <div
        key={bloque.id}
        data-seccion={bloque.id}
        data-nombre={SECCIONES[bloque.tipo].nombre}
        data-vacia={SECCIONES[bloque.tipo].vacia}
        className="relative"
      >
        {dibujado}
      </div>
    ) : (
      dibujado
    )
  })
}

/**
 * Una parte de la portada que el kit dibuja por su cuenta, fuera de los
 * bloques: "Sobre la tienda", "La casa", el catálogo de la base editorial.
 *
 * No se mueve ni se quita, porque es parte de la plantilla. En el editor se
 * marca igual: tocarla explica de dónde sale lo que muestra, en vez de no
 * responder y parecer una sección rota. Afuera del editor no agrega nada.
 */
export function ParteFija({
  tienda,
  nombre,
  ayuda,
  children,
}: {
  tienda: TiendaPublica
  nombre: string
  /** De dónde sale lo que muestra y dónde se cambia. */
  ayuda: string
  children: React.ReactNode
}) {
  if (!tienda.enEdicion) return children

  return (
    <div data-fija={nombre} data-ayuda={ayuda} className="relative">
      {children}
    </div>
  )
}
