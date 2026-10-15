"use client"

import * as React from "react"

import type { ClavePlantilla } from "@/lib/catalogos/constantes"
import {
  elegidos,
  hojasDelBloque,
  type DatosDelCatalogo,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import { problemasDeEstilo } from "@/lib/catalogos/estilo"
import type { Catalogo, Estilo } from "@/lib/catalogos/modelo"
import {
  agregarBloque,
  agregarPack,
  bloqueNuevo,
  cambiarBloque,
  cambiarPack,
  duplicarBloque,
  faltantes,
  moverBloque,
  ponerProductos,
  quitarBloque,
  quitarPack,
} from "@/lib/catalogos/operaciones"
import {
  armarDesdePropuesta,
  estilosDeLaTienda,
} from "@/lib/catalogos/plantillas"
import {
  mensajeDeLaAppAlCatalogo,
  type MensajeDeLaAppAlCatalogo,
  type MensajeDelCatalogoAlaApp,
} from "@/lib/catalogos/protocolo-app"
import {
  GaleriaDeEstilos,
  GaleriaDePlantillas,
} from "@/components/catalogos/editor/galeria"
import { VistaPrevia } from "@/components/catalogos/editor/vista-previa"

declare global {
  interface Window {
    venduoCatalogo?: { recibir: (mensaje: unknown) => void }
  }
}

function alaApp(mensaje: MensajeDelCatalogoAlaApp) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(mensaje))
}

/** Cuántos pasos se pueden deshacer. */
const LIMITE = 60

interface Historial {
  presente: Catalogo | null
  pasado: (Catalogo | null)[]
  futuro: (Catalogo | null)[]
  guardado: Catalogo | null
}

function nombreDelMes(): string {
  const mes = new Intl.DateTimeFormat("es-BO", {
    month: "long",
    timeZone: "America/La_Paz",
  }).format(new Date())
  return `Catálogo de ${mes}`
}

/**
 * El editor de catálogos que usa la app móvil: sin controles, solo el
 * catálogo y sus hojas.
 *
 * La app manda cambios y acá se aplican con las mismas operaciones que el
 * constructor de la web, con su deshacer. En modo galería muestra cada
 * plantilla ya armada con los productos elegidos, como el constructor, y tocar
 * una la elige. Guardar y armar el PDF los hace la app por la API.
 */
