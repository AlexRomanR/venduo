"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  FileDown,
  LayoutTemplate,
  LoaderCircle,
  Package,
  Palette,
  PencilLine,
  Save,
  Send,
  Share2,
  WandSparkles,
} from "lucide-react"
import { toast } from "sonner"

import type { PropuestaDeCatalogo } from "@/lib/ai/schemas"
import { HOJAS, type ClavePlantilla } from "@/lib/catalogos/constantes"
import {
  elegidos,
  hojasDe,
  type DatosDelCatalogo,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import { problemasDeEstilo } from "@/lib/catalogos/estilo"
import type { Catalogo, Estilo } from "@/lib/catalogos/modelo"
import { faltantes } from "@/lib/catalogos/operaciones"
import {
  armarCatalogo,
  estilosDeLaTienda,
  type EstiloSugerido,
} from "@/lib/catalogos/plantillas"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { Cabecera, Seccion } from "@/components/panel/piezas"
import { Aviso } from "@/components/editor/piezas"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BotonDeCanva,
  type ModoDeCanva,
} from "@/components/catalogos/editor/canva"
import { PanelDeEstilo } from "@/components/catalogos/editor/estilo"
import {
  compartirArchivo,
  descargarPdf,
  enlaceDeWhatsApp,
  nombreDelArchivo,
  pedirPdf,
  puedeCompartirArchivos,
} from "@/components/catalogos/editor/exportar"
import {
  GaleriaDeEstilos,
  GaleriaDePlantillas,
} from "@/components/catalogos/editor/galeria"
import { PanelDeHojas } from "@/components/catalogos/editor/hojas"
import { PedidoALaIa } from "@/components/catalogos/editor/ia"
import { PanelDePacks } from "@/components/catalogos/editor/packs"
import { PanelDeProductos } from "@/components/catalogos/editor/productos"
import { SelectorDeProductos } from "@/components/catalogos/editor/selector"
import { VistaPrevia } from "@/components/catalogos/editor/vista-previa"
import { guardarCatalogo } from "@/app/(privado)/panel/catalogos/acciones"

/*
 * El constructor de catálogos: elegir productos, elegir plantilla y editar
 * viendo cómo queda.
 *
 * Todo pasa en el navegador hasta que se guarda: el catálogo es un objeto, las
 * operaciones son puras (`lib/catalogos/operaciones.ts`) y la vista previa lo
 * dibuja con las mismas variantes que el PDF. El servidor entra en tres
 * momentos: al guardar, al armar el PDF y al pedirle algo a la IA.
 */

type Fase = "contenido" | "plantilla" | "editar"
type Panel = "hojas" | "productos" | "packs" | "estilo"

const PANELES: { clave: Panel; nombre: string }[] = [
  { clave: "hojas", nombre: "Hojas" },
  { clave: "productos", nombre: "Productos" },
  { clave: "packs", nombre: "Packs" },
  { clave: "estilo", nombre: "Estilo" },
]

export interface CatalogoInicial {
  id: string
  catalogo: Catalogo
  enlace: string
}

function nombreDelMes(): string {
  const mes = new Intl.DateTimeFormat("es-BO", {
    month: "long",
    timeZone: "America/La_Paz",
  }).format(new Date())
  return `Catálogo de ${mes}`
}

