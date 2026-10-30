"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Camera,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Images,
  ImagePlus,
  Loader2,
  NotebookPen,
  Package,
  Pointer,
  Type,
  X,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  CampoMonto,
  Cantidad,
  Fila,
  HojaDeAjuste,
  Palanca,
} from "@/components/panel/ajustes"
import { Textarea } from "@/components/ui/textarea"
import {
  aplicarMapeo,
  asignarCampo,
  mapeoDeLectura,
  tituloDeCampo,
  CAMPOS_DE_CARGA,
  faltaEn,
  HOJA_MODELO,
  LIMITES_DE_CARGA,
  repetidos,
  type Borrador,
  type CampoDeCarga,
  type ColumnaLeida,
  type Lectura,
} from "@/lib/carga"
import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO,
  CAMPO_LINEA,
  FICHA,
  FICHA_ELEGIDA,
  FICHA_LIBRE,
  GRILLA_DE_FICHAS,
} from "@/lib/estilos"
import { CURRENCY_SYMBOL } from "@/lib/format"
import {
  crearXlsx,
  filasDeTexto,
  leerCsv,
  leerXlsx,
  letraDeColumna,
  type Filas,
} from "@/lib/planilla"
import { BUCKETS, uploadFile } from "@/lib/supabase/storage"
import { cn } from "@/lib/utils"
import type {
  crearProductos as CrearProductos,
  leerFotos as LeerFotos,
  leerLista as LeerLista,
  leerColumnasDePlanilla as LeerColumnasDePlanilla,
} from "@/app/(privado)/panel/productos/cargar/acciones"

const BORRADOR = "venduo:carga"
const SIN_RESPUESTA =
  "Se cortó la conexión. Los que ya estaban armados siguen aquí."

interface Acciones {
  leerFotos: typeof LeerFotos
  leerLista: typeof LeerLista
  leerColumnasDePlanilla: typeof LeerColumnasDePlanilla
  crearProductos: typeof CrearProductos
}

type Etapa = "elegir" | "procesando" | "columnas" | "revisar"
type Filtro = "todos" | "sin-precio" | "repetidos"

/**
 * Cargar varios productos a la vez desde lo que la persona ya tiene: fotos,
 * una planilla con sus columnas o una lista escrita. La IA arma borradores y
 * la persona los revisa en una lista donde los precios se escriben uno tras
 * otro. Nada se crea hasta "Crear N productos". Los que no tienen precio
 * esperan en la pantalla, y sobreviven a una recarga.
 */
