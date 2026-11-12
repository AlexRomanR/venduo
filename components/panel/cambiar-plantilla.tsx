"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { EstadoDeFuncion } from "@/lib/funciones"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import type { CambioDePlantilla } from "@/app/(privado)/panel/apariencia/acciones"
import { HojaDeAjuste } from "@/components/panel/ajustes"
import { ConFuncion } from "@/components/panel/funcion"
import {
  PasarelaDePlantillas,
  type ControlDePasarela,
  type PlantillaDeLaPasarela,
} from "@/components/panel/pasarela-de-plantillas"

export type { PlantillaDeLaPasarela }

/**
 * La pasarela de Apariencia: la pieza común (`PasarelaDePlantillas`) con lo
 * suyo. Arranca en la plantilla de la tienda —"La tuya", con el editor a
 * mano— y las otras llevan "Usar X".
 *
 * "Usar X" abre la pregunta en una hoja: cambiar la plantilla cambia lo que ve
 * cada comprador en ese momento, y ofrece una sola decisión, conservar la
 * portada —lo seguro, porque sus textos pueden ser trabajo del emprendedor— o
 * empezar con la de la plantilla nueva. Las dos guardan antes el diseño.
 */
export function PasarelaDeApariencia({
  actual,
  otras,
  miniaturas,
  notas,
  urlDeTienda,
  editor,
  cambio,
  cambiar,
}: {
  /** La plantilla de la tienda; `nombre` ya dice "Plantilla anterior" si se retiró. */
  actual: PlantillaDeLaPasarela
  /** A las que se puede pasar. Vacía si Venduo ocultó el cambio de plantilla. */
  otras: PlantillaDeLaPasarela[]
  /** La de la tienda primero y después las otras, en el mismo orden, ya dibujadas. */
  miniaturas: React.ReactNode[]
  /** Lo que se aclara debajo del dibujo de las otras; "{plantilla}" lleva su nombre. */
  notas: string[]
  urlDeTienda: string
  editor: EstadoDeFuncion
  cambio: EstadoDeFuncion
  cambiar: (
    entrada: CambioDePlantilla
  ) => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const pasarela = React.useRef<ControlDePasarela>(null)
  const todas = React.useMemo(() => [actual, ...otras], [actual, otras])
  const [vista, setVista] = React.useState(actual)
  const [preguntando, setPreguntando] = React.useState(false)
  const [conservar, setConservar] = React.useState(true)
  const [enCurso, setEnCurso] = React.useState(false)
  const esLaTuya = vista.clave === actual.clave

  async function usar() {
    setEnCurso(true)
    const resultado = await cambiar({
      clave: vista.clave,
      conservarSecciones: conservar,
    })
    setEnCurso(false)

    if (!resultado.ok) {
      toast.error(
        resultado.error ??
          "No pudimos cambiar la plantilla. Inténtalo de nuevo."
      )
      return
    }

    setPreguntando(false)
    toast.success(`Tu tienda ahora usa ${vista.nombre}.`)
    // Vuelve a la primera: ahí queda la nueva, ya como la tuya.
    pasarela.current?.alPrincipio()
    router.refresh()
  }

  return (
    <>
      <PasarelaDePlantillas
        ref={pasarela}
        plantillas={todas}
        miniaturas={miniaturas}
        notas={notas}
        marcaDeLaPrimera="La tuya"
        bloqueada={enCurso}
        alCambiar={(nueva) => setVista(nueva)}
        acciones={(enVista, indice) =>
          // Dos columnas iguales: a su ancho, los botones bajaban de renglón.
          indice === 0 ? (
            <div
              className={cn(
                "grid w-full gap-2 sm:max-w-[26rem]",
                editor === "oculta" ? "grid-cols-1" : "grid-cols-2"
              )}
            >
              {editor !== "oculta" ? (
                <ConFuncion estado={editor}>
                  <Link
                    href="/editor"
                    className={cn(BOTON_PRIMARIO, "w-full px-4 text-sm")}
                  >
                    Abrir el editor
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </ConFuncion>
              ) : null}
              <a
                href={urlDeTienda}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(BOTON_SECUNDARIO, "w-full px-4 text-sm")}
              >
                Ver tienda
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </div>
          ) : (
            <div className="w-full sm:max-w-[26rem]">
              <ConFuncion estado={cambio}>
                <button
                  type="button"
                  onClick={() => {
                    setConservar(true)
                    setPreguntando(true)
                  }}
                  className={cn(BOTON_PRIMARIO, "w-full")}
                >
                  Usar {enVista.nombre}
                </button>
              </ConFuncion>
            </div>
          )
        }
      />

      {esLaTuya ? null : (
        <HojaDeAjuste
          abierta={preguntando}
          titulo={`¿Pasar a ${vista.nombre}?`}
          descripcion="Cambia cómo se ve tu tienda. Antes de cambiar guardamos cómo estaba."
          alCerrar={() => {
            if (!enCurso) setPreguntando(false)
          }}
          pie={
            <button
              type="button"
              onClick={usar}
              disabled={enCurso}
              className={cn(BOTON_PRIMARIO, "w-full")}
            >
              {enCurso ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              Usar {vista.nombre}
            </button>
          }
        >
          {vista.rasgos.length > 0 ? (
            <ul className="border-t border-tinta/15">
              {vista.rasgos.map((rasgo) => (
                <li
                  key={rasgo}
                  className="border-b border-tinta/15 py-2.5 text-sm text-tinta/80"
                >
                  {rasgo}
                </li>
              ))}
            </ul>
          ) : null}
          <fieldset>
            <legend className="text-xs font-semibold tracking-[0.12em] text-tinta/65 uppercase">
              Tu portada
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              <Opcion
                nombre={`portada-${vista.clave}`}
                activa={conservar}
                onElegir={() => setConservar(true)}
                titulo="Conservar la mía"
                texto="Tus textos y el orden quedan igual; cambia solo cómo se ven."
              />
              <Opcion
                nombre={`portada-${vista.clave}`}
                activa={!conservar}
                onElegir={() => setConservar(false)}
                titulo={`Empezar con la de ${vista.nombre}`}
                texto={`Tu portada se arma con las secciones de ${vista.nombre}.`}
              />
            </div>
          </fieldset>
        </HojaDeAjuste>
      )}
    </>
  )
}

function Opcion({
  nombre,
  activa,
  onElegir,
  titulo,
  texto,
}: {
  nombre: string
  activa: boolean
  onElegir: () => void
  titulo: string
  texto: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[14px] border p-4 transition-colors",
        activa
          ? "border-tinta bg-tinta/[0.04]"
          : "border-tinta/20 hover:border-tinta/50"
      )}
    >
      <input
        type="radio"
        name={nombre}
        checked={activa}
        onChange={onElegir}
        className="mt-1 size-4 shrink-0 accent-[var(--tinta)]"
      />
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="mt-1 block text-sm leading-relaxed text-tinta/70">
          {texto}
        </span>
      </span>
    </label>
  )
}

/**
 * El historial, corto: las últimas versiones a la vista y el resto a pedido,
 * con el botón al pie para que "Ver menos" no quede en medio de la lista.
 * Las filas llegan dibujadas del servidor.
 */
export function ListaDeVersiones({
  filas,
  aLaVista = 3,
}: {
  filas: React.ReactNode[]
  aLaVista?: number
}) {
  const [todas, setTodas] = React.useState(false)
  const corta = filas.length > aLaVista + 1
  const visibles = corta && !todas ? filas.slice(0, aLaVista) : filas
  const resto = filas.length - aLaVista

  return (
    <>
      <ol>{visibles}</ol>
      {corta ? (
        <button
          type="button"
          onClick={() => setTodas((antes) => !antes)}
          aria-expanded={todas}
          className="flex min-h-12 w-full items-center border-t border-tinta/15 px-4 text-sm font-semibold transition-colors hover:bg-tinta/[0.04] sm:px-5"
        >
          {todas
            ? "Ver menos"
            : resto === 1
              ? "Ver la anterior"
              : `Ver las ${resto} anteriores`}
        </button>
      ) : null}
    </>
  )
}