export function Constructor({
  datos,
  estiloDeTienda,
  plantillaDeLaTienda,
  esDemo,
  inicial,
  canva,
  avisoDeCanva = null,
}: {
  datos: DatosDelCatalogo
  estiloDeTienda: Estilo
  plantillaDeLaTienda: string | null
  esDemo: boolean
  inicial: CatalogoInicial | null
  /** Directo si la integración con Canva está configurada; si no, a mano. */
  canva: ModoDeCanva
  /** Lo que pasó al volver de Canva, si se volvió con un problema. */
  avisoDeCanva?: string | null
}) {
  const sugeridos = React.useMemo(
    () => estilosDeLaTienda(estiloDeTienda, plantillaDeLaTienda),
    [estiloDeTienda, plantillaDeLaTienda]
  )
  const [catalogo, setCatalogo] = React.useState<Catalogo | null>(
    inicial?.catalogo ?? null
  )
  const [guardado, setGuardado] = React.useState(
    inicial ? { id: inicial.id, enlace: inicial.enlace } : null
  )
  const [sinGuardar, setSinGuardar] = React.useState(false)
  const [fase, setFase] = React.useState<Fase>(inicial ? "editar" : "contenido")
  const [seleccion, setSeleccion] = React.useState<string[]>([])
  const [sugerida, setSugerida] = React.useState<ClavePlantilla | null>(null)

  const productosDe = React.useCallback(
    (ids: string[]) =>
      ids
        .map((id) => datos.productos[id])
        .filter((producto): producto is ProductoDelCatalogo =>
          Boolean(producto)
        ),
    [datos]
  )

  const cambiar = React.useCallback((nuevo: Catalogo) => {
    setCatalogo(nuevo)
    setSinGuardar(true)
  }, [])

  // Salir con cambios sin guardar pregunta antes. En modo demo no hay qué
  // perder: no se guarda nunca.
  React.useEffect(() => {
    if (!sinGuardar || esDemo) return
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [sinGuardar, esDemo])

  function usarPropuesta(propuesta: PropuestaDeCatalogo) {
    const nuevo = armarCatalogo({
      plantilla: propuesta.plantilla,
      nombre: propuesta.nombre,
      productos: productosDe(propuesta.productos),
      tienda: { nombre: datos.tienda.nombre, whatsapp: datos.tienda.whatsapp },
      estilo: estiloDeTienda,
    })
    const conBajada = propuesta.bajada
      ? {
          ...nuevo,
          bloques: nuevo.bloques.map((bloque) =>
            bloque.tipo === "portada"
              ? { ...bloque, bajada: propuesta.bajada }
              : bloque
          ),
        }
      : nuevo
    cambiar(conBajada)
    setSeleccion(propuesta.productos)
    setSugerida(propuesta.plantilla)
    setFase("editar")
    toast.success("Listo: revisa el catálogo y cámbiale lo que quieras.")
  }

  if (fase === "contenido") {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <Volver />
        <Cabecera
          titulo="Nuevo catálogo."
          bajada="Elige qué productos van y en qué orden. Después eliges la plantilla y lo ajustas viendo cómo queda."
          demo={
            esDemo &&
            "Estás en modo demo: los productos son de ejemplo y el catálogo no se guarda, pero el PDF sí se descarga."
          }
        />
        <Seccion
          id="ia"
          icono={WandSparkles}
          titulo="Pídeselo a la IA"
          bajada="Dile qué catálogo quieres y lo arma con tus productos."
          relleno
        >
          <PedidoALaIa
            titulo="¿Qué catálogo quieres?"
            ayuda="Elige los productos, el orden y la plantilla. Tú revisas antes de usarlo."
            ejemplos={[
              "Las zapatillas en oferta",
              "Lista de precios para revendedores",
              "Lo nuevo para los estados de WhatsApp",
            ]}
            actuales={null}
            textoDeUsar="Armarlo así"
            alUsar={usarPropuesta}
          />
        </Seccion>
        <Seccion
          id="productos"
          icono={Package}
          titulo="O elígelos tú"
          bajada="Márcalos en el orden en que quieres que aparezcan."
        >
          <SelectorDeProductos
            productos={Object.values(datos.productos)}
            categorias={datos.categorias}
            elegidos={seleccion}
            alCambiar={setSeleccion}
          />
          <div className="sticky bottom-0 border-t border-tinta bg-papel px-4 py-3 sm:px-5">
            <button
              type="button"
              disabled={seleccion.length === 0}
              onClick={() => setFase("plantilla")}
              className={cn(BOTON_PRIMARIO, "w-full")}
            >
              <LayoutTemplate aria-hidden="true" className="size-5" />
              {seleccion.length === 0
                ? "Elige al menos un producto"
                : `Elegir la plantilla · ${seleccion.length} ${seleccion.length === 1 ? "producto" : "productos"}`}
            </button>
          </div>
        </Seccion>
      </div>
    )
  }

  if (fase === "plantilla") {
    const productos = catalogo
      ? elegidos(catalogo, datos)
      : productosDe(seleccion)
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <button
          type="button"
          onClick={() => setFase(catalogo ? "editar" : "contenido")}
          className="group inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {catalogo ? "Volver al catálogo" : "Volver a los productos"}
        </button>
        <Cabecera
          titulo="Elige una plantilla."
          bajada={
            catalogo
              ? "Las hojas se arman de nuevo con la que elijas. Tus productos, packs y colores se quedan."
              : "Cada una armada con tus productos y los colores de tu tienda. Después cambias cualquier hoja."
          }
        />
        {sugeridos.length > 0 ? (
          <Seccion
            id="con-tu-estilo"
            icono={Palette}
            titulo="Con el estilo de tu tienda"
            bajada="Tus colores tal cual, tu color a toda hoja, en oscuro o en tonos de tu color."
          >
            <GaleriaDeEstilos
              sugeridos={sugeridos}
              productos={productos}
              datos={datos}
              nombre={catalogo?.nombre ?? nombreDelMes()}
              packs={catalogo?.packs}
              alElegir={(nuevo) => {
                cambiar(nuevo)
                setFase("editar")
              }}
            />
          </Seccion>
        ) : null}
        <Seccion
          id="plantillas"
          icono={LayoutTemplate}
          titulo="Las doce plantillas"
          bajada={`Con tus ${productos.length} ${productos.length === 1 ? "producto" : "productos"}.`}
        >
          <GaleriaDePlantillas
            productos={productos}
            datos={datos}
            estilo={catalogo?.estilo ?? estiloDeTienda}
            nombre={catalogo?.nombre ?? nombreDelMes()}
            packs={catalogo?.packs}
            actual={catalogo?.plantilla}
            sugerida={sugerida}
            alElegir={(nuevo) => {
              cambiar(nuevo)
              setFase("editar")
            }}
          />
        </Seccion>
      </div>
    )
  }

  if (!catalogo) return null

  return (
    <Editor
      catalogo={catalogo}
      datos={datos}
      estiloDeTienda={estiloDeTienda}
      sugeridos={sugeridos}
      esDemo={esDemo}
      canva={canva}
      avisoDeCanva={avisoDeCanva}
      guardado={guardado}
      sinGuardar={sinGuardar}
      alCambiar={cambiar}
      alGuardar={(resultado) => {
        setGuardado(resultado)
        setSinGuardar(false)
      }}
      alCambiarPlantilla={() => setFase("plantilla")}
    />
  )
}

