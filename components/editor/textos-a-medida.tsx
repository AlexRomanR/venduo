"use client"

import * as React from "react"
import Link from "next/link"
import { CircleAlert, RotateCw, WandSparkles } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import {
  aplicarCambios,
  type PropuestaDeTextos,
  type VistaDeTextos,
} from "@/lib/textos-a-medida"
import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"
import { Visto } from "@/components/portada/trazos"

export type AccionDeTextos =
  "publicar" | "descartar" | "usar-descripcion" | "volver-descripcion"

/** Decide sobre una propuesta. Devuelve el error, o `null` si salió bien. */
export async function decidirTextos(
  id: string,
  accion: AccionDeTextos
): Promise<string | null> {
  const mensaje = "No pudimos guardar tu decisión. Inténtalo de nuevo."
  try {
    const respuesta = await fetch(`/api/v1/ia/textos/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion }),
    })
    if (respuesta.ok) return null
    const datos = (await respuesta.json()) as { error?: string }
    return datos.error ?? mensaje
  } catch {
    return mensaje
  }
}

/**
 * Pide la propuesta de textos. Va por una ruta y no por una Server Action: las
 * acciones corren en fila, y esta espera a la IA.
 */
export function useTextosAMedida(activo: boolean) {
  const [vista, setVista] = React.useState<VistaDeTextos | null>(null)
  const [espera, setEspera] = React.useState(0)
  const [fallos, setFallos] = React.useState(0)

  const pedir = React.useCallback(async (reintentar: boolean) => {
    setVista(null)
    setEspera(0)
    const avisos = [
      // La mayoría de las veces no hay nada que mostrar y responde enseguida:
      // la tarjeta aparece solo si de verdad está escribiendo.
      window.setTimeout(() => setEspera(1), 1200),
      window.setTimeout(() => setEspera(2), 15_000),
    ]
    let leida: VistaDeTextos = { estado: "error" }
    try {
      const respuesta = await fetch("/api/v1/ia/textos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reintentar }),
      })
      if (respuesta.ok) leida = (await respuesta.json()) as VistaDeTextos
    } catch {
      // Sin conexión: se ofrece reintentar.
    }
    avisos.forEach((aviso) => window.clearTimeout(aviso))
    setVista(leida)
    if (leida.estado === "error") setFallos((n) => n + 1)
  }, [])

  // Cada pedido gasta una llamada a la IA: el modo estricto de React corre el
  // efecto dos veces y sin esto serían dos.
  const pedida = React.useRef(false)
  React.useEffect(() => {
    if (!activo) {
      pedida.current = false
    } else if (!pedida.current) {
      pedida.current = true
      void pedir(false)
    }
  }, [activo, pedir])

  return {
    vista: activo ? vista : ({ estado: "nada" } as VistaDeTextos),
    /** Ya pasó un momento: se muestra que está escribiendo. */
    escribiendo: espera >= 1,
    demorada: espera >= 2,
    fallos,
    reintentar: () => void pedir(true),
    cerrar: () => setVista({ estado: "nada" }),
  }
}

export type TextosAMedida = ReturnType<typeof useTextosAMedida>

/** Cuántos textos propone, contando la descripción. */
export function cuantosTextos(propuesta: PropuestaDeTextos): number {
  return propuesta.cambios.length + (propuesta.descripcion ? 1 : 0)
}

function enPalabras(cuantos: number): string {
  return cuantos === 1 ? "1 texto" : `${cuantos} textos`
}

function Tarjeta({
  escribiendo = false,
  children,
}: {
  escribiendo?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      aria-label="Textos a medida"
      className="pieza-tarjeta flex flex-col gap-3 border border-tinta/15 bg-hoja p-4 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
    >
      <h3 className="flex items-start gap-2.5 font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
        <WandSparkles
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-5 shrink-0 text-senal",
            escribiendo && "motion-safe:animate-pulse"
          )}
        />
        <span>
          {escribiendo
            ? "Estamos adaptando tus textos"
            : "Adaptamos tus textos"}{" "}
          <span className="pieza-resaltado">a lo que vendes</span>
        </span>
      </h3>
      {children}
    </section>
  )
}

export function TextosEscribiendo({ demorada }: { demorada: boolean }) {
  return (
    <Tarjeta escribiendo>
      <p aria-live="polite" className="text-sm leading-relaxed opacity-70">
        {demorada
          ? "Está tardando un poco más. Puedes seguir mientras tanto."
          : "Los estamos escribiendo con lo que contaste de tu negocio."}
      </p>
      <span aria-hidden="true" className="flex flex-col gap-2">
        <span className="pieza-hueso h-3 w-full rounded-full motion-safe:animate-pulse" />
        <span className="pieza-hueso h-3 w-2/3 rounded-full motion-safe:animate-pulse" />
      </span>
    </Tarjeta>
  )
}

export function TextosConError({
  fallos,
  alReintentar,
  sigueComo,
}: {
  fallos: number
  alReintentar: () => void
  /** Cómo queda mientras tanto: "Tu portada sigue como está." */
  sigueComo: string
}) {
  return (
    <section
      role="alert"
      className="pieza-tarjeta flex flex-col gap-3 border border-tinta/15 bg-hoja p-4"
    >
      <p className="flex items-start gap-2.5 font-semibold">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-senal"
        />
        {fallos > 1
          ? "La IA no responde por ahora."
          : "No pudimos adaptar tus textos."}
      </p>
      <p className="text-sm leading-relaxed opacity-70">{sigueComo}</p>
      <button
        type="button"
        onClick={alReintentar}
        className={cn(BOTON_SECUNDARIO, "w-full")}
      >
        <RotateCw aria-hidden="true" className="size-4" />
        Inténtalo de nuevo
      </button>
    </section>
  )
}

/** Cada texto con lo que dice hoy, tachado, y lo que diría. */
function FilasDeCambios({ propuesta }: { propuesta: PropuestaDeTextos }) {
  const filas = [
    ...propuesta.cambios.map((c) => ({
      clave: `${c.id}:${c.campo}`,
      rotulo: c.rotulo,
      antes: c.antes,
      despues: c.despues,
    })),
    ...(propuesta.descripcion
      ? [
          {
            clave: "descripcion",
            rotulo: "Sobre la tienda · Descripción",
            ...propuesta.descripcion,
          },
        ]
      : []),
  ]
  return (
    <ul className="flex flex-col divide-y divide-tinta/10 border-y border-tinta/10">
      {filas.map((fila) => (
        <li key={fila.clave} className="flex flex-col gap-1 py-2.5 text-sm">
          <span className="text-xs opacity-65">{fila.rotulo}</span>
          <span className="break-words line-through opacity-65">
            <span className="sr-only">Antes: </span>
            {fila.antes}
          </span>
          <span className="font-semibold break-words">
            <span className="sr-only">Ahora: </span>
            <span className="pieza-resaltado [box-decoration-break:clone]">
              {fila.despues}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** La propuesta, plegada o con el detalle. Los botones los pone quien la usa. */
export function TextosPropuestos({
  propuesta,
  abierta,
  alAbrir,
  puedeAbrir = true,
  nota,
  children,
}: {
  propuesta: PropuestaDeTextos
  abierta: boolean
  alAbrir: () => void
  puedeAbrir?: boolean
  nota?: string | null
  children: React.ReactNode
}) {
  return (
    <Tarjeta>
      <p className="text-sm leading-relaxed opacity-70">
        Te proponemos {enPalabras(cuantosTextos(propuesta))} con lo que contaste
        de tu negocio.
      </p>
      {abierta ? (
        <>
          <FilasDeCambios propuesta={propuesta} />
          {nota ? <p className="text-sm opacity-70">{nota}</p> : null}
          {children}
        </>
      ) : (
        <button
          type="button"
          onClick={alAbrir}
          disabled={!puedeAbrir}
          className={cn(BOTON_PRIMARIO, "w-full")}
        >
          Ver los cambios
        </button>
      )}
    </Tarjeta>
  )
}

export function TextosListos({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-start gap-3 text-sm leading-relaxed font-semibold"
    >
      <Visto className="mt-0.5 h-4 w-5 shrink-0 text-senal" />
      <span>{children}</span>
    </p>
  )
}

/**
 * La propuesta en el paso Portada. Usarla pone los textos en el borrador, como
 * toda propuesta de la IA del editor: quien compra los ve al publicar.
 */
export function TextosDelEditor() {
  const { textos, borrador, propuesta, setPropuesta, ia } = useEditor()
  const [descripcionUsada, setDescripcionUsada] = React.useState(false)

  // Al salir del paso, la vista previa vuelve al borrador.
  const abiertaAhora = React.useRef(false)
  abiertaAhora.current = Boolean(propuesta?.deTextos)
  React.useEffect(
    () => () => {
      if (abiertaAhora.current) setPropuesta(null)
    },
    [setPropuesta]
  )

  if (!textos || borrador.recuperable) return null
  const { vista } = textos

  if (vista === null) {
    return textos.escribiendo ? (
      <div className="px-5 pb-4">
        <TextosEscribiendo demorada={textos.demorada} />
      </div>
    ) : null
  }
  if (vista.estado === "error") {
    return (
      <div className="px-5 pb-4">
        <TextosConError
          fallos={textos.fallos}
          alReintentar={textos.reintentar}
          sigueComo="Tu página de inicio sigue como está."
        />
      </div>
    )
  }
  if (vista.estado === "sin-descripcion") {
    return (
      <div className="px-5 pb-4">
        <Tarjeta>
          <p className="text-sm leading-relaxed opacity-70">
            Para escribirlos, cuéntanos qué vendes en la descripción de tu
            tienda.
          </p>
          <Link
            href="/cuenta#tienda"
            className={cn(BOTON_SECUNDARIO, "w-full")}
          >
            Ir a Datos de la tienda
          </Link>
        </Tarjeta>
      </div>
    )
  }
  if (vista.estado !== "lista") return null

  const { id, propuesta: textosNuevos } = vista
  const presente = borrador.presente
  const { secciones, aplicados, saltados } = aplicarCambios(
    presente.secciones,
    textosNuevos.cambios
  )
  const usados = textosNuevos.cambios.filter((cambio) =>
    presente.secciones.some(
      (s) => s.id === cambio.id && s.props[cambio.campo] === cambio.despues
    )
  )
  const descripcion = descripcionUsada ? null : textosNuevos.descripcion
  const porDecidir: PropuestaDeTextos = {
    ...textosNuevos,
    cambios: aplicados,
    descripcion,
  }

  if (cuantosTextos(porDecidir) === 0) {
    return usados.length > 0 ? (
      <div className="px-5 pb-4">
        <TextosListos>
          Tus textos nuevos están en tu borrador. Publícalos cuando quieras.
        </TextosListos>
      </div>
    ) : null
  }

  const abierta = Boolean(propuesta?.deTextos)
  const otraPropuesta = Boolean(propuesta) && !abierta

  function abrir() {
    ia.setMirandoAntes(false)
    setPropuesta({
      id: null,
      resumen: "",
      operaciones: [],
      cambios: [],
      borrador: { ...presente, secciones },
      marcas: [...new Set(aplicados.map((cambio) => cambio.id))],
      deTextos: true,
    })
  }

  function usar() {
    if (aplicados.length > 0) borrador.poner({ ...presente, secciones })
    setPropuesta(null)
    ia.setMirandoAntes(false)
    if (descripcion) {
      setDescripcionUsada(true)
      void decidirTextos(id, "usar-descripcion").then((error) => {
        if (error) {
          setDescripcionUsada(false)
          toast.error(error)
        }
      })
    }
    toast.success("Listo, ya están en tu borrador.", {
      description: "Quien te compra los ve cuando publiques.",
      action: {
        label: "Deshacer",
        onClick: () => {
          if (aplicados.length > 0) borrador.deshacer()
          if (descripcion) {
            setDescripcionUsada(false)
            void decidirTextos(id, "volver-descripcion")
          }
        },
      },
    })
  }

  function descartar() {
    setPropuesta(null)
    ia.setMirandoAntes(false)
    textos?.cerrar()
    // La descripción no vive en el borrador: si ya se había usado, vuelve.
    void (async () => {
      if (descripcionUsada) await decidirTextos(id, "volver-descripcion")
      await decidirTextos(id, "descartar")
    })()
    toast("Descartamos los textos nuevos.")
  }

  return (
    <div className="px-5 pb-4">
      <TextosPropuestos
        propuesta={porDecidir}
        abierta={abierta}
        alAbrir={abrir}
        puedeAbrir={!otraPropuesta && !ia.cargando}
        nota={
          saltados === 0 || usados.length === saltados
            ? null
            : saltados - usados.length === 1
              ? "Dejamos 1 como está: lo cambiaste en tu borrador."
              : `Dejamos ${saltados - usados.length} como están: los cambiaste en tu borrador.`
        }
      >
        {aplicados.length > 0 ? (
          <button
            type="button"
            onClick={() => ia.setMirandoAntes(!ia.mirandoAntes)}
            aria-pressed={ia.mirandoAntes}
            className="min-h-11 self-start text-sm font-semibold underline underline-offset-4"
          >
            {ia.mirandoAntes ? "Ver los textos nuevos" : "Ver cómo estaba"}
          </button>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={usar}
            className={cn(BOTON_PRIMARIO, "px-3 text-sm")}
          >
            Usar estos textos
          </button>
          <button
            type="button"
            onClick={descartar}
            className={cn(BOTON_SECUNDARIO, "px-3 text-sm")}
          >
            Descartar
          </button>
        </div>
      </TextosPropuestos>
    </div>
  )
}