export function CargaDeProductos({
  cabecera,
  tiendaId,
  existentes,
  categorias,
  conIa,
  esDemo,
  acciones,
}: {
  /** El titular de la pantalla: se esconde mientras se revisan las columnas,
   *  para que la tabla entre en el celular. */
  cabecera: React.ReactNode
  tiendaId: string | null
  /** Los nombres de los productos que ya tiene: para avisar repetidos. */
  existentes: string[]
  categorias: string[]
  /** La IA para cargar productos está activa en esta tienda. */
  conIa: boolean
  esDemo: boolean
  acciones: Acciones
}) {
  const router = useRouter()
  const [etapa, setEtapa] = React.useState<Etapa>("elegir")
  const [borradores, setBorradores] = React.useState<Borrador[]>([])
  const [restaurado, setRestaurado] = React.useState(false)
  const [progreso, setProgreso] = React.useState<{
    texto: string
    hechos: number
    total: number | null
  } | null>(null)
  // La planilla cargada y los borradores que salieron de ella: al cambiar
  // una columna, o al subir otra planilla, se reemplazan esos y nada más.
  const [planilla, setPlanilla] = React.useState<{
    filas: Filas
    lectura: Lectura
    ids: string[]
    /** Las filas que la persona quitó: no se cargan. */
    excluidas: number[]
    /** Un archivo, o una tabla pegada como lista escrita. */
    de: "planilla" | "lista"
  } | null>(null)
  const [aviso, setAviso] = React.useState<string | null>(null)
  const [errorDeEntrada, setErrorDeEntrada] = React.useState<{
    puerta: "fotos" | "planilla" | "lista"
    texto: string
  } | null>(null)
  const [lista, setLista] = React.useState(false)
  const [visibles, setVisibles] = React.useState(true)
  const [creando, setCreando] = React.useState(false)
  const [abierto, setAbierto] = React.useState<string | null>(null)
  const [omitirRepetidos, setOmitirRepetidos] = React.useState(true)
  const [crearIgual, setCrearIgual] = React.useState<Set<string>>(
    () => new Set()
  )
  const detener = React.useRef(false)

  const entradaFotos = React.useRef<HTMLInputElement>(null)
  const entradaPlanilla = React.useRef<HTMLInputElement>(null)
  const entradaPaginas = React.useRef<HTMLInputElement>(null)

  // Los borradores sobreviven a una recarga: las fotos ya están subidas.
  React.useEffect(() => {
    try {
      const guardado = sessionStorage.getItem(BORRADOR)
      if (guardado) {
        const leidos = (JSON.parse(guardado) as Borrador[]).map((b) => ({
          ...b,
          opciones: b.opciones ?? [],
          variantes: b.variantes ?? [],
        }))
        if (leidos.length) {
          setBorradores(leidos)
          setEtapa("revisar")
        }
      }
    } catch {
      // Sin almacenamiento, la carga empieza de cero: no es un error.
    }
    setRestaurado(true)
  }, [])

  React.useEffect(() => {
    if (!restaurado) return
    try {
      if (borradores.length)
        sessionStorage.setItem(BORRADOR, JSON.stringify(borradores))
      else sessionStorage.removeItem(BORRADOR)
    } catch {
      // Igual que arriba.
    }
  }, [borradores, restaurado])

  const yaExisten = React.useMemo(
    () => repetidos(borradores, existentes),
    [borradores, existentes]
  )
  const omitido = (b: Borrador) =>
    omitirRepetidos && yaExisten.has(b.id) && !crearIgual.has(b.id)
  const completos = borradores.filter((b) => !faltaEn(b) && !omitido(b))
  const sinPrecio = borradores.filter((b) => faltaEn(b) === "precio").length
  const sinNombre = borradores.filter((b) => faltaEn(b) === "nombre").length

  function agregar(nuevos: Borrador[]) {
    setBorradores((antes) => [...antes, ...nuevos])
  }

  function cambiar(id: string, cambio: Partial<Borrador>) {
    setBorradores((antes) =>
      antes.map((b) => {
        if (b.id !== id) return b
        // Lo que la persona toca deja de ser algo que inventó la IA.
        const tocados = Object.keys(cambio)
        return {
          ...b,
          ...cambio,
          inventado: b.inventado.filter((c) => !tocados.includes(c)),
          duda: null,
        }
      })
    )
  }

  function quitar(id: string) {
    const indice = borradores.findIndex((b) => b.id === id)
    const quitado = borradores[indice]
    if (!quitado) return
    setBorradores((antes) => antes.filter((b) => b.id !== id))
    setAbierto(null)
    // El aviso de la IA era sobre estos borradores: sin ninguno, sobra.
    if (borradores.length === 1) setAviso(null)
    toast("Borrador quitado.", {
      action: {
        label: "Deshacer",
        onClick: () =>
          setBorradores((antes) => {
            const copia = [...antes]
            copia.splice(Math.min(indice, copia.length), 0, quitado)
            return copia
          }),
      },
    })
  }

  /* ---------------------------------------------------------------------
   * Las tres puertas
   * ------------------------------------------------------------------ */

  async function subir(archivos: File[]): Promise<string[] | null> {
    if (!tiendaId) {
      toast.info(
        "Estás en modo demo: las fotos no se suben. Prueba con una lista escrita."
      )
      return null
    }
    const urls: string[] = []
    for (const archivo of archivos) {
      try {
        urls.push(
          (await uploadFile(BUCKETS.productImages, archivo, tiendaId)).url
        )
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `${archivo.name}: ${error.message}`
            : "No pudimos subir una foto."
        )
      }
    }
    return urls
  }

  async function desdeFotos(archivos: File[], modo: "fotos" | "lista") {
    const maximo =
      modo === "fotos" ? LIMITES_DE_CARGA.fotos : LIMITES_DE_CARGA.paginas
    if (archivos.length > maximo) {
      toast.info(
        modo === "fotos"
          ? `Puedes subir hasta ${maximo} fotos a la vez. Tomamos las primeras ${maximo}.`
          : `Hasta ${maximo} páginas por vez. Tomamos las primeras ${maximo}.`
      )
    }
    const elegidas = archivos.slice(0, maximo)
    if (!elegidas.length) return

    detener.current = false
    setEtapa("procesando")
    setLista(false)
    setProgreso({ texto: "Subiendo tus fotos…", hechos: 0, total: null })
    const urls = await subir(elegidas)
    if (!urls?.length) {
      setEtapa(borradores.length ? "revisar" : "elegir")
      setProgreso(null)
      return
    }

    const tanda = modo === "fotos" ? LIMITES_DE_CARGA.fotosPorPedido : maximo
    let hechos = 0
    for (let i = 0; i < urls.length; i += tanda) {
      if (detener.current) break
      setProgreso({
        texto:
          modo === "fotos"
            ? "Armando tus productos"
            : `Leyendo tu lista… ${urls.length === 1 ? "" : `página ${i + 1} de ${urls.length}`}`,
        hechos,
        total: modo === "fotos" ? urls.length : null,
      })
      const resultado = await acciones
        .leerFotos({ urls: urls.slice(i, i + tanda), modo })
        .catch(() => ({ ok: false as const, error: SIN_RESPUESTA }))
      if (!resultado.ok) {
        const faltan = urls.length - hechos
        setAviso(
          hechos > 0
            ? `${resultado.error} Armamos ${hechos} de ${urls.length}; las otras ${faltan} fotos, súbelas de nuevo.`
            : resultado.error
        )
        break
      }
      agregar(resultado.borradores)
      if (resultado.aviso) setAviso(resultado.aviso)
      hechos += Math.min(tanda, urls.length - i)
    }
    setProgreso(null)
    setEtapa("revisar")
  }

  async function desdePlanilla(archivo: File) {
    setErrorDeEntrada(null)
    if (archivo.size > LIMITES_DE_CARGA.bytesDePlanilla) {
      setErrorDeEntrada({
        puerta: "planilla",
        texto:
          "Esa planilla pesa más de 2 MB. Guárdala solo con tus productos.",
      })
      return
    }
    let filas: Filas
    try {
      filas = /\.xlsx$/i.test(archivo.name)
        ? await leerXlsx(new Uint8Array(await archivo.arrayBuffer()))
        : leerCsv(await archivo.text())
    } catch {
      filas = []
    }
    if (!/\.(xlsx|csv|txt)$/i.test(archivo.name) || filas.length === 0) {
      setErrorDeEntrada({
        puerta: "planilla",
        texto:
          filas.length === 0 && /\.(xlsx|csv|txt)$/i.test(archivo.name)
            ? "Esa planilla no tiene productos."
            : "No pudimos leer ese archivo. Guárdalo como Excel (.xlsx) o CSV y vuelve a subirlo.",
      })
      return
    }
    await leerFilas(filas, "planilla")
  }

  /**
   * Las filas de una planilla, o de una tabla pegada: la IA dice qué es cada
   * columna, y siempre se muestra cómo se leyó, con lo dudoso preguntado,
   * antes de armar los productos.
   */
  async function leerFilas(todas: Filas, de: "planilla" | "lista") {
    const filas = todas.slice(0, LIMITES_DE_CARGA.productos + 20)
    setEtapa("procesando")
    setProgreso({
      texto: de === "planilla" ? "Leyendo tu planilla…" : "Leyendo tu lista…",
      hechos: 0,
      total: null,
    })
    const resultado = await acciones
      .leerColumnasDePlanilla(filas)
      .catch(() => ({ ok: false as const, error: SIN_RESPUESTA }))
    setProgreso(null)
    if (!resultado.ok) {
      setErrorDeEntrada({ puerta: de, texto: resultado.error })
      setEtapa(borradores.length ? "revisar" : "elegir")
      return
    }
    setPlanilla({
      filas,
      lectura: resultado.lectura,
      ids: planilla?.ids ?? [],
      excluidas: [],
      de,
    })
    setEtapa("columnas")
  }

  async function desdeTexto(texto: string) {
    setLista(false)
    // Una tabla pegada —copiada de Excel, o con comas— se lee por columnas,
    // como una planilla.
    const filas = filasDeTexto(texto)
    if (filas) {
      await leerFilas(filas, "lista")
      return
    }
    setEtapa("procesando")
    setProgreso({ texto: "Leyendo tu lista…", hechos: 0, total: null })
    const resultado = await acciones
      .leerLista(texto)
      .catch(() => ({ ok: false as const, error: SIN_RESPUESTA }))
    setProgreso(null)
    if (!resultado.ok) {
      setErrorDeEntrada({ puerta: "lista", texto: resultado.error })
      setEtapa(borradores.length ? "revisar" : "elegir")
      return
    }
    agregar(resultado.borradores)
    if (resultado.aviso) setAviso(resultado.aviso)
    setEtapa("revisar")
  }

  /**
   * Con la lectura ya confirmada, la planilla entera se vuelve borradores. Lo
   * que vino de una lectura anterior se reemplaza; lo demás se queda.
   */
  function confirmarLectura(lectura: Lectura) {
    if (!planilla) return
    const anteriores = new Set(planilla.ids)
    const leidos = aplicarMapeo(
      sinExcluidas(planilla.filas, planilla.excluidas),
      mapeoDeLectura(lectura)
    )
    setBorradores((antes) => [
      ...antes.filter((b) => !anteriores.has(b.id)),
      ...leidos,
    ])
    setPlanilla({ ...planilla, lectura, ids: leidos.map((b) => b.id) })
    setEtapa("revisar")
  }

  /* ---------------------------------------------------------------------
   * Crear
   * ------------------------------------------------------------------ */

  async function crear() {
    if (!completos.length || creando) return
    setCreando(true)
    const resultado = await acciones
      .crearProductos({
        borradores: completos.map((b) => ({
          nombre: b.nombre.trim(),
          precio: b.precio,
          stock: b.stock,
          categoria: b.categoria,
          descripcion: b.descripcion,
          codigo: b.codigo,
          costo: b.costo,
          fotos: b.fotos,
          opciones: b.opciones,
          variantes: b.variantes,
        })),
        visibles,
      })
      .catch(() => ({
        ok: false as const,
        error:
          "No pudimos crear los productos. Revisa tu conexión e inténtalo de nuevo.",
      }))
    setCreando(false)
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    const creados = new Set(completos.map((b) => b.id))
    const quedan = borradores.filter((b) => !creados.has(b.id) && !omitido(b))
    setBorradores(quedan)
    toast.success(
      `${resultado.creados} ${resultado.creados === 1 ? "producto creado" : "productos creados"}.`,
      quedan.length
        ? {
            action: {
              label: "Ver",
              onClick: () => router.push("/panel/productos"),
            },
          }
        : undefined
    )
    if (resultado.sinTallas > 0) {
      toast.warning(
        `${resultado.sinTallas === 1 ? "Uno se creó" : `${resultado.sinTallas} se crearon`} sin sus tallas. Agrégalas desde el producto.`
      )
    }
    if (!quedan.length) {
      setPlanilla(null)
      router.push("/panel/productos")
    }
  }

  if (!restaurado) return cabecera

  const puertas = (
    <Puertas
      conIa={conIa}
      error={errorDeEntrada}
      alFotos={() => entradaFotos.current?.click()}
      alPlanilla={() => entradaPlanilla.current?.click()}
      alLista={() => setLista(true)}
    />
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:gap-8",
        (etapa === "revisar" || etapa === "columnas") && "max-lg:pb-36"
      )}
    >
      {etapa === "columnas" ? null : cabecera}
      <input
        ref={entradaFotos}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(evento) => {
          const archivos = [...(evento.target.files ?? [])]
          evento.target.value = ""
          void desdeFotos(archivos, "fotos")
        }}
      />
      <input
        ref={entradaPlanilla}
        type="file"
        accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={(evento) => {
          const archivo = evento.target.files?.[0]
          evento.target.value = ""
          if (archivo) void desdePlanilla(archivo)
        }}
      />
      <input
        ref={entradaPaginas}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        hidden
        onChange={(evento) => {
          const archivos = [...(evento.target.files ?? [])]
          evento.target.value = ""
          void desdeFotos(archivos, "lista")
        }}
      />

      {etapa === "elegir" ? (
        <>
          {/* Vino de "Sumar más": los que ya armó siguen esperando. */}
          {borradores.length > 0 ? (
            <ul className="border border-tinta">
              <Fila
                icono={Boxes}
                titulo={`Tus ${borradores.length} ${borradores.length === 1 ? "borrador" : "borradores"}`}
                valor="Volver"
                alTocar={() => setEtapa("revisar")}
              />
            </ul>
          ) : null}
          {puertas}
          <button
            type="button"
            onClick={descargarModelo}
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal"
          >
            <Download aria-hidden="true" className="size-4" />
            Descargar planilla modelo
          </button>
        </>
      ) : null}

      {etapa === "procesando" && progreso ? (
        <Progreso
          {...progreso}
          alDetener={progreso.total ? () => (detener.current = true) : null}
        />
      ) : null}

      {etapa !== "elegir" && aviso ? (
        <div role="status" className="border border-tinta px-4 py-3 text-sm">
          {aviso}
        </div>
      ) : null}

      {etapa === "columnas" && planilla ? (
        <LecturaDePlanilla
          filas={planilla.filas}
          lectura={planilla.lectura}
          excluidas={planilla.excluidas}
          de={planilla.de}
          alCambiar={(lectura) => setPlanilla({ ...planilla, lectura })}
          alExcluir={(excluidas) => setPlanilla({ ...planilla, excluidas })}
          alConfirmar={confirmarLectura}
        />
      ) : null}

      {(etapa === "procesando" || etapa === "revisar") &&
      (borradores.length > 0 || etapa === "revisar") ? (
        <Revision
          borradores={borradores}
          yaExisten={yaExisten}
          omitido={omitido}
          crearIgual={(id) => setCrearIgual((antes) => new Set(antes).add(id))}
          omitirRepetidos={omitirRepetidos}
          planilla={planilla}
          alColumnas={() => setEtapa("columnas")}
          alAbrir={setAbierto}
          alCambiar={cambiar}
          alQuitar={quitar}
          procesando={etapa === "procesando"}
          alAgregarMas={() => {
            setAviso(null)
            setEtapa("elegir")
          }}
        />
      ) : null}

      {etapa === "revisar" && borradores.length > 0 ? (
        <ul className="border border-tinta">
          <Palanca
            icono={Eye}
            titulo="Visibles en tu tienda"
            valor={visibles}
            alCambiar={setVisibles}
          />
          {yaExisten.size > 0 ? (
            <Palanca
              icono={Boxes}
              titulo="Omitir los que ya tienes"
              valor={omitirRepetidos}
              alCambiar={setOmitirRepetidos}
            />
          ) : null}
        </ul>
      ) : null}

      {etapa === "revisar" && borradores.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 border-t border-tinta bg-papel px-4 py-3 lg:sticky lg:bottom-0 lg:border lg:px-5">
          <div className="min-w-0 flex-1">
            {sinPrecio + sinNombre > 0 ? (
              <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                {sinNombre > 0
                  ? `Faltan ${sinNombre} ${sinNombre === 1 ? "nombre" : "nombres"}`
                  : `Faltan ${sinPrecio} ${sinPrecio === 1 ? "precio" : "precios"}`}
              </p>
            ) : (
              <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                Todo listo
              </p>
            )}
            {esDemo ? (
              <p className="text-xs text-tinta/65">
                En modo demo no se guardan.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void crear()}
            disabled={creando || completos.length === 0}
            className={cn(BOTON_PRIMARIO, "min-h-12 shrink-0 px-5")}
          >
            {creando ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            ) : null}
            {creando
              ? "Creando…"
              : completos.length === 0
                ? "Completa los precios"
                : `Crear ${completos.length} ${completos.length === 1 ? "producto" : "productos"}`}
          </button>
        </div>
      ) : null}

      {lista ? (
        <HojaDeLista
          conIa={conIa}
          alCerrar={() => setLista(false)}
          alFoto={() => {
            setLista(false)
            entradaPaginas.current?.click()
          }}
          alTexto={(texto) => void desdeTexto(texto)}
        />
      ) : null}

      {abierto ? (
        <HojaDeBorrador
          borrador={borradores.find((b) => b.id === abierto) ?? null}
          categorias={[
            ...new Set([
              ...categorias,
              ...borradores
                .map((b) => b.categoria)
                .filter((c): c is string => Boolean(c)),
            ]),
          ]}
          leidoDe={planilla?.ids.includes(abierto) ? planilla.de : null}
          alCambiar={(cambio) => cambiar(abierto, cambio)}
          alQuitar={() => quitar(abierto)}
          alCerrar={() => setAbierto(null)}
        />
      ) : null}
    </div>
  )
}