function Volver() {
  return (
    <Link
      href="/panel/catalogos"
      className="group inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
      />
      Tus catálogos
    </Link>
  )
}

/* ---------------------------------------------------------------------------
 * El editor
 * ------------------------------------------------------------------------ */

function Editor({
  catalogo,
  datos,
  estiloDeTienda,
  sugeridos,
  esDemo,
  canva,
  avisoDeCanva,
  guardado,
  sinGuardar,
  alCambiar,
  alGuardar,
  alCambiarPlantilla,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  estiloDeTienda: Estilo
  sugeridos: EstiloSugerido[]
  esDemo: boolean
  canva: ModoDeCanva
  avisoDeCanva: string | null
  guardado: { id: string; enlace: string } | null
  sinGuardar: boolean
  alCambiar: (catalogo: Catalogo) => void
  alGuardar: (guardado: { id: string; enlace: string }) => void
  alCambiarPlantilla: () => void
}) {
  const [panel, setPanel] = React.useState<Panel>("hojas")
  const [elegido, setElegido] = React.useState<string | null>(null)
  const [vista, setVista] = React.useState<"editar" | "ver">("editar")
  // Al abrir la vista en el celular, que muestre la hoja que se estaba editando.
  const [pedidoDeVista, setPedidoDeVista] = React.useState(0)
  const [ocupado, setOcupado] = React.useState<
    null | "guardar" | "descargar" | "compartir"
  >(null)
  const [compartible, setCompartible] = React.useState(false)
  React.useEffect(() => setCompartible(puedeCompartirArchivos()), [])

  const hojas = hojasDe(catalogo, datos).length
  const problemas = [
    ...faltantes(catalogo),
    ...problemasDeEstilo(catalogo.estilo),
  ]
  const bloqueado = problemas.length > 0 || hojas === 0

  async function guardar() {
    setOcupado("guardar")
    const resultado = await guardarCatalogo(guardado?.id ?? null, catalogo)
    setOcupado(null)
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    alGuardar({ id: resultado.id, enlace: resultado.enlace })
    toast.success("Catálogo guardado.")
    // La dirección pasa a ser la del catálogo guardado sin volver a cargar la
    // pantalla: se perdería lo que estaba abierto.
    if (!guardado) {
      window.history.replaceState(null, "", `/panel/catalogos/${resultado.id}`)
    }
  }

  async function bajarPdf() {
    setOcupado("descargar")
    try {
      await descargarPdf(catalogo)
      toast.success("Listo: tu catálogo está en Descargas.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No pudimos armar el PDF."
      )
    } finally {
      setOcupado(null)
    }
  }

  async function compartirPdf() {
    setOcupado("compartir")
    try {
      const pdf = await pedirPdf(catalogo)
      await compartirArchivo(
        pdf,
        nombreDelArchivo(catalogo.nombre),
        catalogo.nombre
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No pudimos compartirlo."
      )
    } finally {
      setOcupado(null)
    }
  }

  function elegirHoja(id: string) {
    setElegido(id)
    setPanel("hojas")
    setVista("editar")
  }

  const estado = esDemo
    ? "Modo demo: no se guarda"
    : sinGuardar
      ? "Cambios sin guardar"
      : guardado
        ? "Guardado"
        : "Sin guardar"

  return (
    <div className="flex flex-col gap-5 pb-24 lg:pb-0">
      <Volver />

      <header className="flex flex-col gap-4 border-b border-tinta pb-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 flex-[1_1_18rem]">
            <label
              htmlFor="nombre-del-catalogo"
              className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65"
            >
              Nombre del catálogo
            </label>
            <input
              id="nombre-del-catalogo"
              value={catalogo.nombre}
              maxLength={80}
              onChange={(evento) =>
                alCambiar({ ...catalogo, nombre: evento.target.value })
              }
              className="mt-1 w-full border-0 border-b border-transparent bg-transparent font-titular text-[clamp(1.6rem,5vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em] hover:border-tinta/30 focus-visible:border-senal focus-visible:outline-none"
            />
            <p className="mt-1 flex items-center gap-1.5 text-sm opacity-70">
              {!sinGuardar && guardado && !esDemo ? (
                <Check aria-hidden="true" className="size-4" />
              ) : null}
              {estado} · {hojas} {hojas === 1 ? "hoja" : "hojas"} ·{" "}
              {HOJAS[catalogo.hoja].nombre}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {esDemo ? null : (
              <button
                type="button"
                onClick={guardar}
                disabled={ocupado !== null || bloqueado}
                className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
              >
                {ocupado === "guardar" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                Guardar
              </button>
            )}
            <BotonDeCanva
              catalogo={catalogo}
              modo={canva}
              aviso={avisoDeCanva}
              guardado={guardado}
              sinGuardar={sinGuardar}
              deshabilitado={ocupado !== null || bloqueado}
              alGuardar={alGuardar}
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={ocupado !== null || bloqueado}
                className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
              >
                {ocupado === "compartir" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Share2 aria-hidden="true" className="size-4" />
                )}
                Compartir
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {compartible ? (
                  <DropdownMenuItem onSelect={compartirPdf}>
                    <Share2 aria-hidden="true" className="size-4" />
                    Mandar el PDF: WhatsApp y más
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  disabled={!guardado || sinGuardar}
                  onSelect={() => {
                    if (!guardado) return
                    window.open(
                      enlaceDeWhatsApp(
                        `${catalogo.nombre} · ${datos.tienda.nombre}\n${guardado.enlace}`
                      ),
                      "_blank",
                      "noopener"
                    )
                  }}
                >
                  <Send aria-hidden="true" className="size-4" />
                  Mandar el enlace por WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!guardado || sinGuardar}
                  onSelect={async () => {
                    if (!guardado) return
                    await navigator.clipboard.writeText(guardado.enlace)
                    toast.success("Enlace copiado.")
                  }}
                >
                  <Copy aria-hidden="true" className="size-4" />
                  Copiar el enlace
                </DropdownMenuItem>
                <p className="px-2 py-2 text-xs leading-relaxed opacity-65">
                  {esDemo
                    ? "En modo demo no hay enlace: baja el PDF y compártelo."
                    : !guardado || sinGuardar
                      ? "Guarda para tener el enlace. El enlace abre el catálogo con los precios y el stock del día."
                      : "El enlace abre el catálogo con los precios y el stock del día."}
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={bajarPdf}
              disabled={ocupado !== null || bloqueado}
              className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
            >
              {ocupado === "descargar" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              ) : (
                <FileDown aria-hidden="true" className="size-4" />
              )}
              {ocupado === "descargar" ? "Armando el PDF…" : "Descargar PDF"}
            </button>
          </div>
        </div>

        {problemas.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {problemas.map((problema) => (
              <Aviso key={problema} tono="problema">
                {problema}
              </Aviso>
            ))}
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-start xl:gap-8">
        <section
          aria-label="Editar el catálogo"
          className={cn(
            "min-w-0 border border-tinta",
            vista === "ver" && "hidden lg:block"
          )}
        >
          <div
            role="tablist"
            aria-label="Qué editar"
            className="grid grid-cols-4 border-b border-tinta"
          >
            {PANELES.map(({ clave, nombre }) => (
              <button
                key={clave}
                type="button"
                role="tab"
                id={`pestana-${clave}`}
                aria-selected={panel === clave}
                aria-controls={`panel-${clave}`}
                onClick={() => {
                  setPanel(clave)
                  if (clave !== "hojas") setElegido(null)
                }}
                className={cn(
                  "min-h-12 border-l border-tinta/15 text-sm font-semibold transition-colors first:border-l-0",
                  panel === clave
                    ? "bg-tinta text-papel"
                    : "hover:bg-tinta/[0.05]"
                )}
              >
                {nombre}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`panel-${panel}`}
            aria-labelledby={`pestana-${panel}`}
          >
            {panel === "hojas" ? (
              <PanelDeHojas
                catalogo={catalogo}
                datos={datos}
                elegido={elegido}
                alElegir={setElegido}
                alCambiar={alCambiar}
                alIrA={setPanel}
              />
            ) : panel === "productos" ? (
              <PanelDeProductos
                catalogo={catalogo}
                datos={datos}
                alCambiar={alCambiar}
              />
            ) : panel === "packs" ? (
              <PanelDePacks
                catalogo={catalogo}
                datos={datos}
                alCambiar={alCambiar}
              />
            ) : (
              <PanelDeEstilo
                catalogo={catalogo}
                estiloDeTienda={estiloDeTienda}
                sugeridos={sugeridos}
                alCambiar={alCambiar}
                alCambiarPlantilla={alCambiarPlantilla}
              />
            )}
          </div>
        </section>

        <section
          aria-label="Vista previa"
          className={cn(
            "min-w-0 flex-col border border-tinta lg:sticky lg:top-6 lg:flex",
            vista === "editar" ? "hidden" : "flex"
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-tinta/15 px-4 py-3 sm:px-5">
            <h2 className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
              Vista previa
            </h2>
            <p className="text-xs opacity-65">Toca una hoja para editarla</p>
          </header>
          <VistaPrevia
            catalogo={catalogo}
            datos={datos}
            elegido={elegido}
            pedido={pedidoDeVista}
            alElegir={elegirHoja}
            className="bg-tinta/[0.04] px-4 py-6 sm:px-6 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto"
          />
        </section>
      </div>

      {/* En el celular no entran las dos columnas: se alterna entre editar y
          ver, con el botón siempre al alcance del pulgar. */}
      <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-tinta bg-papel lg:hidden">
        <button
          type="button"
          aria-pressed={vista === "editar"}
          onClick={() => setVista("editar")}
          className={cn(
            "flex min-h-14 items-center justify-center gap-2 text-sm font-semibold",
            vista === "editar" && "bg-tinta text-papel"
          )}
        >
          <PencilLine aria-hidden="true" className="size-4" />
          Editar
        </button>
        <button
          type="button"
          aria-pressed={vista === "ver"}
          onClick={() => {
            setVista("ver")
            setPedidoDeVista((pedido) => pedido + 1)
          }}
          className={cn(
            "flex min-h-14 items-center justify-center gap-2 text-sm font-semibold",
            vista === "ver" && "bg-tinta text-papel"
          )}
        >
          <Eye aria-hidden="true" className="size-4" />
          Ver las {hojas} {hojas === 1 ? "hoja" : "hojas"}
        </button>
      </div>
    </div>
  )
}
