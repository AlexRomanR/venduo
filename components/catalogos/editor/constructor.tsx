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
  History,
  Layers,
  MoreHorizontal,
  LayoutTemplate,
  LoaderCircle,
  Package,
  Palette,
  Redo2,
  Save,
  Send,
  Share2,
  ShoppingBag,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  CLAVES_PLANTILLA,
  type ClavePlantilla,
} from "@/lib/catalogos/constantes"
import {
  elegidos,
  hojasDe,
  type DatosDelCatalogo,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import { problemasDeEstilo } from "@/lib/catalogos/estilo"
import {
  catalogoSchema,
  type Catalogo,
  type Estilo,
} from "@/lib/catalogos/modelo"
import { conservarEdicion, faltantes } from "@/lib/catalogos/operaciones"
import {
  armarCatalogo,
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
import { formatDate } from "@/lib/format"
import { AVISO_DE_NO_DISPONIBLE, type EstadoDeFuncion } from "@/lib/funciones"
import { cn } from "@/lib/utils"
import { useConfirmacion } from "@/components/panel/confirmar"
import { ConFuncion } from "@/components/panel/funcion"
import { CerrarAviso, ContenidoDeAviso } from "@/components/panel/aviso"
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Contador } from "@/components/panel/contador"
import { Cabecera } from "@/components/panel/piezas"
import { Recien } from "@/components/panel/recien"
import { TituloDeLaBarra } from "@/components/panel/titulo-de-barra"
import { ElegirCadaUno } from "@/components/editor/marca"
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
  AsiVaQuedando,
  AsiVaQuedandoEnLaBarra,
} from "@/components/catalogos/editor/asi-va-quedando"
import { PanelDeHojas } from "@/components/catalogos/editor/hojas"
import { PanelDePacks } from "@/components/catalogos/editor/packs"
import {
  altoDe as altoDelPanel,
  PanelDeslizable,
  type NivelDelPanel,
} from "@/components/catalogos/editor/panel-deslizable"
import {
  armarPropuesta,
  DetalleDePropuesta,
  PanelDeProductos,
} from "@/components/catalogos/editor/productos"
import { BarraDeIa, TarjetaDePropuesta } from "@/components/catalogos/editor/ia"
import { Probador } from "@/components/catalogos/editor/probador"
import { SelectorConFotos } from "@/components/catalogos/editor/selector"
import { VistaPrevia } from "@/components/catalogos/editor/vista-previa"
import { volarAlCatalogo } from "@/components/catalogos/editor/vuelo"
import {
  borrarCatalogo,
  guardarCatalogo,
  pedirCatalogoALaIa,
} from "@/app/(privado)/panel/catalogos/acciones"
import type { PropuestaDeCatalogo } from "@/lib/ai/schemas"
import { MENSAJE_SIN_RESPUESTA } from "@/lib/ai/mensajes"

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
type Panel = "hojas" | "productos" | "packs" | "estilo" | "listo"

interface Pestana {
  clave: Panel
  nombre: string
  icono: LucideIcon
}

/** Lo que se edita. Se desliza en el celular. */
const PANELES: Pestana[] = [
  { clave: "estilo", nombre: "Marca", icono: Palette },
  { clave: "hojas", nombre: "Hojas", icono: Layers },
  { clave: "productos", nombre: "Elegidos", icono: ShoppingBag },
  { clave: "packs", nombre: "Combos", icono: Package },
]

/**
 * Nombre, guardar y mandar, del celular: queda fija al lado de las demás, porque
 * mandar el catálogo es para lo que se arma. En una pantalla ancha va en la
 * cabecera.
 */
const ENVIAR: Pestana = { clave: "listo", nombre: "Enviar", icono: Send }

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
  combos: EstadoDeFuncion
}

const TODO_ACTIVO: FuncionesDelCatalogo = {
  ia: "activa",
  canva: "activa",
  compartir: "activa",
  combos: "activa",
}

/**
 * En la vista previa, cada combo lleva "Pedir este combo" como va a salir en
 * el PDF. Ahí no se toca, así que basta una dirección de muestra: la de verdad
 * la pone el servidor al armar el PDF del catálogo guardado.
 */
