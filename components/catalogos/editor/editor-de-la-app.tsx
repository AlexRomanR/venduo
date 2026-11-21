"use client"

import * as React from "react"

import type { ClavePlantilla } from "@/lib/catalogos/constantes"
import {
  agotadosDe,
  elegidos,
  preciosDe,
  hojasDelBloque,
  type DatosDelCatalogo,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import { problemasDeEstilo, resolverEstilo } from "@/lib/catalogos/estilo"
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
  armarConEleccion,
  armarDesdePropuesta,
  estilosDeLaTienda,
  type EleccionDePlantilla,
} from "@/lib/catalogos/plantillas"
import {
  mensajeDeLaAppAlCatalogo,
  type MensajeDeLaAppAlCatalogo,
  type MensajeDelCatalogoAlaApp,
} from "@/lib/catalogos/protocolo-app"
import type { PropuestaDeCatalogo } from "@/lib/ai/schemas"
import { Probador } from "@/components/catalogos/editor/probador"
import { armarPropuesta } from "@/components/catalogos/editor/productos"
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

/** Dónde queda lo que no se guardó, por catálogo: uno nuevo va como "nuevo". */
const BORRADOR = "venduo:catalogo-de-la-app:"

interface BorradorGuardado {
  catalogo: Catalogo
  cuando: number
}