export function EditorDeCatalogoDeLaApp({
  datos,
  estiloDeTienda,
  plantillaDeLaTienda,
  plantillas,
  inicial,
}: {
  datos: DatosDelCatalogo
  estiloDeTienda: Estilo
  plantillaDeLaTienda: string | null
  plantillas: readonly ClavePlantilla[]
  inicial: Catalogo | null
}) {
  const [historial, setHistorial] = React.useState<Historial>({
    presente: inicial,
    pasado: [],
    futuro: [],
    guardado: inicial,
  })
  const [seleccion, setSeleccion] = React.useState<string[]>(
    inicial?.productos ?? []
  )
  const [modo, setModo] = React.useState<"galeria" | "hojas">(
    inicial ? "hojas" : "galeria"
  )
  const [elegido, setElegido] = React.useState<string | null>(null)
  const [pedido, setPedido] = React.useState(0)

  const catalogo = historial.presente
  const tienda = React.useMemo(
    () => ({ nombre: datos.tienda.nombre, whatsapp: datos.tienda.whatsapp }),
    [datos]
  )

  const poner = React.useCallback((nuevo: Catalogo) => {
    setHistorial((antes) => ({
      ...antes,
      presente: nuevo,
      pasado: [...antes.pasado, antes.presente].slice(-LIMITE),
      futuro: [],
    }))
  }, [])

  const sugeridos = React.useMemo(
    () =>
      estilosDeLaTienda(estiloDeTienda, plantillaDeLaTienda).filter((s) =>
        plantillas.includes(s.plantilla)
      ),
    [estiloDeTienda, plantillaDeLaTienda, plantillas]
  )

  const productosElegidos = React.useMemo(
    () =>
      seleccion
        .map((id) => datos.productos[id])
        .filter((producto): producto is ProductoDelCatalogo =>
          Boolean(producto)
        ),
    [seleccion, datos]
  )

  // Cada cambio se le cuenta a la app: el catálogo, lo que falta para
  // guardarlo y lo que no se lee de su estilo.
  React.useEffect(() => {
    alaApp({
      tipo: "estado",
      catalogo,
      modo,
      hojasPorBloque: catalogo
        ? Object.fromEntries(
            catalogo.bloques.map((bloque) => [
              bloque.id,
              hojasDelBloque(bloque, catalogo, datos),
            ])
          )
        : {},
      faltantes: catalogo ? faltantes(catalogo) : [],
      problemasDeEstilo: catalogo ? problemasDeEstilo(catalogo.estilo) : [],
      puedeDeshacer: historial.pasado.length > 0,
      puedeRehacer: historial.futuro.length > 0,
      sinGuardar:
        JSON.stringify(catalogo) !== JSON.stringify(historial.guardado),
    })
  }, [catalogo, modo, historial, datos])

  const recibir = React.useCallback(
    (mensaje: MensajeDeLaAppAlCatalogo) => {
      // Lo que necesita un catálogo ya armado: si todavía no hay, se ignora.
      const con = (cambio: (actual: Catalogo) => Catalogo) => {
        if (catalogo) poner(cambio(catalogo))
      }

      switch (mensaje.tipo) {
        case "productos":
          setSeleccion(mensaje.ids)
          return con((actual) => ponerProductos(actual, mensaje.ids))
        case "galeria":
          return setModo("galeria")
        case "hojas":
          return setModo(catalogo ? "hojas" : "galeria")
        case "agregar":
          return con((actual) =>
            agregarBloque(
              actual,
              bloqueNuevo(mensaje.bloque, actual, tienda),
              mensaje.despuesDe
            )
          )
        case "cambiar":
          return con((actual) => cambiarBloque(actual, mensaje.bloque))
        case "quitar":
          return con((actual) => quitarBloque(actual, mensaje.id))
        case "duplicar":
          return con((actual) => duplicarBloque(actual, mensaje.id))
        case "mover":
          return con((actual) =>
            moverBloque(actual, mensaje.id, mensaje.posicion)
          )
        case "pack-agregar":
          return con(
            (actual) =>
              agregarPack(
                actual,
                Object.fromEntries(
                  Object.values(datos.productos).map((p) => [
                    p.id,
                    p.precioCents,
                  ])
                )
              ).catalogo
          )
        case "pack-cambiar":
          return con((actual) => cambiarPack(actual, mensaje.pack))
        case "pack-quitar":
          return con((actual) => quitarPack(actual, mensaje.id))
        case "estilo":
          return con((actual) => ({ ...actual, estilo: mensaje.estilo }))
        case "nombre":
          return con((actual) => ({ ...actual, nombre: mensaje.nombre }))
        case "hoja":
          return con((actual) => ({ ...actual, hoja: mensaje.hoja }))
        case "propuesta": {
          const productos = mensaje.propuesta.productos
            .map((id) => datos.productos[id])
            .filter((producto): producto is ProductoDelCatalogo =>
              Boolean(producto)
            )
          poner(
            armarDesdePropuesta(mensaje.propuesta, {
              productos,
              tienda,
              estilo: catalogo?.estilo ?? estiloDeTienda,
            })
          )
          setSeleccion(mensaje.propuesta.productos)
          return setModo("hojas")
        }
        case "enfocar":
          setElegido(mensaje.id)
          return setPedido((antes) => antes + 1)
        case "deshacer":
          return setHistorial((antes) => {
            if (antes.pasado.length === 0) return antes
            return {
              ...antes,
              presente: antes.pasado.at(-1) ?? null,
              pasado: antes.pasado.slice(0, -1),
              futuro: [antes.presente, ...antes.futuro],
            }
          })
        case "rehacer":
          return setHistorial((antes) => {
            if (antes.futuro.length === 0) return antes
            return {
              ...antes,
              presente: antes.futuro[0],
              pasado: [...antes.pasado, antes.presente],
              futuro: antes.futuro.slice(1),
            }
          })
        case "guardado":
          return setHistorial((antes) => ({
            ...antes,
            guardado: antes.presente,
          }))
      }
    },
    [catalogo, poner, tienda, datos, estiloDeTienda]
  )

  React.useEffect(() => {
    window.venduoCatalogo = {
      recibir(crudo) {
        const leido = mensajeDeLaAppAlCatalogo.safeParse(
          typeof crudo === "string" ? JSON.parse(crudo) : crudo
        )
        if (leido.success) recibir(leido.data)
      },
    }
    return () => {
      delete window.venduoCatalogo
    }
  }, [recibir])

  if (modo === "galeria" || !catalogo) {
    const productos = catalogo ? elegidos(catalogo, datos) : productosElegidos
    const elegir = (nuevo: Catalogo) => {
      poner(nuevo)
      setModo("hojas")
    }
    if (productos.length === 0) return null

    return (
      <div className="flex flex-col gap-8 bg-papel px-4 py-5">
        {sugeridos.length > 0 ? (
          <GaleriaDeEstilos
            sugeridos={sugeridos}
            productos={productos}
            datos={datos}
            nombre={catalogo?.nombre ?? nombreDelMes()}
            packs={catalogo?.packs}
            alElegir={elegir}
          />
        ) : null}
        <GaleriaDePlantillas
          productos={productos}
          datos={datos}
          estilo={catalogo?.estilo ?? estiloDeTienda}
          nombre={catalogo?.nombre ?? nombreDelMes()}
          packs={catalogo?.packs}
          actual={catalogo?.plantilla}
          claves={plantillas}
          alElegir={elegir}
        />
      </div>
    )
  }

  return (
    <VistaPrevia
      catalogo={catalogo}
      datos={datos}
      elegido={elegido}
      pedido={pedido}
      alElegir={(id) => {
        setElegido(id)
        alaApp({ tipo: "tocar", id })
      }}
      className="min-h-dvh bg-tinta/5 px-3 py-4"
    />
  )
}

/** Sin tienda, sin permiso o un catálogo que no es suyo. */
export function SinCatalogoParaLaApp() {
  React.useEffect(() => alaApp({ tipo: "sin-tienda" }), [])
  return null
}
