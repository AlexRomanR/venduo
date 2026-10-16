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
  [/^\/panel\/marketing/, { titulo: "Marketing" }],
  [/^\/cuenta/, { titulo: "Tu cuenta" }],
]

/** El título de una ruta. `null` en el Resumen: ahí manda su cabecera. */
export function tituloDeRuta(ruta: string): TituloDeBarra | null {
  return SECCIONES.find(([patron]) => patron.test(ruta))?.[1] ?? null
}

const Contexto = React.createContext<{
  propio: TituloDeBarra | null
  setPropio: (titulo: TituloDeBarra | null) => void
}>({ propio: null, setPropio: () => {} })

export function ProveedorDeTitulo({ children }: { children: React.ReactNode }) {
  const [propio, setPropio] = React.useState<TituloDeBarra | null>(null)
  const valor = React.useMemo(() => ({ propio, setPropio }), [propio])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/** El título que puso la pantalla, si puso uno. */
export function useTituloPropio() {
  return React.useContext(Contexto).propio
}

/** Lo pone una página de detalle; al salir de ella, la barra vuelve a la ruta. */
export function TituloDeLaBarra({ titulo, volver }: TituloDeBarra) {
  const { setPropio } = React.useContext(Contexto)
  React.useEffect(() => {
    setPropio({ titulo, volver })
    return () => setPropio(null)
  }, [titulo, volver, setPropio])
  return null
}