function conElBotonDeCombo(
  datos: DatosDelCatalogo,
  combos: EstadoDeFuncion
): DatosDelCatalogo {
  return combos === "activa" && !datos.combos
    ? { ...datos, combos: "#{combo}" }
    : datos
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
  datos: datosDeLaTienda,
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
  const datos = React.useMemo(
    () => conElBotonDeCombo(datosDeLaTienda, funciones.combos),
    [datosDeLaTienda, funciones.combos]
  )
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

  // Salir con cambios sin guardar pregunta antes, se salga como se salga. En
  // modo demo no hay qué perder: no se guarda nunca.
  const protegido = sinGuardar && !esDemo
  const { preguntar, dialogo: dialogoDePregunta } = useConfirmacion()
  // A dónde se quería ir, mientras se decide qué hacer con lo no guardado.
  const [salida, setSalida] = React.useState<string | null>(null)
  const [guardandoAlSalir, setGuardandoAlSalir] = React.useState(false)
  const saliendo = React.useRef(false)
  const [porRecuperar, setPorRecuperar] = React.useState<{
    catalogo: Catalogo
    fecha: number
  } | null>(null)

  // El borrador queda en este dispositivo: si el navegador descarta la página
  // mientras se consulta algo en WhatsApp, lo armado no se pierde.
  const claveDeBorrador = React.useCallback(
    (id: string) => `venduo:catalogo:${datos.tienda.enlace}:${id}`,
    [datos.tienda.enlace]
  )
  const idDelBorrador = guardado?.id ?? "nuevo"
  const olvidarBorrador = React.useCallback(() => {
    try {
      for (const clave of [idDelBorrador, "nuevo"].map(claveDeBorrador)) {
        window.localStorage.removeItem(clave)
        window.sessionStorage.removeItem(clave)
      }
    } catch {
      // Sin almacenamiento no hay borrador que borrar.
    }
  }, [claveDeBorrador, idDelBorrador])

  React.useEffect(() => {
    if (!protegido || !catalogo) return
    try {
      window.sessionStorage.setItem(claveDeBorrador(idDelBorrador), "1")
      window.localStorage.setItem(
        claveDeBorrador(idDelBorrador),
        JSON.stringify({ catalogo, fecha: Date.now() })
      )
    } catch {
      // Sin almacenamiento, el borrador dura lo que dure la pestaña.
    }
  }, [protegido, catalogo, claveDeBorrador, idDelBorrador])

  React.useEffect(() => {
    if (esDemo) return
    try {
      const clave = claveDeBorrador(inicial?.id ?? "nuevo")
      const crudo = window.localStorage.getItem(clave)
      if (!crudo) return
      const guardadoAca = JSON.parse(crudo) as {
        catalogo?: unknown
        fecha?: number
      }
      const leido = catalogoSchema.safeParse(guardadoAca.catalogo)
      if (
        !leido.success ||
        JSON.stringify(leido.data) === JSON.stringify(inicial?.catalogo)
      ) {
        window.localStorage.removeItem(clave)
        return
      }
      // Se recargó en esta misma visita: se sigue sin preguntar.
      if (window.sessionStorage.getItem(clave)) {
        setHistorial({ presente: leido.data, pasado: [], futuro: [] })
        setSinGuardar(true)
        setFase("editar")
        return
      }
      setPorRecuperar({
        catalogo: leido.data,
        fecha: guardadoAca.fecha ?? Date.now(),
      })
    } catch {
      // Almacenamiento bloqueado o dañado: se empieza de lo guardado.
    }
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const salirA = React.useCallback(
    (destino: string) => {
      if (protegido) {
        setSalida(destino)
        return
      }
      saliendo.current = true
      router.push(destino)
    },
    [protegido, router]
  )

  function dejarElEditor(destino: string) {
    olvidarBorrador()
    saliendo.current = true
    setSalida(null)
    router.push(destino)
  }

  async function guardarYSalir(destino: string) {
    if (!catalogo) return
    setGuardandoAlSalir(true)
    const resultado = await guardarCatalogo(
      guardado?.id ?? null,
      catalogo
    ).catch(() => null)
    setGuardandoAlSalir(false)
    if (!resultado?.ok) {
      toast.error(resultado?.error ?? "No pudimos guardar el catálogo.")
      return
    }
    toast.success("Catálogo guardado.")
    dejarElEditor(destino)
  }

  React.useEffect(() => {
    if (!protegido) return
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()

    // Cualquier enlace de la pantalla, también los de la barra lateral.
    function alTocar(evento: MouseEvent) {
      if (
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey
      ) {
        return
      }
      const enlace = (evento.target as Element).closest?.("a[href]")
      if (!(enlace instanceof HTMLAnchorElement) || enlace.target) return
      const url = new URL(enlace.href)
      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname
      ) {
        return
      }
      evento.preventDefault()
      evento.stopPropagation()
      salirA(url.pathname + url.search)
    }

    // Atrás: una entrada de más en el historial para poder preguntar antes.
    const marcar = () =>
      window.history.pushState(
        { ...window.history.state, guardaDelCatalogo: true },
        ""
      )
    function alVolver() {
      marcar()
      salirA("/panel/catalogos")
    }

    marcar()
    window.addEventListener("beforeunload", avisar)
    document.addEventListener("click", alTocar, true)
    window.addEventListener("popstate", alVolver)
    return () => {
      window.removeEventListener("beforeunload", avisar)
      document.removeEventListener("click", alTocar, true)
      window.removeEventListener("popstate", alVolver)
      if (!saliendo.current && window.history.state?.guardaDelCatalogo) {
        window.history.back()
      }
    }
  }, [protegido, salirA])

  // Cambiar de plantilla conserva lo editado. La plantilla actual, armada de
  // nuevo, dice qué es propio y qué vino con ella.
  const edicion = React.useMemo(() => {
    if (!catalogo) return null
    const base = armarCatalogo({
      plantilla: catalogo.plantilla,
      nombre: catalogo.nombre,
      productos: elegidos(catalogo, datos),
      tienda: { nombre: datos.tienda.nombre, whatsapp: datos.tienda.whatsapp },
      estilo: catalogo.estilo,
      packs: catalogo.packs,
    })
    return {
      ajustar: (nuevo: Catalogo) =>
        conservarEdicion(catalogo, base, nuevo).catalogo,
      conservados: conservarEdicion(catalogo, base, catalogo).conservados,
    }
  }, [catalogo, datos])

  const elegida = empezarCon ? nombreDeEleccion(empezarCon, sugeridos) : null

  // Mientras se eligen los productos, el catálogo se arma con la plantilla que
  // se tocó en la lista o, si no se tocó ninguna, con la primera de la tienda.
  // Es provisoria: en el paso siguiente se prueba y se elige.
  const provisoria = React.useMemo<EleccionDePlantilla | null>(() => {
    if (empezarCon) return empezarCon
    if (sugeridos[0]) return { tipo: "estilo", clave: sugeridos[0].clave }
    return plantillas[0] ? { tipo: "plantilla", clave: plantillas[0] } : null
  }, [empezarCon, sugeridos, plantillas])
  const nombreProvisorio = provisoria
    ? nombreDeEleccion(provisoria, sugeridos)
    : null
  const seleccionDiferida = React.useDeferredValue(seleccion)
  const borrador = React.useMemo(
    () =>
      provisoria && seleccionDiferida.length > 0
        ? armarConEleccion(
            provisoria,
            {
              nombre: nombreDelMes(),
              productos: productosDe(seleccionDiferida),
              tienda: {
                nombre: datos.tienda.nombre,
                whatsapp: datos.tienda.whatsapp,
              },
              estilo: estiloDeTienda,
            },
            sugeridos
          )
        : null,
    [
      provisoria,
      seleccionDiferida,
      productosDe,
      datos,
      estiloDeTienda,
      sugeridos,
    ]
  )

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

  const impideGuardar = catalogo
    ? ([...faltantes(catalogo), ...problemasDeEstilo(catalogo.estilo)][0] ??
      (hojasDe(catalogo, datos).length === 0
        ? "El catálogo todavía no tiene hojas."
        : null))
    : null

  const dialogoDeSalida = (
    <>
      {dialogoDePregunta}
      <AlertDialog
        open={salida !== null}
        onOpenChange={(abierto) => {
          if (!abierto && !guardandoAlSalir) setSalida(null)
        }}
      >
        <ContenidoDeAviso>
          <div className="p-5 sm:p-6">
            <AlertDialogTitle className="font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
              Tienes cambios sin guardar
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3 text-sm leading-relaxed text-tinta/70">
              {impideGuardar
                ? `Todavía no se puede guardar: ${impideGuardar}`
                : "Guárdalos para encontrarlos cuando vuelvas."}
            </AlertDialogDescription>
          </div>
          <div className="flex flex-col gap-3 border-t border-tinta/15 p-5 sm:p-6">
            {impideGuardar ? null : (
              <button
                type="button"
                disabled={guardandoAlSalir}
                onClick={() => salida && void guardarYSalir(salida)}
                className={BOTON_PRIMARIO}
              >
                {guardandoAlSalir ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                Guardar y salir
              </button>
            )}
            <CerrarAviso
              disabled={guardandoAlSalir}
              className={impideGuardar ? BOTON_PRIMARIO : BOTON_SECUNDARIO}
            >
              Seguir editando
            </CerrarAviso>
            <button
              type="button"
              disabled={guardandoAlSalir}
              onClick={() => salida && dejarElEditor(salida)}
              className="min-h-11 text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-60 disabled:opacity-50"
            >
              Salir sin guardar
            </button>
          </div>
        </ContenidoDeAviso>
      </AlertDialog>
    </>
  )

  if (porRecuperar) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-6">
        {dialogoDeSalida}
        <TituloDeLaBarra titulo="Catálogo" volver="/panel/catalogos" cerrar />
        <History aria-hidden="true" className="size-6" />
        <div>
          <h1 className="font-titular text-2xl leading-tight font-extrabold tracking-[-0.02em]">
            Tienes un catálogo sin guardar
          </h1>
          <p className="mt-1 text-sm leading-relaxed opacity-70">
            «{porRecuperar.catalogo.nombre}», del{" "}
            {formatDate(new Date(porRecuperar.fecha))}. Quedó en este
            dispositivo. ¿Sigues donde te quedaste?
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setHistorial({
              presente: porRecuperar.catalogo,
              pasado: [],
              futuro: [],
            })
            setSinGuardar(true)
            setFase("editar")
            setPorRecuperar(null)
          }}
          className={BOTON_PRIMARIO}
        >
          Recuperarlo
        </button>
        <button
          type="button"
          onClick={async () => {
            const si = await preguntar({
              titulo: "¿Descartar este catálogo?",
              texto: "Lo que no guardaste no se puede recuperar.",
              confirmar: "Descartarlo",
            })
            if (!si) return
            try {
              window.localStorage.removeItem(
                claveDeBorrador(inicial?.id ?? "nuevo")
              )
            } catch {
              // Sin almacenamiento no hay borrador que borrar.
            }
            setPorRecuperar(null)
          }}
          className={BOTON_SECUNDARIO}
        >
          Descartarlo
        </button>
      </div>
    )
  }

  if (fase === "contenido") {
    return (
      <div className="flex flex-col gap-6 max-lg:pb-28 md:gap-8">
        {dialogoDeSalida}
        {/* En el celular es el paso de la app: "Tus productos" arriba, con
            la X para salir, y el botón fijo abajo. */}
        <h1 className="sr-only lg:hidden">Nuevo catálogo</h1>
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
            resaltar="catálogo"
            bajada={
              elegida
                ? `Con la plantilla ${elegida}. Elige los productos en el orden en que van.`
                : "Elige los productos en el orden en que van."
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <SelectorConFotos
            productos={Object.values(datos.productos)}
            categorias={datos.categorias}
            elegidos={seleccion}
            alCambiar={setSeleccion}
            alMarcar={volarAlCatalogo}
          />
          <div className="max-lg:hidden">
            <AsiVaQuedando
              borrador={borrador}
              datos={datos}
              plantilla={nombreProvisorio}
            />
          </div>
        </div>
        <div className="pieza-bandeja bandeja-al-borde fixed inset-x-0 bottom-0 z-20 border-t border-tinta bg-papel px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:sticky lg:-mx-10 lg:border-tinta/15 lg:px-10">
          <div className="flex items-center gap-3 lg:justify-center">
            <div className="lg:hidden">
              <AsiVaQuedandoEnLaBarra
                borrador={borrador}
                datos={datos}
                plantilla={nombreProvisorio}
              />
            </div>
            <button
              type="button"
              disabled={seleccion.length === 0}
              onClick={seguir}
              className={cn(
                BOTON_PRIMARIO,
                "min-w-0 flex-1 lg:w-full lg:max-w-md lg:flex-none"
              )}
            >
              <LayoutTemplate aria-hidden="true" className="size-5 shrink-0" />
              {seleccion.length === 0 ? (
                "Elige los productos"
              ) : (
                <span className="truncate">
                  {elegida ? "Armar el catálogo" : "Elegir la plantilla"} ·{" "}
                  <Contador valor={seleccion.length} />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (fase === "plantilla") {
    const productos = catalogo
      ? elegidos(catalogo, datos)
      : productosDe(seleccion)
    const volver = () => setFase(catalogo ? "editar" : "contenido")
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        {dialogoDeSalida}
        <h1 className="sr-only lg:hidden">Elige la plantilla</h1>
        <TituloDeLaBarra
          titulo="Elige la plantilla"
          volver="/panel/catalogos"
          alVolver={volver}
        />
        <div className="flex flex-col gap-6 max-lg:hidden md:gap-8">
          <button
            type="button"
            onClick={volver}
            className="group inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {catalogo ? "Volver al catálogo" : "Volver a los productos"}
          </button>
          <Cabecera
            titulo="Elige la plantilla."
            bajada={
              catalogo
                ? "Cambia el diseño de las hojas. Tus productos, combos, colores y textos se quedan."
                : `Con tus ${productos.length} ${productos.length === 1 ? "producto" : "productos"} y los colores de tu tienda.`
            }
          />
        </div>
        <Probador
          sugeridos={sugeridos}
          claves={plantillas}
          productos={productos}
          datos={datos}
          estilo={catalogo?.estilo ?? estiloDeTienda}
          nombre={catalogo?.nombre ?? nombreDelMes()}
          packs={catalogo?.packs}
          actual={catalogo?.plantilla}
          ajustar={edicion?.ajustar}
          alUsar={(nuevo) => {
            const habiaCatalogo = Boolean(catalogo)
            cambiar(nuevo)
            setFase("editar")
            if (habiaCatalogo) {
              toast("Cambiaste la plantilla", {
                description: edicion?.conservados
                  ? "Tus textos y las hojas que agregaste siguen ahí."
                  : "Tus productos, combos y colores siguen ahí.",
                action: { label: "Deshacer", onClick: deshacer },
              })
            }
          }}
          alVolver={() => setFase("editar")}
        />
      </div>
    )
  }

  if (!catalogo) return null

  return (
    <>
      {dialogoDeSalida}
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
          olvidarBorrador()
          setGuardado(resultado)
          setSinGuardar(false)
        }}
        alCambiarPlantilla={() => setFase("plantilla")}
        alSalir={() => salirA("/panel/catalogos")}
        alBorrar={() => {
          olvidarBorrador()
          saliendo.current = true
          router.push("/panel/catalogos")
        }}
        puedeDeshacer={Boolean(historial.pasado.at(-1))}
        puedeRehacer={Boolean(historial.futuro[0])}
        alDeshacer={deshacer}
        alRehacer={rehacer}
      />
    </>
  )
}

function Volver() {
  return (
    <Link
      href="/panel/catalogos"
      className="group inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-4 transition-transform duration-300 motion-safe:group-hover:-translate-x-1"
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
  alSalir,
  alBorrar,
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
  alSalir: () => void
  alBorrar: () => void
  puedeDeshacer: boolean
  puedeRehacer: boolean
  alDeshacer: () => void
  alRehacer: () => void
}) {
  const { preguntar, dialogo } = useConfirmacion()
  const [panel, setPanel] = React.useState<Panel>("hojas")
  // La propuesta de la IA, para verla antes de aplicarla.
  const [mirando, setMirando] = React.useState<Catalogo | null>(null)
  // Con la propuesta abierta: mirar cómo estaba antes de decidir.
  const [mirandoAntes, setMirandoAntes] = React.useState(false)
  // La IA, como en el editor de la tienda: una barra fija y su propuesta en
  // todo el panel hasta decidir.
  const [pedidoIa, setPedidoIa] = React.useState("")
  const [pidiendoIa, setPidiendoIa] = React.useState(false)
  const [propuestaIa, setPropuestaIa] =
    React.useState<PropuestaDeCatalogo | null>(null)
  const [pantalla, setPantalla] = React.useState<{
    alto: number
    celular: boolean
  } | null>(null)

  React.useEffect(() => {
    const medir = () =>
      setPantalla({
        alto: window.innerHeight,
        celular: !window.matchMedia("(min-width: 1024px)").matches,
      })
    medir()
    window.addEventListener("resize", medir)
    return () => window.removeEventListener("resize", medir)
  }, [])

  React.useEffect(() => {
    if (!mirando) toast.dismiss("propuesta-del-catalogo")
  }, [mirando])

  /** Con una propuesta abierta no se cambia de lugar: se perdería. */
  function hayQueDecidir() {
    if (!mirando) return false
    toast("Primero decide sobre la propuesta de la IA", {
      id: "propuesta-del-catalogo",
      description: "Aplícala o descártala para seguir editando.",
    })
    return true
  }
  const [elegido, setElegido] = React.useState<string | null>(null)
  const [nivel, setNivel] = React.useState<NivelDelPanel>(1)
  // Al elegir una hoja desde el panel, la vista previa la trae a la pantalla.
  const [pedidoDeVista, setPedidoDeVista] = React.useState(0)

  // Deshacer y rehacer con el teclado, salvo dentro de un campo de texto.
  React.useEffect(() => {
    function tecla(evento: KeyboardEvent) {
      const objetivo = evento.target as HTMLElement | null
      if (objetivo?.closest("input, textarea, select, [contenteditable]")) {
        return
      }
      if (!(evento.metaKey || evento.ctrlKey)) return
      const letra = evento.key.toLowerCase()
      if (letra === "z" && !evento.shiftKey) {
        evento.preventDefault()
        alDeshacer()
      } else if ((letra === "z" && evento.shiftKey) || letra === "y") {
        evento.preventDefault()
        alRehacer()
      }
    }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [alDeshacer, alRehacer])

  // Para lo que llega desde los paneles: el catálogo de este momento.
  const actual = React.useRef(catalogo)
  const conPropuesta = React.useRef(false)
  // Antes que los efectos de los paneles, que lo leen al abrir un combo nuevo.
  React.useLayoutEffect(() => {
    actual.current = catalogo
  })

  // Un combo sin precio se arregla en su combo, no donde se descubre.
  const [comboPorAbrir, setComboPorAbrir] = React.useState<{
    id: string
    vez: number
  } | null>(null)
  const comboSinPrecio = catalogo.packs.find(
    (pack) =>
      pack.precioCents <= 0 &&
      catalogo.bloques.some(
        (bloque) => bloque.tipo === "pack" && bloque.pack === pack.id
      )
  )
  function irAlCombo() {
    if (!comboSinPrecio) return
    const id = comboSinPrecio.id
    setPanel("packs")
    setElegido(null)
    setComboPorAbrir((antes) => ({ id, vez: (antes?.vez ?? 0) + 1 }))
    setNivel((antes) => (antes === 0 ? 1 : antes))
  }
  function avisoDe(problema: string) {
    return (
      <Aviso key={problema} tono="problema">
        {problema}
        {comboSinPrecio && problema.startsWith("Ponle precio al combo") ? (
          <>
            {" "}
            <button
              type="button"
              onClick={irAlCombo}
              className="font-semibold underline underline-offset-4 hover:opacity-60"
            >
              Ponerle precio
            </button>
          </>
        ) : null}
      </Aviso>
    )
  }

  const mostrarHoja = React.useCallback((id: string | null) => {
    setElegido(id)
    if (id) setPedidoDeVista((pedido) => pedido + 1)
  }, [])

  const mostrarCombo = React.useCallback(
    (pack: string | null) => {
      const hoja = pack
        ? actual.current.bloques.find(
            (bloque) => bloque.tipo === "pack" && bloque.pack === pack
          )
        : undefined
      mostrarHoja(hoja?.id ?? null)
    },
    [mostrarHoja]
  )

  // Una propuesta se mira donde cambia: los productos si los reordena, la
  // portada si solo cambia el nombre.
  const mirarPropuesta = React.useCallback(
    (propuesta: Catalogo | null) => {
      setMirando(propuesta)
      setMirandoAntes(false)
      if (!propuesta) {
        if (conPropuesta.current) mostrarHoja(null)
        conPropuesta.current = false
        return
      }
      conPropuesta.current = true
      setNivel(1)
      const reordena =
        propuesta.productos.join() !== actual.current.productos.join()
      const hoja =
        (reordena
          ? propuesta.bloques.find((bloque) => bloque.tipo === "productos")
          : undefined) ??
        propuesta.bloques.find((bloque) => bloque.tipo === "portada")
      mostrarHoja(hoja?.id ?? null)
    },
    [mostrarHoja]
  )

  async function pedirALaIa(texto: string) {
    const limpio = texto.trim()
    if (limpio.length < 3 || pidiendoIa) return
    setPedidoIa(limpio)
    setPidiendoIa(true)
    // Si la plataforma corta la función, la acción lanza en vez de responder.
    const resultado = await pedirCatalogoALaIa(
      limpio,
      catalogo.productos
    ).catch(() => ({ ok: false as const, error: MENSAJE_SIN_RESPUESTA }))
    setPidiendoIa(false)
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    setPropuestaIa(resultado.propuesta)
    mirarPropuesta(armarPropuesta(catalogo, resultado.propuesta))
  }

  function cerrarPropuesta(aplicar: boolean) {
    if (aplicar && propuestaIa) {
      alCambiar(armarPropuesta(catalogo, propuestaIa))
      toast.success("Cambios aplicados.", {
        description: "Si no te convencen, deshazlos.",
        action: { label: "Deshacer", onClick: alDeshacer },
      })
    }
    setPropuestaIa(null)
    mirarPropuesta(null)
  }

  // "Enviar" no tiene pestaña en una pantalla ancha: lo suyo va en la
  // cabecera. Si la pantalla se ensancha con "Enviar" abierto, vuelve a Hojas.
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
  const hojasALaVista = mirando ? hojasDe(mirando, datos).length : hojas
  const listo = Boolean(guardado) && !sinGuardar
  const problemas = [
    ...faltantes(catalogo),
    ...problemasDeEstilo(catalogo.estilo),
  ]
  const bloqueado = problemas.length > 0 || hojas === 0

  async function guardar(): Promise<{ id: string; enlace: string } | null> {
    setOcupado("guardar")
    // Sin conexión la acción lanza: sin esto, el botón giraba para siempre y
    // dejaba apagado todo lo demás.
    const resultado = await guardarCatalogo(guardado?.id ?? null, catalogo)
      .catch(() => ({
        ok: false as const,
        error: "No pudimos guardar. Revisa tu conexión e inténtalo de nuevo.",
      }))
      .finally(() => setOcupado(null))
    if (!resultado.ok) {
      toast.error(resultado.error)
      return null
    }
    alGuardar({ id: resultado.id, enlace: resultado.enlace })
    toast.success(
      "Catálogo guardado.",
      window.matchMedia("(min-width: 1024px)").matches
        ? undefined
        : { action: { label: "Enviar", onClick: () => abrirPanel("listo") } }
    )
    // La dirección pasa a ser la del catálogo guardado sin volver a cargar la
    // pantalla: se perdería lo que estaba abierto.
    if (!guardado) {
      window.history.replaceState(null, "", `/panel/catalogos/${resultado.id}`)
      // Sin navegar, la pestaña seguía diciendo "Nuevo catálogo". Es el mismo
      // título que pone la página de un catálogo guardado.
      document.title = "Editar catálogo · Venduo"
    }
    return { id: resultado.id, enlace: resultado.enlace }
  }

  /**
   * Abre algo del catálogo guardado; si hay cambios, guarda primero. La
   * pestaña se abre antes de esperar, como Canva: si no, el navegador la
   * bloquea por no venir de un toque.
   */
  async function abrirGuardado(destino: (enlace: string) => string) {
    if (guardado && !sinGuardar) {
      window.open(destino(guardado.enlace), "_blank", "noopener")
      return
    }
    const pestana = window.open("about:blank", "_blank")
    const resultado = await guardar()
    if (resultado && pestana) pestana.location.href = destino(resultado.enlace)
    else pestana?.close()
  }

  /**
   * El id con el que se pide el PDF. "Pedir este combo" sale solo con lo
   * guardado, porque el precio que se cobra es el guardado: con combos y
   * cambios sin guardar, se guarda primero. `false` si no se pudo guardar.
   */
  async function idParaElPdf(): Promise<string | null | false> {
    const conCombos =
      !esDemo && funciones.combos === "activa" && catalogo.packs.length > 0
    if (!conCombos || (guardado && !sinGuardar)) return guardado?.id ?? null
    const resultado = await guardar()
    return resultado ? resultado.id : false
  }

  async function bajarPdf() {
    const id = await idParaElPdf()
    if (id === false) return
    setOcupado("descargar")
    try {
      await descargarPdf(catalogo, id)
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
    const id = await idParaElPdf()
    if (id === false) return
    setOcupado("compartir")
    try {
      const pdf = await pedirPdf(catalogo, id)
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

  /** Las flechas recorren las pestañas, como en cualquier grupo de pestañas. */
  function moverPestana(evento: React.KeyboardEvent<HTMLDivElement>) {
    const paso =
      evento.key === "ArrowRight" ? 1 : evento.key === "ArrowLeft" ? -1 : 0
    if (!paso) return
    const pestanas = Array.from(
      evento.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")
    ).filter((pestana) => pestana.getClientRects().length > 0)
    const actual = pestanas.indexOf(evento.target as HTMLButtonElement)
    const siguiente =
      pestanas[(actual + paso + pestanas.length) % pestanas.length]
    evento.preventDefault()
    siguiente?.focus()
    siguiente?.click()
  }

  /** Tocar una hoja la abre en el panel, como en la app. */
  function elegirHoja(id: string) {
    if (hayQueDecidir()) return
    setElegido(id)
    setPanel("hojas")
    setNivel((antes) => (antes === 0 ? 1 : antes))
  }

  function abrirPanel(clave: Panel) {
    if (clave !== panel && hayQueDecidir()) return
    setPanel(clave)
    if (clave !== panel) setElegido(null)
    setNivel((antes) => (antes === 0 ? 1 : antes))
  }

  async function borrar() {
    if (!guardado) return
    const si = await preguntar({
      titulo: "¿Borrar este catálogo?",
      texto: "Su enlace dejará de funcionar.",
      confirmar: "Borrar",
    })
    if (!si) return
    const resultado = await borrarCatalogo(guardado.id).catch(() => null)
    if (!resultado?.ok) {
      toast.error(
        resultado?.error ??
          "No pudimos borrar el catálogo. Revisa tu conexión e inténtalo de nuevo."
      )
      return
    }
    toast.success("Catálogo borrado.")
    alBorrar()
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
      {/* Solo cuando hay algo que rehacer: en la barra del celular el nombre
          del catálogo necesita ese lugar. */}
      {puedeRehacer ? (
        <BotonDeLaBarra etiqueta="Rehacer" apagado={false} alTocar={alRehacer}>
          <Redo2 aria-hidden="true" className="size-5" />
        </BotonDeLaBarra>
      ) : null}
      <button
        type="button"
        // "Guardar" guarda. Si algo lo impide lo dice, y abre Enviar: ahí se
        // ve qué falta. Ya guardado, lleva a mandarlo.
        onClick={() => {
          const porGuardar = sinGuardar || !guardado
          if (porGuardar && !esDemo && !bloqueado && ocupado === null) {
            void guardar()
            return
          }
          if (porGuardar && bloqueado) {
            toast.error("Todavía no se puede guardar", {
              description:
                problemas[0] ?? "El catálogo todavía no tiene hojas.",
            })
            // Lleva a donde se arregla, si se sabe dónde.
            if (comboSinPrecio && !hayQueDecidir()) {
              irAlCombo()
              return
            }
          }
          abrirPanel("listo")
        }}
        disabled={ocupado === "guardar"}
        className={cn(
          "ml-1 flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-opacity active:opacity-70 disabled:opacity-60",
          sinGuardar || !guardado
            ? "bg-accion text-white"
            : "border border-tinta/25"
        )}
      >
        {ocupado === "guardar" ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : sinGuardar || !guardado ? null : (
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
        alVolver={alSalir}
        acciones={barra}
        cerrar
      />
      <h1 className="sr-only">Editar catálogo</h1>
      <div className="max-lg:hidden">
        <Volver />
      </div>

      <header className="flex flex-col gap-4 border-b border-tinta pb-5 max-lg:hidden">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
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
              className="mt-1 w-full border-0 border-b border-transparent bg-transparent font-titular text-[clamp(1.6rem,5vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em] hover:border-tinta/30 focus-visible:border-tinta focus-visible:bg-tinta/[0.04]"
            />
            <p className="mt-1 flex items-center gap-1.5 text-sm opacity-70">
              {!sinGuardar && guardado && !esDemo ? (
                <Check aria-hidden="true" className="size-4" />
              ) : null}
              <Recien valor={estado}>{estado}</Recien> ·{" "}
              <Contador valor={hojas} /> {hojas === 1 ? "hoja" : "hojas"}
            </p>
          </div>

          <div className="flex items-center gap-2">
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
            <span className="flex-1" />
            {esDemo ? null : (
              <button
                type="button"
                onClick={guardar}
                disabled={ocupado !== null || bloqueado || listo}
                className={cn(
                  BOTON_SECUNDARIO,
                  "min-h-11 px-3 text-sm whitespace-nowrap sm:px-4"
                )}
              >
                {/* "Guardado" ya lo dice el renglón de arriba. */}
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
                  BOTON_PRIMARIO,
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
                Enviar
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {compartible ? (
                  <DropdownMenuItem
                    className="min-h-11"
                    onSelect={compartirPdf}
                  >
                    <Share2 aria-hidden="true" className="size-4" />
                    Enviar el PDF
                  </DropdownMenuItem>
                ) : null}
                {funciones.compartir !== "oculta" ? (
                  <>
                    <DropdownMenuItem
                      disabled={!guardado || sinGuardar}
                      className={cn(
                        "min-h-11",
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
                      Enviar por WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!guardado || sinGuardar}
                      className={cn(
                        "min-h-11",
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
                    <DropdownMenuItem
                      disabled={esDemo || bloqueado}
                      className={cn(
                        "min-h-11",
                        funciones.compartir === "desactivada" && "opacity-55"
                      )}
                      onSelect={() => {
                        if (funciones.compartir !== "activa") {
                          toast.info(AVISO_DE_NO_DISPONIBLE)
                          return
                        }
                        void abrirGuardado((enlace) => enlace)
                      }}
                    >
                      <Eye aria-hidden="true" className="size-4" />
                      Ver cómo se ve
                    </DropdownMenuItem>
                    <p className="px-2 py-2 text-xs leading-relaxed opacity-65">
                      {esDemo
                        ? "En modo demo no hay enlace: baja el PDF y compártelo."
                        : !guardado || sinGuardar
                          ? "Guarda para tener el enlace. El enlace siempre está al día; el PDF queda con los precios de hoy."
                          : "El enlace siempre está al día; el PDF queda con los precios de hoy."}
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
                BOTON_SECUNDARIO,
                "min-h-11 px-3 text-sm whitespace-nowrap sm:px-4"
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
            {/* Lo mismo que "Más opciones" en la pestaña Enviar del celular. */}
            {guardado ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Más opciones"
                  title="Más opciones"
                  className={cn(BOTON_SECUNDARIO, "min-h-11 w-11 px-0")}
                >
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem
                    variant="destructive"
                    className="min-h-11"
                    onSelect={() => void borrar()}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Borrar el catálogo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        {problemas.length > 0 ? (
          <div className="flex flex-col gap-1.5">{problemas.map(avisoDe)}</div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-start xl:gap-8">
        <PanelDeslizable
          nivel={nivel}
          alCambiarNivel={setNivel}
          contenido={panel}
          cabecera={
            <div
              role="tablist"
              aria-label="Qué editar"
              onKeyDown={moverPestana}
              // En el celular, al pie y del mismo ancho, como los pasos del
              // editor de la tienda.
              className="grid shrink-0 auto-cols-fr grid-flow-col border-b border-tinta max-lg:order-last max-lg:border-t max-lg:border-b-0 max-lg:border-tinta/15 max-lg:pb-[env(safe-area-inset-bottom)]"
            >
              {[...PANELES, ENVIAR].map((pestana) => (
                <BotonDePestana
                  key={pestana.clave}
                  pestana={pestana}
                  activa={panel === pestana.clave}
                  conAviso={pestana.clave === "listo" && sinGuardar && !esDemo}
                  alTocar={() => abrirPanel(pestana.clave)}
                />
              ))}
            </div>
          }
          pie={
            funciones.ia !== "oculta" && !propuestaIa ? (
              <ConFuncion estado={funciones.ia}>
                <BarraDeIa
                  ideas={[
                    "Lo más vendible primero",
                    "Solo lo que está en oferta",
                    "Agrupado por categoría",
                  ]}
                  pidiendo={pidiendoIa}
                  pedido={pedidoIa}
                  alPedir={(pedido) => void pedirALaIa(pedido)}
                />
              </ConFuncion>
            ) : null
          }
        >
          {propuestaIa ? (
            <TarjetaDePropuesta
              pedido={pedidoIa}
              propuesta={propuestaIa}
              detalle={
                <DetalleDePropuesta
                  catalogo={catalogo}
                  datos={datos}
                  propuesta={propuestaIa}
                />
              }
              viendoAntes={mirandoAntes}
              alVerAntes={setMirandoAntes}
              alAplicar={() => cerrarPropuesta(true)}
              alDescartar={() => cerrarPropuesta(false)}
            />
          ) : (
            <div
              role="tabpanel"
              id={`panel-${panel}`}
              aria-labelledby={`pestana-${panel}`}
            >
              <h2 className="sr-only">
                {
                  [...PANELES, ENVIAR].find(({ clave }) => clave === panel)
                    ?.nombre
                }
              </h2>
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
                  alMostrar={mostrarCombo}
                  alIrA={abrirPanel}
                  abrir={comboPorAbrir}
                />
              ) : panel === "estilo" ? (
                <PanelDeEstilo
                  catalogo={catalogo}
                  estiloDeTienda={estiloDeTienda}
                  sugeridos={sugeridos}
                  alCambiar={alCambiar}
                  alCambiarPlantilla={alCambiarPlantilla}
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
                  alCambiarNombre={(nombre) =>
                    alCambiar({ ...catalogo, nombre })
                  }
                  alGuardar={guardar}
                  alAbrirGuardado={abrirGuardado}
                  hojas={hojas}
                  alCompartirPdf={compartible ? compartirPdf : bajarPdf}
                  alDescargarPdf={bajarPdf}
                  alBorrar={borrar}
                  avisoDe={avisoDe}
                />
              )}
            </div>
          )}
        </PanelDeslizable>

        <section
          aria-label="Vista previa"
          className="flex min-w-0 flex-col lg:sticky lg:top-6 lg:overflow-hidden lg:rounded-[20px] lg:border lg:border-tinta/12 lg:bg-hoja lg:shadow-[var(--sombra-cuaderno)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-tinta/15 px-4 py-3 max-lg:hidden sm:px-5">
            <h2 className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
              Vista previa
            </h2>
            <p className="text-sm font-semibold whitespace-nowrap">
              <Recien valor={hojasALaVista}>
                <Contador valor={hojasALaVista} />{" "}
                {hojasALaVista === 1 ? "hoja" : "hojas"}
              </Recien>
            </p>
          </header>
          <VistaPrevia
            catalogo={mirando && !mirandoAntes ? mirando : catalogo}
            // En el celular, la hoja entra entera sobre el panel: lo que se
            // edita se ve cambiar.
            // Solo mientras se edita una hoja: si no, a 390 todas medían 213 px
            // y no se leía ninguna.
            altoDisponible={
              pantalla?.celular && nivel > 0 && (elegido || mirando)
                ? Math.max(
                    260,
                    pantalla.alto - altoDelPanel(nivel, pantalla.alto) - 120
                  )
                : undefined
            }
            datos={datos}
            elegido={elegido}
            pedido={pedidoDeVista}
            alElegir={elegirHoja}
            vivo
            armando={ocupado === "descargar" || ocupado === "compartir"}
            className="bg-tinta/[0.04] px-4 py-6 sm:px-6 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto"
          />
        </section>
      </div>
    </div>
  )
}

function BotonDePestana({
  pestana: { clave, nombre, icono: Icono },
  activa,
  conAviso = false,
  alTocar,
}: {
  pestana: Pestana
  activa: boolean
  conAviso?: boolean
  alTocar: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`pestana-${clave}`}
      aria-selected={activa}
      aria-controls={activa ? `panel-${clave}` : undefined}
      tabIndex={activa ? 0 : -1}
      onClick={alTocar}
      className={cn(
        "relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-0 text-xs font-semibold whitespace-nowrap transition-colors max-lg:border-t-2 lg:min-h-12 lg:flex-row lg:border-l lg:border-tinta/15 lg:text-sm lg:first:border-l-0",
        clave === "listo" && "lg:hidden",
        // En el celular, como los pasos de la tienda: una raya arriba de la
        // elegida. En la computadora, la elegida va en tinta llena.
        activa
          ? "max-lg:border-tinta max-lg:text-tinta lg:bg-tinta lg:text-papel"
          : "hover:text-tinta max-lg:border-transparent max-lg:text-tinta/65 lg:hover:bg-tinta/[0.05]"
      )}
    >
      <Icono aria-hidden="true" className="size-5 lg:hidden" />
      {nombre}
      {conAviso ? (
        <span
          role="img"
          aria-label="Sin guardar"
          className="absolute top-1.5 right-[calc(50%-16px)] size-2 rounded-full bg-senal"
        />
      ) : null}
    </button>
  )
}

/** Un botón de ícono en la barra de arriba: deshacer, rehacer. */
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
 * La pestaña "Enviar" del celular: el nombre, guardar y mandarlo. En una
 * pantalla ancha todo esto va en la cabecera del editor.
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
  alAbrirGuardado,
  hojas,
  alCompartirPdf,
  alDescargarPdf,
  alBorrar,
  avisoDe,
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
  /** Abre el enlace guardado; si hay cambios, guarda primero. */
  alAbrirGuardado: (destino: (enlace: string) => string) => void
  hojas: number
  alCompartirPdf: () => void
  alDescargarPdf: () => void
  alBorrar: () => void
  /** El aviso de un problema, con el enlace a donde se arregla. */
  avisoDe: (problema: string) => React.ReactNode
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

      <p className="-mt-3 text-sm opacity-75">
        <Recien
          valor={
            esDemo ? "demo" : sinGuardar ? "cambios" : guardado ? "ok" : "no"
          }
        >
          {esDemo
            ? "Modo demo: no se guarda"
            : sinGuardar
              ? "Cambios sin guardar"
              : guardado
                ? "Guardado"
                : "Sin guardar"}
        </Recien>{" "}
        · <Contador valor={hojas} /> {hojas === 1 ? "hoja" : "hojas"}
      </p>

      {problemas.length > 0 ? (
        <div className="flex flex-col gap-1.5">{problemas.map(avisoDe)}</div>
      ) : null}

      {/* El enlace abre lo guardado, no lo que está en pantalla: mandarlo
          guarda primero. El PDF en modo demo sí sale, con lo de pantalla. */}
      <div className="flex flex-col gap-3">
        {conEnlace ? (
          <div>
            <button
              type="button"
              disabled={esDemo || bloqueado || ocupado !== null}
              onClick={() =>
                alAbrirGuardado((enlace) =>
                  enlaceDeWhatsApp(`${catalogo.nombre} · ${tienda}\n${enlace}`)
                )
              }
              className={cn(BOTON_PRIMARIO, "w-full")}
            >
              <Send aria-hidden="true" className="size-5" />
              Enviar por WhatsApp
            </button>
            <p className="mt-1.5 text-xs leading-relaxed opacity-70">
              Guardamos tus cambios y enviamos un enlace con los precios y el
              stock del día.
            </p>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <AccionDeListo
            titulo={
              ocupado === "compartir" || ocupado === "descargar"
                ? "Armando…"
                : compartible
                  ? "Enviar el PDF"
                  : "Descargar PDF"
            }
            nota="Queda con los precios de hoy"
            icono={compartible ? Share2 : FileDown}
            apagado={bloqueado || ocupado !== null}
            alTocar={alCompartirPdf}
          />
          {conEnlace ? (
            <AccionDeListo
              titulo="Ver cómo se ve"
              nota="Como lo reciben"
              icono={Eye}
              apagado={esDemo || bloqueado || ocupado !== null}
              alTocar={() => alAbrirGuardado((enlace) => enlace)}
            />
          ) : null}
        </div>
      </div>

      {esDemo ? (
        <p className="text-sm opacity-70">
          En modo demo no se guarda: baja el PDF y compártelo.
        </p>
      ) : listo ? null : (
        <button
          type="button"
          onClick={alGuardar}
          disabled={ocupado !== null || bloqueado}
          className={cn(BOTON_SECUNDARIO, "w-full")}
        >
          {ocupado === "guardar" ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-5 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Save aria-hidden="true" className="size-5" />
          )}
          Guardar
        </button>
      )}

      {funciones.canva !== "oculta" || guardado || compartible || conEnlace ? (
        <div className="-mt-5">
          <ElegirCadaUno titulo="Más opciones">
            <div className="mt-2 flex flex-col gap-2">
              {compartible ? (
                <button
                  type="button"
                  disabled={bloqueado || ocupado !== null}
                  onClick={alDescargarPdf}
                  className="flex min-h-11 items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                >
                  <FileDown aria-hidden="true" className="size-4" />
                  Descargar PDF
                </button>
              ) : null}
              {conEnlace ? (
                <button
                  type="button"
                  disabled={!listo || esDemo}
                  onClick={async () => {
                    if (!guardado) return
                    await navigator.clipboard.writeText(guardado.enlace)
                    toast.success("Enlace copiado.")
                  }}
                  className="flex min-h-11 items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
                >
                  <Copy aria-hidden="true" className="size-4" />
                  Copiar el enlace
                </button>
              ) : null}
              {funciones.canva !== "oculta" ? (
                <>
                  {canva}
                  <p className="-mt-1 text-xs leading-relaxed opacity-70">
                    Para seguir diseñándolo en Canva, con tus hojas como punto
                    de partida.
                  </p>
                </>
              ) : null}
              {guardado ? (
                <button
                  type="button"
                  onClick={alBorrar}
                  className="flex min-h-11 items-center gap-2 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Borrar el catálogo
                </button>
              ) : null}
            </div>
          </ElegirCadaUno>
        </div>
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
      className="flex min-h-16 items-center gap-3 rounded-[16px] border border-tinta/25 bg-hoja px-3 py-2 text-left transition-colors hover:bg-tinta/[0.04] disabled:opacity-40"
    >
      <Icono aria-hidden="true" className="size-5 shrink-0" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="block text-xs opacity-70">{nota}</span>
      </span>
    </button>
  )
}