/** La planilla modelo: las mismas columnas que se leen, con dos ejemplos. */
function descargarModelo() {
  const archivo = crearXlsx([HOJA_MODELO])
  const enlace = document.createElement("a")
  enlace.href = URL.createObjectURL(
    new Blob([archivo as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  )
  enlace.download = "planilla-modelo-venduo.xlsx"
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 10_000)
}

/* ---------------------------------------------------------------------------
 * Las puertas
 * ------------------------------------------------------------------------ */

export function Puertas({
  conIa,
  error,
  alFotos,
  alPlanilla,
  alLista,
}: {
  conIa: boolean
  error: { puerta: "fotos" | "planilla" | "lista"; texto: string } | null
  alFotos: () => void
  alPlanilla: () => void
  alLista: () => void
}) {
  return (
    <section className="border border-tinta">
      <header className="flex items-start gap-3 border-b border-tinta/15 px-4 py-3.5 sm:px-5">
        <ImagePlus aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
            Lo que ya tienes
          </h2>
          <p className="mt-0.5 text-sm leading-snug opacity-70">
            Un producto por foto, fila o renglón.
          </p>
        </div>
      </header>
      <ul>
        <Puerta
          icono={Images}
          titulo="Fotos de tus productos"
          detalle={
            conIa
              ? `Hasta ${LIMITES_DE_CARGA.fotos}, uno por foto`
              : "No disponible por ahora"
          }
          apagada={!conIa}
          error={error?.puerta === "fotos" ? error.texto : null}
          alTocar={alFotos}
        />
        <Puerta
          icono={FileSpreadsheet}
          titulo="Una planilla"
          detalle={
            conIa
              ? "Excel o CSV, como la tengas"
              : "Excel o CSV. Eliges qué columna es qué."
          }
          error={error?.puerta === "planilla" ? error.texto : null}
          alTocar={alPlanilla}
        />
        <Puerta
          icono={NotebookPen}
          titulo="Una lista escrita"
          detalle={
            conIa ? "Foto del cuaderno o el texto" : "No disponible por ahora"
          }
          apagada={!conIa}
          error={error?.puerta === "lista" ? error.texto : null}
          alTocar={alLista}
        />
      </ul>
    </section>
  )
}

function Puerta({
  icono: Icono,
  titulo,
  detalle,
  apagada = false,
  error,
  alTocar,
}: {
  icono: LucideIcon
  titulo: string
  detalle: string
  apagada?: boolean
  error: string | null
  alTocar: () => void
}) {
  return (
    <li className="border-t border-tinta/15 first:border-t-0">
      <button
        type="button"
        onClick={apagada ? undefined : alTocar}
        aria-disabled={apagada}
        className={cn(
          "flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors sm:px-5",
          apagada
            ? "cursor-not-allowed"
            : "hover:bg-tinta/[0.04] active:bg-tinta/[0.07]"
        )}
      >
        <Icono
          aria-hidden="true"
          className={cn("size-5 shrink-0", apagada && "opacity-45")}
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn("font-semibold", apagada && "text-tinta/55")}>
            {titulo}
          </span>
          <span className="text-sm text-tinta/65">{detalle}</span>
          {error ? (
            <span
              role="alert"
              className="mt-1 text-sm font-semibold text-senal"
            >
              {error}
            </span>
          ) : null}
        </span>
        {apagada ? null : (
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 opacity-55"
          />
        )}
      </button>
    </li>
  )
}

