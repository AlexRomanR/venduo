"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  FileDown,
  Layers,
  LayoutTemplate,
  LoaderCircle,
  Package,
  Palette,
  Redo2,
  Save,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  CLAVES_PLANTILLA,
  HOJAS,
  type ClavePlantilla,
} from "@/lib/catalogos/constantes"
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
  armarConEleccion,
  estilosDeLaTienda,
  nombreDeEleccion,
  type EleccionDePlantilla,
  type EstiloSugerido,
} from "@/lib/catalogos/plantillas"
import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO_LINEA,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { AVISO_DE_NO_DISPONIBLE, type EstadoDeFuncion } from "@/lib/funciones"
import { cn } from "@/lib/utils"
import { useConfirmacion } from "@/components/panel/confirmar"
import { ConFuncion } from "@/components/panel/funcion"
import { Cabecera, Seccion } from "@/components/panel/piezas"
import { TituloDeLaBarra } from "@/components/panel/titulo-de-barra"
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
import { PanelDePacks } from "@/components/catalogos/editor/packs"
import {
  PanelDeslizable,
  type NivelDelPanel,
} from "@/components/catalogos/editor/panel-deslizable"
import {
  PanelDeIa,
  PanelDeProductos,
} from "@/components/catalogos/editor/productos"
import { SelectorConFotos } from "@/components/catalogos/editor/selector"
import { VistaPrevia } from "@/components/catalogos/editor/vista-previa"
import {
  borrarCatalogo,
  guardarCatalogo,
} from "@/app/(privado)/panel/catalogos/acciones"

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
type Panel = "hojas" | "productos" | "packs" | "estilo" | "ia" | "listo"

/**
 * Las pestañas del editor, las mismas de la app y con sus íconos. "Listo"
 * —nombre, guardar y mandar— es del celular: en una pantalla ancha eso va en
 * la cabecera.
 */
const PANELES: { clave: Panel; nombre: string; icono: LucideIcon }[] = [
  { clave: "hojas", nombre: "Hojas", icono: Layers },
  { clave: "productos", nombre: "Productos", icono: ShoppingBag },
  { clave: "packs", nombre: "Packs", icono: Package },
  { clave: "estilo", nombre: "Estilo", icono: Palette },
  { clave: "ia", nombre: "IA", icono: Sparkles },
  { clave: "listo", nombre: "Listo", icono: Check },
]

/** Cuántos pasos se pueden deshacer, como en la app. */
const LIMITE_DE_PASOS = 60

interface Historial {
  presente: Catalogo | null
  pasado: (Catalogo | null)[]
  futuro: (Catalogo | null)[]
}

/** Lo que Venduo dejó activo en esta tienda, de lo que toca este editor. */
export interface FuncionesDelCatalogo {
  ia: EstadoDeFuncion
  canva: EstadoDeFuncion
  compartir: EstadoDeFuncion
}