function leerBorrador(clave: string): BorradorGuardado | null {
  try {
    const crudo = window.localStorage.getItem(BORRADOR + clave)
    const leido = crudo ? (JSON.parse(crudo) as BorradorGuardado) : null
    return leido?.catalogo && typeof leido.cuando === "number" ? leido : null
  } catch {
    return null
  }
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
 * constructor de la web, con su deshacer. En modo galería muestra el probador
 * del constructor: el catálogo en grande con los productos elegidos y las
 * plantillas en miniatura, que se prueban tocándolas; "Usar esta plantilla" la
 * elige. Las hojas entran vivas, como en la web. Si se llegó tocando una plantilla en la lista (`empezarCon`),
 * los productos van directo a las hojas. Guardar y armar el PDF los hace la
 * app por la API.
 */
export function EditorDeCatalogoDeLaApp({
  datos,
  estiloDeTienda,
  plantillaDeLaTienda,
  plantillas,
  inicial,
  empezarCon = null,
  id = null,
}: {
  datos: DatosDelCatalogo
  estiloDeTienda: Estilo
  plantillaDeLaTienda: string | null
  plantillas: readonly ClavePlantilla[]
  inicial: Catalogo | null
  empezarCon?: EleccionDePlantilla | null
  /** El catálogo guardado que se abre: el borrador del teléfono va a su nombre. */
  id?: string | null
}) {
  // Lo que no se guardó queda en el teléfono, como el borrador de la tienda:
  // salir, perder la conexión o cerrar la app no lo pierde.
  const clave = React.useRef(id ?? "nuevo")
  // Se lee al crear el estado y no en un efecto: si no, el que guarda el
  // borrador correría antes y lo borraría sin preguntar.
  const [porRecuperar, setPorRecuperar] =
    React.useState<BorradorGuardado | null>(() => {
      const previo = leerBorrador(clave.current)
      return previo &&
        JSON.stringify(previo.catalogo) !== JSON.stringify(inicial)
        ? previo
        : null
    })
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
  // La propuesta de la IA que la app está mirando: se ve, no se aplica.
  const [mirando, setMirando] = React.useState<PropuestaDeCatalogo | null>(null)

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

  // Mientras haya algo sin guardar, queda en el teléfono; guardado, se borra.
  // Lo que espera ser recuperado no se pisa hasta que la persona decide.
  React.useEffect(() => {
    if (porRecuperar) return
    const sinGuardar =
      JSON.stringify(historial.presente) !== JSON.stringify(historial.guardado)
    try {
      if (sinGuardar && historial.presente) {
        window.localStorage.setItem(
          BORRADOR + clave.current,
          JSON.stringify({ catalogo: historial.presente, cuando: Date.now() })
        )
      } else {
        window.localStorage.removeItem(BORRADOR + clave.current)
      }
    } catch {
      // Sin almacenamiento: se edita igual, solo que no se recupera.
    }
  }, [historial, porRecuperar])

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
      sugeridos: sugeridos.map((sugerido) => {
        const { papel, tinta, acento } = resolverEstilo(sugerido.estilo).colores
        return {
          clave: sugerido.clave,
          nombre: sugerido.nombre,
          estilo: sugerido.estilo,
          muestra: { papel, tinta, acento },
        }
      }),
      estiloDeTienda,
      recuperable: porRecuperar?.cuando ?? null,
    })
  }, [
    catalogo,
    modo,
    historial,
    datos,
    sugeridos,
    estiloDeTienda,
    porRecuperar,
  ])

  const recibir = React.useCallback(
    (mensaje: MensajeDeLaAppAlCatalogo) => {
      // Lo que necesita un catálogo ya armado: si todavía no hay, se ignora.
      const con = (cambio: (actual: Catalogo) => Catalogo) => {
        if (catalogo) poner(cambio(catalogo))
      }

      switch (mensaje.tipo) {
        case "productos": {
          setSeleccion(mensaje.ids)
          if (catalogo) return poner(ponerProductos(catalogo, mensaje.ids))
          const armado = empezarCon
            ? armarConEleccion(
                empezarCon,
                {
                  nombre: nombreDelMes(),
                  productos: mensaje.ids
                    .map((id) => datos.productos[id])
                    .filter((producto): producto is ProductoDelCatalogo =>
                      Boolean(producto)
                    ),
                  tienda,
                  estilo: estiloDeTienda,
                },
                sugeridos
              )
            : null
          if (armado) {
            poner(armado)
            setModo("hojas")
          }
          return
        }
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
              agregarPack(actual, preciosDe(datos), agotadosDe(datos)).catalogo
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
        case "mirar":
          return setMirando(mensaje.propuesta)
        case "propuesta": {
          setMirando(null)
          if (catalogo) {
            poner(armarPropuesta(catalogo, mensaje.propuesta))
            setSeleccion(mensaje.propuesta.productos)
            return setModo("hojas")
          }
          const productos = mensaje.propuesta.productos
            .map((id) => datos.productos[id])
            .filter((producto): producto is ProductoDelCatalogo =>
              Boolean(producto)
            )
          poner(
            armarDesdePropuesta(mensaje.propuesta, {
              productos,
              tienda,
              estilo: estiloDeTienda,
            })
          )
          setSeleccion(mensaje.propuesta.productos)
          return setModo("hojas")
        }
        case "enfocar":
          setElegido(mensaje.id)
          return setPedido((antes) => antes + 1)
        case "recuperar": {
          const previo = porRecuperar
          setPorRecuperar(null)
          if (!mensaje.si || !previo) {
            try {
              window.localStorage.removeItem(BORRADOR + clave.current)
            } catch {}
            return
          }
          poner(previo.catalogo)
          setSeleccion(previo.catalogo.productos)
          return setModo("hojas")
        }
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
          // Uno nuevo pasa a tener nombre: lo que siga sin guardar va al suyo.
          if (mensaje.id && clave.current !== mensaje.id) {
            try {
              window.localStorage.removeItem(BORRADOR + clave.current)
            } catch {}
            clave.current = mensaje.id
          }
          return setHistorial((antes) => ({
            ...antes,
            guardado: antes.presente,
          }))
      }
    },
    [
      catalogo,
      poner,
      tienda,
      datos,
      estiloDeTienda,
      empezarCon,
      sugeridos,
      porRecuperar,
    ]
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
      <div className="bg-papel px-4 py-5">
        <Probador
          sugeridos={sugeridos}
          claves={plantillas}
          productos={productos}
          datos={datos}
          estilo={catalogo?.estilo ?? estiloDeTienda}
          nombre={catalogo?.nombre ?? nombreDelMes()}
          packs={catalogo?.packs}
          actual={catalogo?.plantilla}
          alUsar={elegir}
        />
      </div>
    )
  }

  return (
    <VistaPrevia
      catalogo={mirando ? armarPropuesta(catalogo, mirando) : catalogo}
      datos={datos}
      elegido={elegido}
      pedido={pedido}
      vivo
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