/* ---------------------------------------------------------------------------
 * Procesando
 * ------------------------------------------------------------------------ */

function Progreso({
  texto,
  hechos,
  total,
  alDetener,
}: {
  texto: string
  hechos: number
  total: number | null
  alDetener: (() => void) | null
}) {
  return (
    <section
      aria-live="polite"
      className="border border-tinta px-4 py-4 sm:px-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">{texto}</p>
        {total ? (
          <p className="tabular text-sm text-tinta/65">
            {hechos} de {total}
          </p>
        ) : null}
      </div>
      <div className="mt-3 h-1 overflow-hidden bg-tinta/15">
        {total ? (
          <div
            className="h-full bg-tinta transition-[width] duration-500"
            style={{ width: `${Math.max(4, (hechos / total) * 100)}%` }}
          />
        ) : (
          <div className="h-full w-1/3 animate-pulse bg-tinta" />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-tinta/65">Deja esta pantalla abierta.</p>
        {alDetener ? (
          <button
            type="button"
            onClick={alDetener}
            className="min-h-11 px-2 text-sm font-semibold underline underline-offset-4"
          >
            Detener
          </button>
        ) : null}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
 * La revisión
 * ------------------------------------------------------------------------ */

function Revision({
  borradores,
  yaExisten,
  omitido,
  crearIgual,
  omitirRepetidos,
  planilla,
  alColumnas,
  alAbrir,
  alCambiar,
  alQuitar,
  procesando,
  alAgregarMas,
}: {
  borradores: Borrador[]
  yaExisten: Set<string>
  omitido: (b: Borrador) => boolean
  crearIgual: (id: string) => void
  omitirRepetidos: boolean
  planilla: { de: "planilla" | "lista" } | null
  alColumnas: () => void
  alAbrir: (id: string) => void
  alCambiar: (id: string, cambio: Partial<Borrador>) => void
  alQuitar: (id: string) => void
  procesando: boolean
  alAgregarMas: () => void
}) {
  const [filtro, setFiltro] = React.useState<Filtro>("todos")
  const lista = React.useRef<HTMLUListElement>(null)
  const sinPrecio = borradores.filter((b) => faltaEn(b)).length
  const visibles = borradores.filter((b) =>
    filtro === "sin-precio"
      ? faltaEn(b) !== null
      : filtro === "repetidos"
        ? yaExisten.has(b.id)
        : true
  )

  const fichas: { valor: Filtro; nombre: string; cuenta: number }[] = [
    { valor: "todos", nombre: "Todos", cuenta: borradores.length },
    { valor: "sin-precio", nombre: "Les falta algo", cuenta: sinPrecio },
    ...(yaExisten.size
      ? [
          {
            valor: "repetidos" as const,
            nombre: "Ya los tienes",
            cuenta: yaExisten.size,
          },
        ]
      : []),
  ]

  return (
    <>
      {planilla ? (
        <ul className="border border-tinta">
          <Fila
            icono={FileSpreadsheet}
            titulo={`Así leímos tu ${planilla.de}`}
            valor="Ver"
            alTocar={alColumnas}
          />
        </ul>
      ) : null}

      <section className="border border-tinta">
        <header className="flex items-start gap-3 border-b border-tinta/15 px-4 py-3.5 sm:px-5">
          <Boxes aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
              {borradores.length}{" "}
              {borradores.length === 1 ? "borrador" : "borradores"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug opacity-70">
              {borradores.some((b) => b.inventado.length)
                ? "En gris, lo que propuso la IA. Tócalo para cambiarlo."
                : "Corrige lo que haga falta antes de crearlos."}
            </p>
          </div>
        </header>

        {borradores.length > 0 ? (
          <div
            role="group"
            aria-label="Filtrar borradores"
            className="-mb-px flex gap-1.5 overflow-x-auto border-b border-tinta/15 px-4 py-3 sm:px-5"
          >
            {fichas.map((ficha) => (
              <button
                key={ficha.valor}
                type="button"
                aria-pressed={filtro === ficha.valor}
                onClick={() => setFiltro(ficha.valor)}
                className={cn(
                  FICHA,
                  "shrink-0 whitespace-nowrap",
                  filtro === ficha.valor ? FICHA_ELEGIDA : FICHA_LIBRE
                )}
              >
                {ficha.nombre}
                <span className="tabular ml-1.5 opacity-65">
                  {ficha.cuenta}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <ul ref={lista}>
          {visibles.map((borrador) => (
            <FilaDeBorrador
              key={borrador.id}
              borrador={borrador}
              repetido={yaExisten.has(borrador.id) && omitirRepetidos}
              omitido={omitido(borrador)}
              crearIgual={() => crearIgual(borrador.id)}
              alAbrir={() => alAbrir(borrador.id)}
              alCambiar={(cambio) => alCambiar(borrador.id, cambio)}
              alQuitar={() => alQuitar(borrador.id)}
              alSiguiente={() => {
                const precios = [
                  ...(lista.current?.querySelectorAll<HTMLInputElement>(
                    "input[data-precio]"
                  ) ?? []),
                ]
                const actual = precios.findIndex(
                  (p) => p.dataset.precio === borrador.id
                )
                precios[actual + 1]?.focus()
              }}
            />
          ))}
          {procesando ? (
            <li
              aria-hidden="true"
              className="flex flex-col gap-2 border-t border-tinta/15 px-4 py-4 first:border-t-0"
            >
              <span className="h-4 w-1/2 animate-pulse bg-tinta/10" />
              <span className="h-4 w-1/3 animate-pulse bg-tinta/10" />
            </li>
          ) : null}
          {!procesando && visibles.length === 0 ? (
            <li className="px-4 py-6 text-sm text-tinta/70 sm:px-5">
              {filtro === "todos"
                ? "No quedó ningún borrador."
                : "Ninguno en este filtro."}
            </li>
          ) : null}
        </ul>
        {!procesando ? (
          <button
            type="button"
            onClick={alAgregarMas}
            className="flex min-h-14 w-full items-center gap-3 border-t border-tinta/15 px-4 text-left font-semibold transition-colors hover:bg-tinta/[0.04] sm:px-5"
          >
            <ImagePlus aria-hidden="true" className="size-5" />
            Sumar más
          </button>
        ) : null}
      </section>
    </>
  )
}

function FilaDeBorrador({
  borrador,
  repetido,
  omitido,
  crearIgual,
  alAbrir,
  alCambiar,
  alQuitar,
  alSiguiente,
}: {
  borrador: Borrador
  repetido: boolean
  omitido: boolean
  crearIgual: () => void
  alAbrir: () => void
  alCambiar: (cambio: Partial<Borrador>) => void
  alQuitar: () => void
  alSiguiente: () => void
}) {
  const falta = faltaEn(borrador)
  const escrito = (valor: number | null) =>
    valor === null ? "" : String(valor).replace(".", ",")
  const [precio, setPrecio] = React.useState(escrito(borrador.precio))
  // Si el precio cambió en la hoja del borrador, la fila lo muestra.
  const [anterior, setAnterior] = React.useState(borrador.precio)
  if (anterior !== borrador.precio) {
    setAnterior(borrador.precio)
    const actual = Number(precio.replace(",", "."))
    if (!precio || actual !== borrador.precio) {
      setPrecio(escrito(borrador.precio))
    }
  }

  return (
    <li
      className={cn(
        "flex gap-3 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5",
        omitido && "opacity-55"
      )}
    >
      <button
        type="button"
        onClick={alAbrir}
        aria-label={`Editar ${borrador.nombre || "este borrador"}`}
        className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden border border-tinta/15 bg-tinta/[0.05]"
      >
        {borrador.fotos[0] ? (
          <Image
            src={borrador.fotos[0]}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <Package aria-hidden="true" className="size-5 opacity-35" />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={alAbrir}
            className="min-w-0 flex-1 text-left"
          >
            <span
              className={cn(
                "block truncate font-semibold",
                !borrador.nombre && "text-senal",
                borrador.inventado.includes("nombre") && "text-tinta/65"
              )}
            >
              {borrador.nombre || "Falta el nombre"}
            </span>
            <span
              className={cn(
                "block truncate text-sm",
                borrador.inventado.includes("categoria")
                  ? "text-tinta/55"
                  : "text-tinta/70"
              )}
            >
              {borrador.categoria ?? "Sin categoría"}
              {/* La duda de la IA solo si de verdad falta algo: el stock, por
                  ejemplo, ya va en 1. */}
              {borrador.duda && falta ? ` · ${borrador.duda}` : ""}
            </span>
            {borrador.opciones.map((opcion) => (
              <span
                key={opcion.nombre}
                className="block truncate text-sm font-semibold"
              >
                {opcion.nombre}: {opcion.valores.join(" · ")}
              </span>
            ))}
          </button>
          <button
            type="button"
            onClick={alQuitar}
            aria-label={`Quitar ${borrador.nombre || "este borrador"}`}
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center text-tinta/65 transition-colors hover:text-tinta"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        {omitido ? (
          <p className="text-sm">
            Ya tienes un producto con este nombre. Se omite.{" "}
            <button
              type="button"
              onClick={crearIgual}
              className="min-h-11 font-semibold underline underline-offset-4"
            >
              Crear igual
            </button>
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <label
              className={cn(
                "flex min-h-11 min-w-0 flex-1 items-center gap-1.5 border-b",
                falta === "precio" ? "border-senal" : "border-tinta"
              )}
            >
              <span className="text-sm font-semibold opacity-65">
                {CURRENCY_SYMBOL}
              </span>
              <span className="sr-only">Precio de {borrador.nombre}</span>
              <input
                data-precio={borrador.id}
                inputMode="decimal"
                enterKeyHint="next"
                value={precio}
                placeholder="Precio"
                onChange={(evento) => {
                  const texto = evento.target.value.replace(/[^\d.,]/g, "")
                  setPrecio(texto)
                  const valor = Number(texto.replace(",", "."))
                  alCambiar({
                    precio: texto && Number.isFinite(valor) ? valor : null,
                  })
                }}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter") {
                    evento.preventDefault()
                    alSiguiente()
                  }
                }}
                className="tabular h-11 min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-tinta/35"
              />
            </label>
            {borrador.variantes.length ? (
              <button
                type="button"
                onClick={alAbrir}
                className="tabular min-h-11 shrink-0 px-1 text-right text-sm font-semibold underline underline-offset-4"
              >
                {borrador.stock} en total
              </button>
            ) : (
              <Cantidad
                etiqueta={`Unidades de ${borrador.nombre}`}
                valor={borrador.stock}
                alCambiar={(stock) => alCambiar({ stock })}
                angosta
              />
            )}
          </div>
        )}
        {repetido && !omitido ? (
          <p className="text-xs text-tinta/65">
            Ya tienes uno con este nombre: se creará de todos modos.
          </p>
        ) : null}
      </div>
    </li>
  )
}

/* ---------------------------------------------------------------------------
 * Las hojas
 * ------------------------------------------------------------------------ */

function HojaDeLista({
  conIa,
  alCerrar,
  alFoto,
  alTexto,
}: {
  conIa: boolean
  alCerrar: () => void
  alFoto: () => void
  alTexto: (texto: string) => void
}) {
  const [escribiendo, setEscribiendo] = React.useState(false)
  const [texto, setTexto] = React.useState("")

  return (
    <HojaDeAjuste
      abierta
      titulo="Una lista escrita"
      descripcion="Un producto por renglón, con su precio si lo tiene."
      alCerrar={alCerrar}
      pie={
        escribiendo ? (
          <button
            type="button"
            disabled={texto.trim().length < 3}
            onClick={() => alTexto(texto)}
            className={cn(BOTON_PRIMARIO, "w-full")}
          >
            Armar productos
          </button>
        ) : undefined
      }
      sinListo={!escribiendo}
    >
      <div className="grid grid-cols-2 gap-2">
        <BotonDeLista
          icono={Camera}
          titulo="Foto de la lista"
          detalle={`Hasta ${LIMITES_DE_CARGA.paginas} páginas`}
          apagado={!conIa}
          alTocar={alFoto}
        />
        <BotonDeLista
          icono={Type}
          titulo="Escribirla"
          detalle="O pégala"
          elegido={escribiendo}
          apagado={!conIa}
          alTocar={() => setEscribiendo(true)}
        />
      </div>
      {escribiendo ? (
        <label className="mt-5 flex flex-col gap-2">
          <span className="sr-only">La lista</span>
          <Textarea
            autoFocus
            rows={7}
            value={texto}
            maxLength={LIMITES_DE_CARGA.caracteresDeLista}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder={
              "Polera Nike negra 180\nShort deportivo 90\nZapatilla Puma 350"
            }
            className={cn("min-h-40 resize-y py-3", CAMPO)}
          />
          <span className="text-xs text-tinta/65">
            Puedes dictarla con el micrófono del teclado.
          </span>
        </label>
      ) : null}
    </HojaDeAjuste>
  )
}

function BotonDeLista({
  icono: Icono,
  titulo,
  detalle,
  elegido = false,
  apagado = false,
  alTocar,
}: {
  icono: LucideIcon
  titulo: string
  detalle: string
  elegido?: boolean
  apagado?: boolean
  alTocar: () => void
}) {
  return (
    <button
      type="button"
      onClick={apagado ? undefined : alTocar}
      aria-disabled={apagado}
      aria-pressed={elegido}
      className={cn(
        "flex min-h-24 flex-col items-start justify-between gap-2 border p-3 text-left transition-colors",
        elegido
          ? "border-tinta bg-tinta text-papel"
          : "border-tinta/25 hover:border-tinta",
        apagado && "cursor-not-allowed opacity-45"
      )}
    >
      <Icono aria-hidden="true" className="size-5" />
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        <span
          className={cn(
            "block text-xs",
            elegido ? "text-papel/75" : "text-tinta/65"
          )}
        >
          {detalle}
        </span>
      </span>
    </button>
  )
}

function HojaDeBorrador({
  borrador,
  categorias,
  leidoDe,
  alCambiar,
  alQuitar,
  alCerrar,
}: {
  borrador: Borrador | null
  categorias: string[]
  /** Si salió de una tabla leída por columnas, de cuál. */
  leidoDe: "planilla" | "lista" | null
  alCambiar: (cambio: Partial<Borrador>) => void
  alQuitar: () => void
  alCerrar: () => void
}) {
  const [nueva, setNueva] = React.useState("")
  if (!borrador) return null

  return (
    <HojaDeAjuste
      abierta
      titulo={borrador.nombre || "Nuevo producto"}
      descripcion={
        borrador.inventado.length
          ? "Lo propuso la IA. Cámbialo si hace falta."
          : leidoDe
            ? `Así lo leímos de tu ${leidoDe}.`
            : "Cámbialo si hace falta."
      }
      alCerrar={alCerrar}
    >
      {borrador.fotos[0] ? (
        <span className="relative mb-5 block aspect-square w-40 overflow-hidden border border-tinta/15">
          <Image
            src={borrador.fotos[0]}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
          />
        </span>
      ) : null}
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
          Nombre
        </span>
        <input
          value={borrador.nombre}
          maxLength={120}
          onChange={(evento) => alCambiar({ nombre: evento.target.value })}
          className={cn(CAMPO_LINEA, "w-full text-lg font-semibold")}
        />
      </label>
      <div className="mt-6">
        <CampoMonto
          id={`precio-${borrador.id}`}
          etiqueta="Precio"
          valor={borrador.precio}
          alCambiar={(precio) => alCambiar({ precio })}
        />
      </div>
      <fieldset className="mt-6">
        <legend className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
          Categoría
        </legend>
        <div className={cn(GRILLA_DE_FICHAS, "mt-2")}>
          {categorias.map((categoria) => (
            <button
              key={categoria}
              type="button"
              aria-pressed={borrador.categoria === categoria}
              onClick={() =>
                alCambiar({
                  categoria:
                    borrador.categoria === categoria ? null : categoria,
                })
              }
              className={cn(
                FICHA,
                "w-full justify-center",
                borrador.categoria === categoria ? FICHA_ELEGIDA : FICHA_LIBRE
              )}
            >
              <span className="truncate">{categoria}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <input
            value={nueva}
            maxLength={60}
            placeholder="Otra categoría"
            onChange={(evento) => setNueva(evento.target.value)}
            className={cn(CAMPO_LINEA, "min-w-0 flex-1")}
          />
          <button
            type="button"
            disabled={!nueva.trim()}
            onClick={() => {
              alCambiar({ categoria: nueva.trim() })
              setNueva("")
            }}
            className="min-h-11 px-3 text-sm font-semibold underline underline-offset-4 disabled:opacity-40"
          >
            Usar
          </button>
        </div>
      </fieldset>
      <label className="mt-6 flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
          Descripción
        </span>
        <Textarea
          rows={3}
          value={borrador.descripcion}
          maxLength={600}
          onChange={(evento) => alCambiar({ descripcion: evento.target.value })}
          className={cn("min-h-20 resize-y py-3", CAMPO)}
        />
      </label>
      {borrador.variantes.length ? (
        <fieldset className="mt-6">
          <legend className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            Unidades de cada una
          </legend>
          <ul className="mt-2">
            {borrador.variantes.map((variante, indice) => {
              const nombre = Object.values(variante.valores).join(" · ")
              return (
                <li
                  key={nombre}
                  className="flex items-center gap-3 border-t border-tinta/15 py-2 first:border-t-0"
                >
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {nombre}
                  </span>
                  <Cantidad
                    etiqueta={`Unidades de ${nombre}`}
                    valor={variante.stock}
                    alCambiar={(stock) => {
                      const variantes = borrador.variantes.map((v, i) =>
                        i === indice ? { ...v, stock } : v
                      )
                      alCambiar({
                        variantes,
                        stock: variantes.reduce((t, v) => t + v.stock, 0),
                      })
                    }}
                    angosta
                  />
                </li>
              )
            })}
          </ul>
        </fieldset>
      ) : null}
      <button
        type="button"
        onClick={alQuitar}
        className="mt-4 flex min-h-11 items-center self-start text-sm font-semibold underline underline-offset-4"
      >
        Quitar este borrador
      </button>
    </HojaDeAjuste>
  )
}

/** Ya hizo el recorrido por las columnas de su primera planilla. */
const RECORRIDO_HECHO = "venduo:carga-recorrido"

const CON_ARTICULO: Record<CampoDeCarga, string> = {
  nombre: "el nombre",
  precio: "el precio",
  stock: "el stock",
  categoria: "la categoría",
  talla: "la talla",
  color: "el color",
  descripcion: "la descripción",
  codigo: "el código",
  costo: "el costo",
}

/**
 * Las filas quitadas quedan vacías, no se borran: así la fila de los
 * encabezados sigue en su lugar, y una fila vacía no arma ningún producto.
 */
function sinExcluidas(filas: Filas, excluidas: number[]): Filas {
  if (!excluidas.length) return filas
  const quitadas = new Set(excluidas)
  return filas.map((fila, indice) => (quitadas.has(indice) ? [] : fila))
}

/**
 * Así leímos tu planilla: todas sus filas, con lo que es cada columna encima.
 * Lo que la lectura no supo se pregunta de a una columna, enmarcada en la
 * tabla: primero lo más probable —"¿es la talla?"— y, si no, todas las
 * opciones. Tocar una columna permite cambiarla aunque estuviera segura, y
 * cada fila tiene su casilla para no cargarla.
 */
function LecturaDePlanilla({
  filas,
  lectura,
  excluidas,
  de,
  alCambiar,
  alExcluir,
  alConfirmar,
}: {
  filas: Filas
  lectura: Lectura
  excluidas: number[]
  de: "planilla" | "lista"
  alCambiar: (lectura: Lectura) => void
  alExcluir: (excluidas: number[]) => void
  alConfirmar: (lectura: Lectura) => void
}) {
  // La primera vez se recorren todas las columnas, aunque la lectura esté
  // segura: así se aprende cómo funciona.
  const [recorrido] = React.useState(() => {
    try {
      return !localStorage.getItem(RECORRIDO_HECHO)
    } catch {
      return false
    }
  })
  const [revisadas, setRevisadas] = React.useState<Set<number>>(new Set())
  const porRevisar = (c: ColumnaLeida, hechas = revisadas) =>
    !c.seguro || (recorrido && !hechas.has(c.columna))
  const pendientes = lectura.columnas.filter((c) => porRevisar(c))
  const [activa, setActiva] = React.useState<number | null>(
    pendientes[0]?.columna ?? null
  )
  const [todas, setTodas] = React.useState(false)
  const tabla = React.useRef<HTMLDivElement>(null)
  // Cuando la tabla no entra: qué bordes tienen columnas detrás.
  const [hayMas, setHayMas] = React.useState({
    izquierda: false,
    derecha: false,
  })

  React.useEffect(() => {
    const caja = tabla.current
    if (!caja) return
    const medir = () => {
      const izquierda = caja.scrollLeft > 1
      const derecha = caja.scrollLeft + caja.clientWidth < caja.scrollWidth - 1
      setHayMas((antes) =>
        antes.izquierda === izquierda && antes.derecha === derecha
          ? antes
          : { izquierda, derecha }
      )
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(caja)
    caja.addEventListener("scroll", medir, { passive: true })
    return () => {
      observador.disconnect()
      caja.removeEventListener("scroll", medir)
    }
  }, [])

  // La columna en duda puede estar fuera de la vista: la tabla se desliza
  // hasta ella.
  React.useEffect(() => {
    if (activa === null) return
    tabla.current?.querySelector(`[data-columna="${activa}"]`)?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    })
  }, [activa])

  const encabezado =
    lectura.filaDeEncabezado === null ? null : filas[lectura.filaDeEncabezado]
  const inicio =
    lectura.filaDeEncabezado === null ? 0 : lectura.filaDeEncabezado + 1
  // Cada fila con su número en la planilla: es lo que se guarda al quitarla.
  const renglones = filas
    .map((fila, indice) => ({ fila, indice }))
    .slice(inicio)
    .filter(({ fila }) => fila.some((celda) => celda.trim()))
  const datos = renglones.map(({ fila }) => fila)
  const quitadas = new Set(excluidas)
  const elegidas =
    renglones.length - renglones.filter((r) => quitadas.has(r.indice)).length
  const productos = React.useMemo(
    () =>
      aplicarMapeo(sinExcluidas(filas, excluidas), mapeoDeLectura(lectura))
        .length,
    [filas, excluidas, lectura]
  )

  function alternarFila(indice: number) {
    alExcluir(
      quitadas.has(indice)
        ? excluidas.filter((i) => i !== indice)
        : [...excluidas, indice]
    )
  }
  const sinNombre = !lectura.columnas.some((c) => c.campo === "nombre")
  const columna = lectura.columnas.find((c) => c.columna === activa) ?? null
  const muestra = columna
    ? [
        ...new Set(
          datos.map((f) => f[columna.columna]?.trim()).filter(Boolean)
        ),
      ].slice(0, 4)
    : []

  function responder(campo: CampoDeCarga | null) {
    if (activa === null) return
    const nueva = asignarCampo(lectura, activa, campo)
    const hechas = new Set(revisadas).add(activa)
    alCambiar(nueva)
    setRevisadas(hechas)
    setTodas(false)
    setActiva(
      nueva.columnas.find((c) => porRevisar(c, hechas))?.columna ?? null
    )
  }

  function elegir(numero: number) {
    if (activa === numero) {
      setActiva(null)
      return
    }
    const elegida = lectura.columnas.find((c) => c.columna === numero)
    setActiva(numero)
    // Una columna ya revisada se toca para cambiarla: abre las opciones.
    setTodas(!elegida || !porRevisar(elegida))
  }

  function cerrarOpciones() {
    setTodas(false)
    if (columna && !porRevisar(columna)) setActiva(null)
  }

  const pendiente = columna ? porRevisar(columna) : false
  // Lo propuesto se confirma con un sí; sin propuesta, se eligen las opciones.
  const siOno = columna !== null && (columna.campo !== null || columna.seguro)
  const nombreDe = (c: ColumnaLeida) => {
    const titulo = encabezado?.[c.columna]?.trim()
    return titulo ? `«${titulo}»` : `la columna ${letraDeColumna(c.columna)}`
  }
  const conMayuscula = (texto: string) =>
    texto.charAt(0).toUpperCase() + texto.slice(1)

  const enmarcada = (numero: number, ultima = false) =>
    activa === numero &&
    cn(
      "border-x-2 border-x-senal bg-senal/[0.06]",
      ultima && "border-b-2 border-b-senal"
    )

  return (
    <>
      <section className="min-w-0 border border-tinta">
        <header className="flex items-start gap-3 border-b border-tinta/15 px-4 py-3.5 sm:px-5">
          <FileSpreadsheet
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
              Así leímos tu {de}
            </h2>
          </div>
        </header>

        <div className="flex min-h-12 items-center gap-3 border-b border-tinta/15 px-4 sm:px-5">
          <p className="tabular min-w-0 flex-1 text-sm">
            <strong className="font-semibold">
              {elegidas} de {renglones.length}
            </strong>{" "}
            {renglones.length === 1 ? "fila" : "filas"}
            <span className="max-sm:hidden">
              {renglones.length === 1 ? " se carga" : " se cargan"}
            </span>
          </p>
          {hayMas.izquierda || hayMas.derecha ? (
            <div className="flex gap-1.5">
              <FlechaDeTabla
                lado="izquierda"
                apagada={!hayMas.izquierda}
                alTocar={() =>
                  tabla.current?.scrollBy({
                    left: -tabla.current.clientWidth * 0.7,
                    behavior: "smooth",
                  })
                }
              />
              <FlechaDeTabla
                lado="derecha"
                apagada={!hayMas.derecha}
                alTocar={() =>
                  tabla.current?.scrollBy({
                    left: tabla.current.clientWidth * 0.7,
                    behavior: "smooth",
                  })
                }
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() =>
              alExcluir(
                elegidas === renglones.length
                  ? renglones.map((r) => r.indice)
                  : []
              )
            }
            className="min-h-11 shrink-0 text-sm font-semibold underline underline-offset-4"
          >
            {elegidas === renglones.length
              ? "Quitar todas"
              : "Seleccionar todas"}
          </button>
        </div>

        <div className="relative isolate">
          {/* Un borde con columnas detrás se desvanece. El de la izquierda
              empieza después de las casillas, que quedan fijas. */}
          {hayMas.izquierda ? (
            <div className="pointer-events-none absolute inset-y-0 left-11 z-30 w-8 bg-gradient-to-r from-papel to-transparent" />
          ) : null}
          {hayMas.derecha ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-8 bg-gradient-to-l from-papel to-transparent" />
          ) : null}
          {/* El fondo opaco no es decorativo: Chrome dibuja esta tabla en su
              propia capa y, sin fondo, en Windows las letras se veían en
              negrita hasta que algo la volvía a dibujar. */}
          <div
            ref={tabla}
            className="max-h-[min(60vh,32rem)] overflow-auto overscroll-contain bg-papel"
          >
            <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky top-0 left-0 z-20 w-11 border-b border-tinta/15 bg-papel p-0"
                  >
                    <span className="sr-only">Cargar</span>
                  </th>
                  {lectura.columnas.map((c) => {
                    const nombre =
                      encabezado?.[c.columna]?.trim() ||
                      `Columna ${letraDeColumna(c.columna)}`
                    return (
                      <th
                        key={c.columna}
                        data-columna={c.columna}
                        scope="col"
                        className={cn(
                          "sticky top-0 z-10 border-b border-tinta/15 bg-papel p-0 text-left align-top font-normal",
                          activa === c.columna &&
                            "border-x-2 border-t-2 border-senal"
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={activa === c.columna}
                          aria-label={`${nombre}: ${c.campo ? tituloDeCampo(c.campo) : "no se usa"}${c.seguro ? "" : ", sin confirmar"}`}
                          onClick={() => elegir(c.columna)}
                          className={cn(
                            "group flex w-full min-w-28 cursor-pointer flex-col items-start gap-1.5 px-3 py-2.5 transition-colors",
                            activa === c.columna
                              ? "bg-senal/[0.06]"
                              : "hover:bg-tinta/[0.05]"
                          )}
                        >
                          <span className="max-w-40 truncate text-xs text-tinta/65">
                            {nombre}
                          </span>
                          <span
                            className={cn(
                              "flex min-h-8 items-center gap-1.5 border pr-1.5 pl-2 text-xs font-semibold whitespace-nowrap transition-colors",
                              !c.seguro
                                ? "border-dashed border-senal text-senal"
                                : c.campo
                                  ? "border-tinta bg-tinta text-papel"
                                  : "border-tinta/40 text-tinta/65 group-hover:border-tinta"
                            )}
                          >
                            {c.campo
                              ? `${tituloDeCampo(c.campo)}${c.seguro ? "" : " ¿?"}`
                              : c.seguro
                                ? "No se usa"
                                : "¿Qué es?"}
                            <ChevronDown
                              aria-hidden="true"
                              className={cn(
                                "size-3.5 shrink-0 transition-transform",
                                activa === c.columna && "rotate-180"
                              )}
                            />
                          </span>
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {renglones.map(({ fila, indice }, orden) => {
                  const quitada = quitadas.has(indice)
                  return (
                    <tr key={indice}>
                      <td className="sticky left-0 z-[5] border-t border-tinta/10 bg-papel p-0">
                        <label className="flex size-11 cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            checked={!quitada}
                            onChange={() => alternarFila(indice)}
                            aria-label={`Cargar la fila ${indice + 1}${fila[0] ? `, ${fila[0]}` : ""}`}
                            className="size-5 cursor-pointer"
                          />
                        </label>
                      </td>
                      {lectura.columnas.map((c) => (
                        <td
                          key={c.columna}
                          title={fila[c.columna]?.trim() || undefined}
                          className={cn(
                            "border-t border-tinta/10 px-3 py-2 align-top transition-colors",
                            (quitada ||
                              (c.campo === null && activa !== c.columna)) &&
                              "text-tinta/35",
                            enmarcada(c.columna, orden === renglones.length - 1)
                          )}
                        >
                          <div className="line-clamp-2 w-max max-w-56">
                            {fila[c.columna]?.trim() || (
                              <span className="text-tinta/30">—</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {columna ? null : (
          <div className="flex items-start gap-3 border-t border-tinta px-4 py-4 sm:px-5">
            <Pointer aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Cambiar una columna</p>
              <p className="mt-0.5 text-sm leading-snug text-tinta/70">
                Toca su etiqueta y elige el tipo correcto. Las columnas «No se
                usa» no se cargan.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* La pregunta va en la barra de abajo, a mano del pulgar: arriba
          queda la tabla, con la columna enmarcada. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-tinta bg-papel px-4 py-3 lg:sticky lg:bottom-0 lg:border lg:px-5">
        {columna && pendiente ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <p className="min-w-0 flex-1 font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
                {!siOno
                  ? `¿Qué hay en ${nombreDe(columna)}?`
                  : columna.campo
                    ? `¿${conMayuscula(nombreDe(columna))} es ${CON_ARTICULO[columna.campo]}?`
                    : `¿${conMayuscula(nombreDe(columna))} no se usa?`}
              </p>
              {recorrido ? (
                <span className="tabular shrink-0 text-xs font-semibold text-tinta/65">
                  {lectura.columnas.indexOf(columna) + 1} de{" "}
                  {lectura.columnas.length}
                </span>
              ) : null}
            </div>
            {siOno ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => responder(columna.campo)}
                  className={cn(BOTON_PRIMARIO, "px-3")}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setTodas(true)}
                  className={cn(BOTON_SECUNDARIO, "px-3 whitespace-nowrap")}
                >
                  No, es otra cosa
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTodas(true)}
                className={BOTON_PRIMARIO}
              >
                Elegir qué es
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p
              className={cn(
                "min-w-0 flex-1 text-xs font-semibold tracking-[0.12em] uppercase",
                pendientes.length || sinNombre ? "text-senal" : "opacity-65"
              )}
            >
              {pendientes.length
                ? `${pendientes.length} ${pendientes.length === 1 ? "pregunta" : "preguntas"}`
                : sinNombre
                  ? "Falta la columna de los nombres"
                  : "Todo leído"}
            </p>
            <button
              type="button"
              disabled={pendientes.length > 0 || sinNombre || productos === 0}
              onClick={() => {
                try {
                  localStorage.setItem(RECORRIDO_HECHO, "1")
                } catch {
                  // Sin almacenamiento, el recorrido vuelve la próxima vez.
                }
                alConfirmar(lectura)
              }}
              className={cn(BOTON_PRIMARIO, "min-h-12 shrink-0 px-5")}
            >
              {pendientes.length
                ? `Responde ${pendientes.length === 1 ? "la pregunta" : `las ${pendientes.length}`}`
                : sinNombre
                  ? "Elige los nombres"
                  : elegidas === 0
                    ? "Selecciona alguna fila"
                    : `Está bien: ver ${productos} ${productos === 1 ? "producto" : "productos"}`}
            </button>
          </div>
        )}
      </div>

      {columna && todas ? (
        <HojaDeAjuste
          abierta
          titulo={`¿Qué hay en ${nombreDe(columna)}?`}
          descripcion="Si no la necesitas para tus productos, toca «No la uses»."
          alCerrar={cerrarOpciones}
        >
          {muestra.length ? (
            <p className="-mt-2 mb-4 truncate text-sm text-tinta/70">
              {muestra.join(" · ")}
            </p>
          ) : null}
          <div className={GRILLA_DE_FICHAS}>
            {[
              ...CAMPOS_DE_CARGA,
              { campo: null, titulo: "No la uses" } as const,
            ].map(({ campo, titulo }) => {
              const actual = columna.seguro && columna.campo === campo
              return (
                <button
                  key={campo ?? "ninguno"}
                  type="button"
                  aria-pressed={actual}
                  onClick={() => responder(campo)}
                  className={cn(
                    FICHA,
                    "w-full justify-center",
                    actual ? FICHA_ELEGIDA : FICHA_LIBRE
                  )}
                >
                  <span className="truncate">{titulo}</span>
                </button>
              )
            })}
          </div>
        </HojaDeAjuste>
      ) : null}
    </>
  )
}

/** Desliza la tabla de la planilla hacia un lado; sin más columnas, se apaga. */
function FlechaDeTabla({
  lado,
  apagada,
  alTocar,
}: {
  lado: "izquierda" | "derecha"
  apagada: boolean
  alTocar: () => void
}) {
  const Icono = lado === "izquierda" ? ArrowLeft : ArrowRight
  return (
    <button
      type="button"
      aria-label={
        lado === "izquierda" ? "Ver columnas anteriores" : "Ver más columnas"
      }
      disabled={apagada}
      onClick={alTocar}
      className="flex size-9 shrink-0 items-center justify-center border border-tinta bg-papel transition-colors hover:bg-tinta hover:text-papel disabled:border-tinta/20 disabled:text-tinta/30 disabled:hover:bg-papel"
    >
      <Icono aria-hidden="true" className="size-4" />
    </button>
  )
}