const TODO_ACTIVO: FuncionesDelCatalogo = {
  ia: "activa",
  canva: "activa",
  compartir: "activa",
}

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
  funciones = TODO_ACTIVO,
  plantillas = CLAVES_PLANTILLA,
  empezarCon = null,
}: {
  datos: DatosDelCatalogo
  estiloDeTienda: Estilo
  plantillaDeLaTienda: string | null
  esDemo: boolean
  inicial: CatalogoInicial | null
  funciones?: FuncionesDelCatalogo
  /** Las plantillas que Venduo ofrece, en su orden. */
  plantillas?: readonly ClavePlantilla[]
  /** Directo si la integración con Canva está configurada; si no, a mano. */
  canva: ModoDeCanva
  /** Lo que pasó al volver de Canva, si se volvió con un problema. */
  avisoDeCanva?: string | null
  /**
   * La plantilla o el estilo que se tocó en la lista: con los productos
   * elegidos se arma directo con ella, sin pasar por la galería.
   */
  empezarCon?: EleccionDePlantilla | null
}) {
  const sugeridos = React.useMemo(
    () =>
      estilosDeLaTienda(estiloDeTienda, plantillaDeLaTienda).filter((s) =>
        plantillas.includes(s.plantilla)
      ),
    [estiloDeTienda, plantillaDeLaTienda, plantillas]
  )
  const [historial, setHistorial] = React.useState<Historial>({
    presente: inicial?.catalogo ?? null,
    pasado: [],
    futuro: [],
  })
  const catalogo = historial.presente
  const [guardado, setGuardado] = React.useState(
    inicial ? { id: inicial.id, enlace: inicial.enlace } : null
  )
  const [sinGuardar, setSinGuardar] = React.useState(false)
  const [fase, setFase] = React.useState<Fase>(inicial ? "editar" : "contenido")
  const router = useRouter()
  const [seleccion, setSeleccion] = React.useState<string[]>([])

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
    setHistorial((antes) => ({
      presente: nuevo,
      pasado: [...antes.pasado, antes.presente].slice(-LIMITE_DE_PASOS),
      futuro: [],
    }))
    setSinGuardar(true)
  }, [])

  // Deshacer no vuelve más atrás del primer catálogo armado: antes de eso no
  // había nada que editar.
  const deshacer = React.useCallback(() => {
    setHistorial((antes) => {
      const anterior = antes.pasado.at(-1)
      if (!anterior) return antes
      return {
        presente: anterior,
        pasado: antes.pasado.slice(0, -1),
        futuro: [antes.presente, ...antes.futuro],
      }
    })
    setSinGuardar(true)
  }, [])

  const rehacer = React.useCallback(() => {
    setHistorial((antes) => {
      const [siguiente, ...resto] = antes.futuro
      if (!siguiente) return antes
      return {
        presente: siguiente,
        pasado: [...antes.pasado, antes.presente],
        futuro: resto,
      }
    })
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

  const elegida = empezarCon ? nombreDeEleccion(empezarCon, sugeridos) : null

  /** Con los productos elegidos: directo a editar si ya hay plantilla. */
  function seguir() {
    const armado = empezarCon
      ? armarConEleccion(
          empezarCon,
          {
            nombre: nombreDelMes(),
            productos: productosDe(seleccion),
            tienda: {
              nombre: datos.tienda.nombre,
              whatsapp: datos.tienda.whatsapp,
            },
            estilo: estiloDeTienda,
          },
          sugeridos
        )
      : null
    if (armado) {
      cambiar(armado)
      setFase("editar")
    } else {
      setFase("plantilla")
    }
  }

  if (fase === "contenido") {
    return (
      <div className="flex flex-col gap-6 max-lg:pb-24 md:gap-8">
        {/* En el celular es el paso de la app: "Tus productos" arriba, con
            la X para salir, y el botón fijo abajo. */}
        <TituloDeLaBarra
          titulo="Tus productos"
          volver="/panel/catalogos"
          alVolver={() => router.push("/panel/catalogos")}
          cerrar
        />
        <div className="flex flex-col gap-6 max-lg:hidden md:gap-8">
          <Volver />
          <Cabecera
            titulo="Nuevo catálogo."
            bajada={
              elegida
                ? `Con la plantilla ${elegida}. Elige los productos y en qué orden.`
                : "Elige los productos y en qué orden; después, el estilo."
            }
          />
        </div>
        <SelectorConFotos
          productos={Object.values(datos.productos)}
          categorias={datos.categorias}
          elegidos={seleccion}
          alCambiar={setSeleccion}
        />
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-tinta bg-papel px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:sticky lg:-mx-10 lg:px-10">
          <button
            type="button"
            disabled={seleccion.length === 0}
            onClick={seguir}
            className={cn(BOTON_PRIMARIO, "w-full lg:mx-auto lg:max-w-md")}
          >
            <LayoutTemplate aria-hidden="true" className="size-5" />
            {seleccion.length === 0
              ? "Elige los productos"
              : `${elegida ? "Armar el catálogo" : "Elegir el estilo"} · ${seleccion.length}`}
          </button>
        </div>
      </div>
    )
  }

  if (fase === "plantilla") {
    const productos = catalogo
      ? elegidos(catalogo, datos)
      : productosDe(seleccion)
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <TituloDeLaBarra
          titulo="Elige el estilo"
          volver="/panel/catalogos"
          alVolver={() => setFase(catalogo ? "editar" : "contenido")}
        />
        <div className="flex flex-col gap-6 max-lg:hidden md:gap-8">
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
                ? "Las hojas se arman de nuevo con la que elijas; tus productos, packs y colores se quedan."
                : "Cada una armada con tus productos y los colores de tu tienda."
            }
          />
        </div>
        {sugeridos.length > 0 ? (
          <Seccion
            id="con-tu-estilo"
            icono={Palette}
            titulo="Con el estilo de tu tienda"
            bajada="Tus colores, a toda hoja o en oscuro."
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
          titulo="Todas las plantillas"
          bajada={`Con tus ${productos.length} ${productos.length === 1 ? "producto" : "productos"}.`}
        >
          <GaleriaDePlantillas
            productos={productos}
            datos={datos}
            estilo={catalogo?.estilo ?? estiloDeTienda}
            nombre={catalogo?.nombre ?? nombreDelMes()}
            packs={catalogo?.packs}
            actual={catalogo?.plantilla}
            claves={plantillas}
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
      funciones={funciones}
      guardado={guardado}
      sinGuardar={sinGuardar}
      alCambiar={cambiar}
      alGuardar={(resultado) => {
        setGuardado(resultado)
        setSinGuardar(false)
      }}
      alCambiarPlantilla={() => setFase("plantilla")}
      puedeDeshacer={Boolean(historial.pasado.at(-1))}
      puedeRehacer={Boolean(historial.futuro[0])}
      alDeshacer={deshacer}
      alRehacer={rehacer}
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
  funciones,
  guardado,
  sinGuardar,
  alCambiar,
  alGuardar,
  alCambiarPlantilla,
  puedeDeshacer,
  puedeRehacer,
  alDeshacer,
  alRehacer,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  estiloDeTienda: Estilo
  sugeridos: EstiloSugerido[]
  esDemo: boolean
  canva: ModoDeCanva
  avisoDeCanva: string | null
  funciones: FuncionesDelCatalogo
  guardado: { id: string; enlace: string } | null
  sinGuardar: boolean
  alCambiar: (catalogo: Catalogo) => void
  alGuardar: (guardado: { id: string; enlace: string }) => void
  alCambiarPlantilla: () => void
  puedeDeshacer: boolean
  puedeRehacer: boolean
  alDeshacer: () => void
  alRehacer: () => void
}) {
  const router = useRouter()
  const { preguntar, dialogo } = useConfirmacion()
  const [panel, setPanel] = React.useState<Panel>("hojas")
  const [elegido, setElegido] = React.useState<string | null>(null)
  const [nivel, setNivel] = React.useState<NivelDelPanel>(1)
  // Al elegir una hoja desde el panel, la vista previa la trae a la pantalla.
  const [pedidoDeVista, setPedidoDeVista] = React.useState(0)

  // En el celular las pestañas se deslizan: la elegida se trae a la vista.
  React.useEffect(() => {
    document
      .getElementById(`pestana-${panel}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [panel])

  // "Listo" no tiene pestaña en una pantalla ancha: lo suyo va en la
  // cabecera. Si la pantalla se ensancha con "Listo" abierto, vuelve a Hojas.
  React.useEffect(() => {
    const ancha = window.matchMedia("(min-width: 1024px)")
    const revisar = () => {
      if (ancha.matches)
        setPanel((antes) => (antes === "listo" ? "hojas" : antes))
    }
    revisar()
    ancha.addEventListener("change", revisar)
    return () => ancha.removeEventListener("change", revisar)
  }, [])
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
      // Sin navegar, la pestaña seguía diciendo "Nuevo catálogo". Es el mismo
      // título que pone la página de un catálogo guardado.
      document.title = "Editar catálogo · Venduo"
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

  /** Tocar una hoja la abre en el panel, como en la app. */
  function elegirHoja(id: string) {
    setElegido(id)
    setPanel("hojas")
    setNivel((antes) => (antes === 0 ? 1 : antes))
  }

  function abrirPanel(clave: Panel) {
    setPanel(clave)
    if (clave !== "hojas") setElegido(null)
    setNivel((antes) => (antes === 0 ? 1 : antes))
  }

  /** Salir con cambios sin guardar pregunta antes, como en la app. */
  const salir = React.useCallback(async () => {
    if (sinGuardar && !esDemo) {
      const si = await preguntar({
        titulo: "¿Salir sin guardar?",
        texto: "Lo que armaste se pierde.",
        confirmar: "Salir sin guardar",
      })
      if (!si) return
    }
    router.push("/panel/catalogos")
  }, [sinGuardar, esDemo, preguntar, router])

  async function borrar() {
    if (!guardado) return
    const si = await preguntar({
      titulo: "¿Borrar este catálogo?",
      texto: "Su enlace dejará de funcionar.",
      confirmar: "Borrar",
    })
    if (!si) return
    const resultado = await borrarCatalogo(guardado.id)
    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos borrar el catálogo.")
      return
    }
    toast.success("Catálogo borrado.")
    router.push("/panel/catalogos")
  }

  const estado = esDemo
    ? "Modo demo: no se guarda"
    : sinGuardar
      ? "Cambios sin guardar"
      : guardado
        ? "Guardado"
        : "Sin guardar"

  const barra = (
    <>
      <BotonDeLaBarra
        etiqueta="Deshacer"
        apagado={!puedeDeshacer}
        alTocar={alDeshacer}
      >
        <Undo2 aria-hidden="true" className="size-5" />
      </BotonDeLaBarra>
      <BotonDeLaBarra
        etiqueta="Rehacer"
        apagado={!puedeRehacer}
        alTocar={alRehacer}
      >
        <Redo2 aria-hidden="true" className="size-5" />
      </BotonDeLaBarra>
      <button
        type="button"
        onClick={() => abrirPanel("listo")}
        className={cn(
          "ml-1 flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-opacity active:opacity-70",
          sinGuardar || !guardado
            ? "bg-senal text-white"
            : "border border-tinta/25"
        )}
      >
        {sinGuardar || !guardado ? null : (
          <Check aria-hidden="true" className="size-4" />
        )}
        {sinGuardar || !guardado ? "Guardar" : "Guardado"}
      </button>
    </>
  )

  return (
    <div className="flex flex-col gap-5 max-lg:-mx-4 max-lg:-mt-4 max-lg:pb-[var(--alto-del-panel)] sm:max-lg:-mx-5">
      {dialogo}
      <TituloDeLaBarra
        titulo={catalogo.nombre || "Tu catálogo"}
        volver="/panel/catalogos"
        alVolver={salir}
        acciones={barra}
        cerrar
      />
      <div className="max-lg:hidden">
        <Volver />
      </div>

      <header className="flex flex-col gap-4 border-b border-tinta pb-5 max-lg:hidden">
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

          {/* En el celular, dos por fila y del mismo ancho: con flex cada uno
              medía su texto y las dos filas no se alineaban. */}
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            {esDemo ? null : (
              <button
                type="button"
                onClick={guardar}
                disabled={ocupado !== null || bloqueado}
                className={cn(
                  BOTON_SECUNDARIO,
                  "min-h-11 px-3 text-sm whitespace-nowrap sm:px-4"
                )}
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
            <ConFuncion estado={funciones.canva}>
              <BotonDeCanva
                catalogo={catalogo}
                modo={canva}
                aviso={avisoDeCanva}
                guardado={guardado}
                sinGuardar={sinGuardar}
                deshabilitado={ocupado !== null || bloqueado}
                alGuardar={alGuardar}
              />
            </ConFuncion>
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={ocupado !== null || bloqueado}
                className={cn(
                  BOTON_SECUNDARIO,
                  "min-h-11 px-3 text-sm whitespace-nowrap sm:px-4"
                )}
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
                {funciones.compartir !== "oculta" ? (
                  <>
                    <DropdownMenuItem
                      disabled={!guardado || sinGuardar}
                      className={cn(
                        funciones.compartir === "desactivada" && "opacity-55"
                      )}
                      onSelect={() => {
                        if (!guardado) return
                        if (funciones.compartir !== "activa") {
                          toast.info(AVISO_DE_NO_DISPONIBLE)
                          return
                        }
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
                      className={cn(
                        funciones.compartir === "desactivada" && "opacity-55"
                      )}
                      onSelect={async () => {
                        if (!guardado) return
                        if (funciones.compartir !== "activa") {
                          toast.info(AVISO_DE_NO_DISPONIBLE)
                          return
                        }
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
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={bajarPdf}
              disabled={ocupado !== null || bloqueado}
              className={cn(
                BOTON_PRIMARIO,
                "min-h-11 px-3 text-sm whitespace-nowrap sm:px-4",
                // Sin "Guardar" en demo, o sin Canva: quedan tres y el PDF
                // ocupa la fila. Sin los dos, quedan dos y cada uno su mitad.
                esDemo !== (funciones.canva === "oculta") && "col-span-2"
              )}
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
        <PanelDeslizable
          nivel={nivel}
          alCambiarNivel={setNivel}
          cabecera={
            <div
              role="tablist"
              aria-label="Qué editar"
              className="flex shrink-0 border-b border-tinta max-lg:[scrollbar-width:none] max-lg:gap-1 max-lg:overflow-x-auto max-lg:border-b-0 max-lg:px-4 max-lg:pb-3 max-lg:[&::-webkit-scrollbar]:hidden"
            >
              {PANELES.filter(
                ({ clave }) => clave !== "ia" || funciones.ia !== "oculta"
              ).map(({ clave, nombre, icono: Icono }) => (
                <button
                  key={clave}
                  type="button"
                  role="tab"
                  id={`pestana-${clave}`}
                  aria-selected={panel === clave}
                  aria-controls={`panel-${clave}`}
                  onClick={() => abrirPanel(clave)}
                  // En el celular, una fila que se desliza con ícono y nombre,
                  // como en la app; en una pantalla ancha, cinco del mismo ancho.
                  className={cn(
                    "flex min-h-11 shrink-0 items-center justify-center gap-2 px-3.5 text-[15px] font-semibold whitespace-nowrap transition-colors lg:min-h-12 lg:min-w-0 lg:flex-1 lg:border-l lg:border-tinta/15 lg:px-0 lg:text-sm lg:first:border-l-0",
                    clave === "listo" && "lg:hidden",
                    panel === clave
                      ? "bg-tinta text-papel"
                      : "hover:bg-tinta/[0.05]"
                  )}
                >
                  <Icono aria-hidden="true" className="size-[18px] lg:hidden" />
                  {nombre}
                  {clave === "listo" && sinGuardar && !esDemo ? (
                    <span
                      aria-label="Sin guardar"
                      className="size-2 rounded-full bg-senal"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          }
        >
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
                alElegir={(id) => {
                  setElegido(id)
                  if (id) setPedidoDeVista((pedido) => pedido + 1)
                }}
                alCambiar={alCambiar}
                alIrA={abrirPanel}
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
            ) : panel === "estilo" ? (
              <PanelDeEstilo
                catalogo={catalogo}
                estiloDeTienda={estiloDeTienda}
                sugeridos={sugeridos}
                alCambiar={alCambiar}
                alCambiarPlantilla={alCambiarPlantilla}
              />
            ) : panel === "ia" ? (
              <PanelDeIa
                catalogo={catalogo}
                ia={funciones.ia}
                alCambiar={alCambiar}
              />
            ) : (
              <PanelListo
                catalogo={catalogo}
                problemas={problemas}
                esDemo={esDemo}
                guardado={guardado}
                sinGuardar={sinGuardar}
                bloqueado={bloqueado}
                ocupado={ocupado}
                compartible={compartible}
                funciones={funciones}
                tienda={datos.tienda.nombre}
                canva={
                  <ConFuncion estado={funciones.canva} className="flex">
                    <BotonDeCanva
                      catalogo={catalogo}
                      modo={canva}
                      aviso={avisoDeCanva}
                      guardado={guardado}
                      sinGuardar={sinGuardar}
                      deshabilitado={ocupado !== null || bloqueado}
                      alGuardar={alGuardar}
                    />
                  </ConFuncion>
                }
                alCambiarNombre={(nombre) => alCambiar({ ...catalogo, nombre })}
                alGuardar={guardar}
                alCompartirPdf={compartible ? compartirPdf : bajarPdf}
                alBorrar={borrar}
              />
            )}
          </div>
        </PanelDeslizable>

        <section
          aria-label="Vista previa"
          className="flex min-w-0 flex-col lg:sticky lg:top-6 lg:border lg:border-tinta"
        >
          <header className="flex items-center justify-between gap-3 border-b border-tinta/15 px-4 py-3 max-lg:hidden sm:px-5">
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
    </div>
  )
}

/** Un botón de ícono en la barra de arriba del celular: deshacer, rehacer. */
function BotonDeLaBarra({
  etiqueta,
  apagado,
  alTocar,
  children,
}: {
  etiqueta: string
  apagado: boolean
  alTocar: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      disabled={apagado}
      onClick={alTocar}
      className="flex size-11 items-center justify-center transition-opacity active:opacity-60 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/**
 * La pestaña "Listo" del celular, la misma de la app: el nombre, guardar y
 * mandarlo. En una pantalla ancha todo esto va en la cabecera del editor.
 */
function PanelListo({
  catalogo,
  problemas,
  esDemo,
  guardado,
  sinGuardar,
  bloqueado,
  ocupado,
  compartible,
  funciones,
  tienda,
  canva,
  alCambiarNombre,
  alGuardar,
  alCompartirPdf,
  alBorrar,
}: {
  catalogo: Catalogo
  problemas: string[]
  esDemo: boolean
  guardado: { id: string; enlace: string } | null
  sinGuardar: boolean
  bloqueado: boolean
  ocupado: null | "guardar" | "descargar" | "compartir"
  compartible: boolean
  funciones: FuncionesDelCatalogo
  tienda: string
  canva: React.ReactNode
  alCambiarNombre: (nombre: string) => void
  alGuardar: () => void
  alCompartirPdf: () => void
  alBorrar: () => void
}) {
  const listo = Boolean(guardado) && !sinGuardar
  const conEnlace = funciones.compartir === "activa"

  return (
    <div className="flex flex-col gap-6 px-4 py-5 sm:px-5">
      <label className="flex flex-col gap-1">
        <span className={ETIQUETA_CAMPO}>Nombre del catálogo</span>
        <input
          value={catalogo.nombre}
          maxLength={80}
          onChange={(evento) => alCambiarNombre(evento.target.value)}
          className={CAMPO_LINEA}
        />
      </label>

      {problemas.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {problemas.map((problema) => (
            <Aviso key={problema} tono="problema">
              {problema}
            </Aviso>
          ))}
        </div>
      ) : null}

      {esDemo ? (
        <p className="text-sm opacity-70">
          En modo demo no se guarda: baja el PDF y compártelo.
        </p>
      ) : (
        <button
          type="button"
          onClick={alGuardar}
          disabled={ocupado !== null || bloqueado || listo}
          className={cn(listo ? BOTON_SECUNDARIO : BOTON_PRIMARIO, "w-full")}
        >
          {ocupado === "guardar" ? (
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          ) : listo ? (
            <Check aria-hidden="true" className="size-5" />
          ) : (
            <Save aria-hidden="true" className="size-5" />
          )}
          {guardado
            ? sinGuardar
              ? "Guardar los cambios"
              : "Guardado"
            : "Guardar"}
        </button>
      )}

      {/* El enlace abre lo guardado, no lo que está en pantalla: para mandarlo
          hay que guardar. El PDF en modo demo sí sale, con lo de pantalla. */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
          Enviar
        </p>
        <div className="grid grid-cols-2 gap-2">
          {conEnlace ? (
            <AccionDeListo
              titulo="Enlace"
              nota="Por WhatsApp"
              icono={Send}
              apagado={!listo}
              alTocar={() =>
                guardado &&
                window.open(
                  enlaceDeWhatsApp(
                    `${catalogo.nombre} · ${tienda}\n${guardado.enlace}`
                  ),
                  "_blank",
                  "noopener"
                )
              }
            />
          ) : null}
          <AccionDeListo
            titulo={
              ocupado === "compartir" || ocupado === "descargar"
                ? "Armando…"
                : "PDF"
            }
            nota={compartible ? "Con precios de hoy" : "Se descarga"}
            icono={compartible ? Share2 : FileDown}
            apagado={(!listo && !esDemo) || bloqueado || ocupado !== null}
            alTocar={alCompartirPdf}
          />
          {conEnlace ? (
            <AccionDeListo
              titulo="Verlo"
              nota="Como lo ven"
              icono={Eye}
              apagado={!listo}
              alTocar={() =>
                guardado && window.open(guardado.enlace, "_blank", "noopener")
              }
            />
          ) : null}
        </div>
        {funciones.canva !== "oculta" ? canva : null}
        {!listo && !esDemo ? (
          <p className="text-sm opacity-70">Guárdalo para mandarlo.</p>
        ) : null}
      </div>

      {guardado ? (
        <button
          type="button"
          onClick={alBorrar}
          className="mx-auto flex min-h-11 items-center gap-2 text-sm font-semibold text-senal"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Borrar el catálogo
        </button>
      ) : null}
    </div>
  )
}

function AccionDeListo({
  titulo,
  nota,
  icono: Icono,
  apagado,
  alTocar,
}: {
  titulo: string
  nota: string
  icono: LucideIcon
  apagado: boolean
  alTocar: () => void
}) {
  return (
    <button
      type="button"
      disabled={apagado}
      onClick={alTocar}
      className="flex min-h-16 items-center gap-3 border border-tinta px-3 py-2 text-left transition-colors hover:bg-tinta/[0.04] disabled:opacity-40"
    >
      <Icono aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="block text-xs opacity-70">{nota}</span>
      </span>
    </button>
  )
}
