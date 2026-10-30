"use client"

import * as React from "react"

/**
 * Qué dice la barra de arriba en el celular, la misma de la app: el nombre de
 * la pantalla con el menú al lado, o una flecha para volver y el nombre de lo
 * que se está mirando —"Pedido #291"—.
 *
 * Lo general sale de la ruta (`tituloDeRuta`), así la barra lo dibuja desde el
 * servidor. Una pantalla de detalle que sabe algo más lo dice con
 * `TituloDeLaBarra`, que vive en la página y lo pasa a la barra del armazón.
 */
export interface TituloDeBarra {
  titulo: string
  /** A dónde lleva la flecha. Sin ella, la barra lleva el menú. */
  volver?: string
  /**
   * Lo que pasa al tocar la flecha, si no es solo volver: el editor de
   * catálogos pregunta antes de salir con cambios sin guardar.
   */
  alVolver?: () => void
  /** Botones a la derecha, como deshacer, rehacer y guardar en un editor. */
  acciones?: React.ReactNode
  /** Un editor a pantalla completa se cierra con una X, como en la app. */
  cerrar?: boolean
}

const SECCIONES: Array<[RegExp, TituloDeBarra]> = [
  [/^\/panel\/pedidos\/[^/]+$/, { titulo: "Pedido", volver: "/panel/pedidos" }],
  [/^\/panel\/pedidos$/, { titulo: "Pedidos" }],
  [
    /^\/panel\/productos\/nuevo$/,
    { titulo: "Nuevo producto", volver: "/panel/productos" },
  ],
  [
    /^\/panel\/productos\/categorias$/,
    { titulo: "Categorías", volver: "/panel/productos" },
  ],
  [
    /^\/panel\/productos\/cargar$/,
    { titulo: "Cargar varios", volver: "/panel/productos" },
  ],
  [
    /^\/panel\/productos\/[^/]+$/,
    { titulo: "Producto", volver: "/panel/productos" },
  ],
  [/^\/panel\/productos$/, { titulo: "Productos" }],
  [
    /^\/panel\/catalogos\/.+$/,
    { titulo: "Catálogo", volver: "/panel/catalogos" },
  ],
  [/^\/panel\/catalogos$/, { titulo: "Catálogos" }],
  [/^\/panel\/estadisticas/, { titulo: "Estadísticas" }],
  [/^\/panel\/apariencia/, { titulo: "Editar tu tienda" }],
  [
    /^\/panel\/marketing\/tiktok/,
    { titulo: "Publicar en TikTok", volver: "/panel/marketing" },
  ],
  [/^\/panel\/marketing/, { titulo: "Publicar en redes" }],
  [/^\/cuenta/, { titulo: "Tus datos" }],
]

/** El título de una ruta. `null` en el Resumen: ahí manda su cabecera. */
export function tituloDeRuta(ruta: string): TituloDeBarra | null {
  return SECCIONES.find(([patron]) => patron.test(ruta))?.[1] ?? null
}

// Dos contextos: quien pone el título no se vuelve a dibujar cuando el título
// cambia. Si fuera uno, la página que lo pone con botones —un elemento nuevo en
// cada dibujo— entraría en un ciclo.
const Valor = React.createContext<TituloDeBarra | null>(null)
const Poner = React.createContext<(titulo: TituloDeBarra | null) => void>(
  () => {}
)

export function ProveedorDeTitulo({ children }: { children: React.ReactNode }) {
  const [propio, setPropio] = React.useState<TituloDeBarra | null>(null)
  return (
    <Poner.Provider value={setPropio}>
      <Valor.Provider value={propio}>{children}</Valor.Provider>
    </Poner.Provider>
  )
}

/** El título que puso la pantalla, si puso uno. */
export function useTituloPropio() {
  return React.useContext(Valor)
}

/** Lo pone una página de detalle; al salir de ella, la barra vuelve a la ruta. */
export function TituloDeLaBarra({
  titulo,
  volver,
  alVolver,
  acciones,
  cerrar,
}: TituloDeBarra) {
  const poner = React.useContext(Poner)
  React.useEffect(() => {
    poner({ titulo, volver, alVolver, acciones, cerrar })
  }, [titulo, volver, alVolver, acciones, cerrar, poner])
  React.useEffect(() => () => poner(null), [poner])
  return null
}
