"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CircleAlert,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney, formatNumber } from "@/lib/format"
import {
  leerPlanilla,
  MAXIMO_POR_PLANILLA,
  type FilaLeida,
} from "@/lib/importar"
import { construirPrecio, type Tramo } from "@/lib/precio"
import { cn } from "@/lib/utils"
import {
  CONDICIONES,
  filaImportadaSchema,
  type FilaImportada,
} from "@/lib/validation/producto"

interface Revisada {
  leida: FilaLeida
  valida: FilaImportada | null
  errores: string[]
}

/**
 * Cargar muchos productos de una vez, desde una planilla de Excel.
 *
 * Tres momentos en la misma pantalla: bajar la plantilla, subirla y revisar
 * antes de cargar. La revisión no es un trámite: muestra cada producto con el
 * precio al que va a quedar publicado, que es lo que un negocio quiere ver
 * antes de confirmar cuarenta productos a ciegas.
 *
 * El archivo se lee en el navegador y la biblioteca de Excel se carga recién
 * cuando se elige uno: pesa, y la mayoría de las visitas a esta pantalla no
 * suben nada todavía.
 */
export function ImportarPlanilla({
  tramos,
  categoriasExistentes,
  importar,
  destino,
}: {
  tramos: Tramo[]
  /** Los nombres ya creados, para marcar cuáles se van a crear. */
  categoriasExistentes: string[]
  importar: (
    filas: FilaImportada[]
  ) => Promise<{ ok: boolean; error?: string; creados?: number }>
  /** A dónde volver al terminar. */
  destino: string
}) {
  const router = useRouter()
  const entrada = React.useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = React.useState<string | null>(null)
  const [revisadas, setRevisadas] = React.useState<Revisada[]>([])
  const [problema, setProblema] = React.useState<string | null>(null)
  const [leyendo, setLeyendo] = React.useState(false)
  const [cargando, setCargando] = React.useState(false)

  const existentes = React.useMemo(
    () => new Set(categoriasExistentes.map((c) => c.toLowerCase())),
    [categoriasExistentes]
  )

  const validas = revisadas.filter((r) => r.valida !== null)
  const conErrores = revisadas.length - validas.length

  async function leer(file: File | undefined) {
    if (!file) return

    setLeyendo(true)
    setProblema(null)
    setRevisadas([])
    setArchivo(file.name)

    try {
      const { readSheet } = await import("read-excel-file/browser")
      const hoja = await readSheet(file)
      const { filas, faltan } = leerPlanilla(hoja)

      if (faltan.length > 0) {
        setProblema(
          `A la planilla le faltan columnas: ${faltan.join(", ")}. Usa la plantilla de Venduo o agrega esos títulos en la primera fila.`
        )
        return
      }
      if (filas.length === 0) {
        setProblema("La planilla no tiene productos debajo de los títulos.")
        return
      }
      if (filas.length > MAXIMO_POR_PLANILLA) {
        setProblema(
          `Tiene ${formatNumber(filas.length)} productos y el máximo por planilla es ${MAXIMO_POR_PLANILLA}. Divídela en varias.`
        )
        return
      }

      setRevisadas(filas.map(revisar))
    } catch {
      setProblema(
        "No pudimos leer ese archivo. Tiene que ser un Excel (.xlsx); si lo tienes en otro formato, ábrelo en Excel y guárdalo como .xlsx."
      )
    } finally {
      setLeyendo(false)
      if (entrada.current) entrada.current.value = ""
    }
  }

  async function cargar() {
    if (validas.length === 0 || cargando) return

    setCargando(true)
    const resultado = await importar(
      validas.map((r) => r.valida).filter((v): v is FilaImportada => v !== null)
    )
    setCargando(false)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos cargar los productos.")
      return
    }

    toast.success(
      `${formatNumber(resultado.creados ?? validas.length)} ${
        (resultado.creados ?? validas.length) === 1
          ? "producto cargado"
          : "productos cargados"
      }. Agrégales fotos cuando puedas.`
    )
    router.push(destino)
    router.refresh()
  }

  function reiniciar() {
    setArchivo(null)
    setRevisadas([])
    setProblema(null)
  }

  return (
    <div className="flex flex-col gap-10">
      <ol className="grid gap-6 border-t-2 border-tinta pt-6 sm:grid-cols-2">
        <li>
          <p className="tabular font-titular text-sm font-bold text-senal">
            01
          </p>
          <p className="mt-2 font-titular text-lg font-bold tracking-[-0.02em]">
            Baja la plantilla
          </p>
          <p className="mt-2 max-w-[44ch] text-sm leading-relaxed opacity-70">
            Una fila por producto. Trae una hoja de ejemplo y otra que explica
            cada columna.
          </p>
          <a
            href="/plantillas/productos-venduo.xlsx"
            download
            className={cn(BOTON_SECUNDARIO, "mt-5 w-full sm:w-auto")}
          >
            <Download aria-hidden="true" className="size-4" />
            Descargar plantilla
          </a>
        </li>

        <li>
          <p className="tabular font-titular text-sm font-bold text-senal">
            02
          </p>
          <p className="mt-2 font-titular text-lg font-bold tracking-[-0.02em]">
            Súbela llena
          </p>
          <p className="mt-2 max-w-[44ch] text-sm leading-relaxed opacity-70">
            Revisamos cada fila y te mostramos a cuánto queda publicado cada
            producto antes de cargar nada.
          </p>
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={leyendo || cargando}
            className={cn(BOTON_PRIMARIO, "mt-5 w-full sm:w-auto")}
          >
            {leyendo ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet aria-hidden="true" className="size-4" />
            )}
            {leyendo ? "Leyendo…" : "Subir mi Excel"}
          </button>
          <input
            ref={entrada}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => leer(e.target.files?.[0])}
          />
        </li>
      </ol>

      {problema ? (
        <div
          role="alert"
          className="flex gap-3 border-l-2 border-senal py-1 pl-4 text-sm leading-relaxed"
        >
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-senal"
          />
          <p>{problema}</p>
        </div>
      ) : null}

      {revisadas.length > 0 ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-tinta pb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
                {archivo}
              </p>
              <h2 className="mt-2 font-titular text-2xl font-extrabold tracking-[-0.03em]">
                {formatNumber(validas.length)}{" "}
                {validas.length === 1 ? "producto listo" : "productos listos"}
              </h2>
              {conErrores > 0 ? (
                <p className="mt-1 text-sm text-senal">
                  {formatNumber(conErrores)}{" "}
                  {conErrores === 1
                    ? "fila tiene un problema y no se va a cargar"
                    : "filas tienen problemas y no se van a cargar"}
                  . Corrígelas en el Excel y súbelo de nuevo, o sigue sin ellas.
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={reiniciar}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Subir otro
            </button>
          </div>

          <ul>
            {revisadas.map((r) => (
              <Fila
                key={r.leida.numero}
                revisada={r}
                tramos={tramos}
                categoriaNueva={
                  Boolean(r.leida.categoria) &&
                  !existentes.has(r.leida.categoria.toLowerCase())
                }
              />
            ))}
          </ul>

          <div className="sticky bottom-0 mt-6 flex flex-col gap-3 border-t-2 border-tinta bg-papel/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm opacity-70">
              Las fotos no van en el Excel: las agregas después desde cada
              producto.
            </p>
            <button
              type="button"
              onClick={cargar}
              disabled={validas.length === 0 || cargando}
              className={BOTON_PRIMARIO}
            >
              {cargando ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {conErrores > 0
                ? `Cargar las ${formatNumber(validas.length)} que están bien`
                : `Cargar ${formatNumber(validas.length)} ${validas.length === 1 ? "producto" : "productos"}`}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

/** Una fila revisada: lo que se entendió, a cuánto queda y qué falla. */
function Fila({
  revisada,
  tramos,
  categoriaNueva,
}: {
  revisada: Revisada
  tramos: Tramo[]
  categoriaNueva: boolean
}) {
  const { leida, valida, errores } = revisada
  const precio =
    leida.costoBase !== null && leida.costoBase > 0
      ? construirPrecio(Math.round(leida.costoBase * 100), tramos)
      : null
  const condicion = CONDICIONES.find((c) => c.valor === leida.condicion)

  return (
    <li
      className={cn(
        "grid gap-x-6 gap-y-2 border-b border-tinta/15 py-4 sm:grid-cols-[3rem_1fr_auto]",
        !valida && "bg-senal/[0.04]"
      )}
    >
      <span className="tabular text-xs font-semibold opacity-45 sm:pt-1">
        Fila {leida.numero}
      </span>

      <div className="min-w-0">
        <p className="font-titular font-bold tracking-[-0.01em]">
          {leida.nombre || <span className="opacity-40">Sin nombre</span>}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-65">
          <span>
            Stock{" "}
            {leida.stock !== null ? formatNumber(leida.stock) : "sin dato"}
          </span>
          <span>{condicion?.etiqueta ?? leida.condicionEscrita}</span>
          {leida.categoria ? (
            <span>
              {leida.categoria}
              {categoriaNueva ? (
                <span className="ml-1 font-semibold">(categoría nueva)</span>
              ) : null}
            </span>
          ) : null}
        </p>

        {errores.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1">
            {errores.map((error) => (
              <li key={error} className="text-sm text-senal">
                {error}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {precio ? (
        <div className="text-sm sm:text-right">
          <p className="opacity-65">Recibes {formatMoney(precio.baseCents)}</p>
          <p className="tabular font-titular text-lg font-extrabold tracking-[-0.02em]">
            {formatMoney(precio.precioCents)}
          </p>
          <p className="text-xs opacity-55">precio publicado</p>
        </div>
      ) : null}
    </li>
  )
}

function revisar(leida: FilaLeida): Revisada {
  const resultado = filaImportadaSchema.safeParse({
    nombre: leida.nombre,
    descripcion: leida.descripcion,
    costoBase: leida.costoBase ?? undefined,
    stock: leida.stock ?? undefined,
    categoria: leida.categoria,
    // Una condición que no se entendió se manda tal cual, para que el esquema
    // la rechace con su mensaje en vez de tomarla como "nuevo".
    condicion: leida.condicion ?? leida.condicionEscrita,
    notaCondicion: leida.notaCondicion,
    sku: leida.sku,
  })

  return resultado.success
    ? { leida, valida: resultado.data, errores: [] }
    : {
        leida,
        valida: null,
        errores: [...new Set(resultado.error.issues.map((i) => i.message))],
      }
}
