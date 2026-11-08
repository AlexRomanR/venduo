"use client"

import * as React from "react"
import Image from "next/image"
import {
  Camera,
  Check,
  Copy,
  Download,
  MessageCircle,
  Music,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  FICHA,
  FICHA_ELEGIDA,
  FICHA_LIBRE,
} from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { conOrigen } from "@/lib/visitas"

/*
 * Las piezas de la pantalla Compartir, las mismas de la app
 * (`src/components/compartir/`): el enlace que se toca y se copia, un botón
 * por red, las tarjetas para historias y el QR para el puesto.
 */

async function copiarAlPortapapeles(texto: string) {
  await navigator.clipboard.writeText(texto)
}

/** El enlace como una pastilla: se toca y se copia, y dice "Copiado" un momento. */
export function PastillaDeEnlace({
  url,
  legible,
}: {
  url: string
  legible: string
}) {
  const [copiado, setCopiado] = React.useState(false)

  React.useEffect(() => {
    if (!copiado) return
    const id = window.setTimeout(() => setCopiado(false), 1600)
    return () => window.clearTimeout(id)
  }, [copiado])

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await copiarAlPortapapeles(url)
          setCopiado(true)
        } catch {
          toast.error(
            "No pudimos copiarlo. Mantén apretado el enlace y cópialo."
          )
        }
      }}
      aria-label={`Copiar tu enlace: ${legible}`}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-full border pl-5 text-left transition-colors",
        copiado
          ? "border-tinta bg-tinta text-papel"
          : "border-tinta/25 bg-papel hover:border-tinta"
      )}
    >
      <span className="min-w-0 flex-1 truncate font-semibold">
        {copiado ? "Copiado" : legible}
      </span>
      <span className="flex size-12 shrink-0 items-center justify-center">
        {copiado ? (
          <Check aria-hidden="true" className="size-5" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
      </span>
    </button>
  )
}

interface Red {
  nombre: string
  icono: LucideIcon
  abrir: (mensaje: string, url: string) => void | Promise<void>
}

/**
 * Instagram y TikTok no reciben un enlace desde la web: se pega en la bio o
 * en una historia. Se copia, se avisa, y se abre la red para pegarlo.
 */
async function copiarYAbrir(url: string, pagina: string, donde: string) {
  try {
    await copiarAlPortapapeles(url)
    toast.success(`Enlace copiado: pégalo en ${donde}.`)
  } catch {
    toast.error("No pudimos copiarlo. Mantén apretado el enlace y cópialo.")
  }
  window.open(pagina, "_blank", "noopener,noreferrer")
}

const REDES: Red[] = [
  {
    nombre: "WhatsApp",
    icono: MessageCircle,
    abrir: (mensaje) => {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
        "_blank",
        "noopener,noreferrer"
      )
    },
  },
  {
    nombre: "Instagram",
    icono: Camera,
    abrir: (_mensaje, url) =>
      copiarYAbrir(url, "https://www.instagram.com/", "tu bio o una historia"),
  },
  {
    nombre: "TikTok",
    icono: Music,
    abrir: (_mensaje, url) =>
      copiarYAbrir(url, "https://www.tiktok.com/", "tu bio o un video"),
  },
  {
    nombre: "Facebook",
    icono: Users,
    abrir: (_mensaje, url) => {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer"
      )
    },
  },
]

/** Un botón por red. "Más" solo donde el navegador sabe compartir. */
export function RedesParaCompartir({
  mensaje,
  url,
}: {
  mensaje: string
  url: string
}) {
  const [puedeCompartir, setPuedeCompartir] = React.useState(false)
  React.useEffect(() => {
    setPuedeCompartir(typeof navigator.share === "function")
  }, [])

  return (
    <ul
      className={cn(
        "grid gap-2",
        puedeCompartir ? "grid-cols-5" : "grid-cols-4"
      )}
    >
      {REDES.map((red) => (
        <li key={red.nombre}>
          <BotonDeRed red={red} alTocar={() => red.abrir(mensaje, url)} />
        </li>
      ))}
      {puedeCompartir ? (
        <li>
          <BotonDeRed
            red={{ nombre: "Más", icono: Share2, abrir: () => undefined }}
            alTocar={() =>
              navigator.share({ text: mensaje, url }).catch(() => undefined)
            }
          />
        </li>
      ) : null}
    </ul>
  )
}

function BotonDeRed({ red, alTocar }: { red: Red; alTocar: () => void }) {
  const Icono = red.icono
  return (
    <button
      type="button"
      onClick={alTocar}
      className="group flex w-full flex-col items-center gap-1.5 py-1 text-xs font-semibold"
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-tinta/25 transition-colors group-hover:border-tinta group-hover:bg-tinta group-hover:text-papel">
        <Icono aria-hidden="true" className="size-5" />
      </span>
      {red.nombre}
    </button>
  )
}

const DISENOS = [
  { clave: "vitrina", nombre: "Vitrina" },
  { clave: "color", nombre: "Color" },
  { clave: "qr", nombre: "QR" },
] as const

/**
 * Tarjetas para historias: una imagen vertical con la tienda adentro, para
 * una historia de Instagram, TikTok o el estado de WhatsApp. Las dibuja el
 * servidor (`/panel/compartir/historia`) a 1080 × 1920; acá se ven achicadas.
 */
export function TarjetasDeHistoria({ slug }: { slug: string }) {
  const [elegido, setElegido] =
    React.useState<(typeof DISENOS)[number]["clave"]>("vitrina")
  const [compartiendo, setCompartiendo] = React.useState(false)
  const [puedeCompartir, setPuedeCompartir] = React.useState(false)
  const ruta = (clave: string) => `/panel/compartir/historia?diseno=${clave}`

  React.useEffect(() => {
    setPuedeCompartir(
      typeof navigator.canShare === "function" &&
        navigator.canShare({
          files: [new File([""], "prueba.png", { type: "image/png" })],
        })
    )
  }, [])

  async function compartir() {
    setCompartiendo(true)
    try {
      const respuesta = await fetch(ruta(elegido))
      if (!respuesta.ok) throw new Error(String(respuesta.status))
      const archivo = new File(
        [await respuesta.blob()],
        `${slug}-historia-${elegido}.png`,
        { type: "image/png" }
      )
      await navigator.share({ files: [archivo] })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error("No pudimos armar la imagen. Inténtalo de nuevo.")
    } finally {
      setCompartiendo(false)
    }
  }

  return (
    // Achicadas a un ancho fijo: a lo ancho de la tarjeta, en la web, tres
    // historias de 9:16 medían media pantalla de alto.
    <div className="flex max-w-[34rem] flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {DISENOS.map((diseno) => {
          const activo = diseno.clave === elegido
          return (
            <button
              key={diseno.clave}
              type="button"
              onClick={() => setElegido(diseno.clave)}
              aria-pressed={activo}
              aria-label={`Tarjeta ${diseno.nombre}`}
              className="group flex flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "relative block aspect-[9/16] w-full overflow-hidden rounded-[14px] border-2 bg-tinta/[0.05] transition-[border-color,translate] duration-200",
                  activo
                    ? "border-tinta"
                    : "border-transparent group-hover:-translate-y-0.5"
                )}
              >
                <Image
                  src={ruta(diseno.clave)}
                  alt=""
                  fill
                  unoptimized
                  sizes="180px"
                  className="object-cover"
                />
              </span>
              <span
                className={cn(
                  FICHA,
                  "min-h-9 justify-center px-3",
                  activo ? FICHA_ELEGIDA : FICHA_LIBRE
                )}
              >
                {diseno.nombre}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={`${ruta(elegido)}&descargar`}
          download
          className={cn(BOTON_PRIMARIO, "sm:flex-1")}
        >
          <Download aria-hidden="true" className="size-4" />
          Descargar la imagen
        </a>
        {puedeCompartir ? (
          <button
            type="button"
            onClick={compartir}
            disabled={compartiendo}
            className={cn(BOTON_SECUNDARIO, "sm:flex-1")}
          >
            <Share2 aria-hidden="true" className="size-4" />
            Compartir
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** El QR del puesto: lleva su marca, para contar las visitas que trae. */
export function QrDeTienda({
  nombre,
  slug,
  url,
}: {
  nombre: string
  slug: string
  url: string
}) {
  const [qr, setQr] = React.useState<string | null>(null)

  React.useEffect(() => {
    let vigente = true
    // A 1024 px sirve para imprimirlo grande; en pantalla se muestra chico.
    import("@/lib/qr")
      .then(({ toDataURL }) =>
        toDataURL(conOrigen(url, "qr"), {
          size: 1024,
          margin: 2,
          dark: "#1d1c1a",
        })
      )
      .then((imagen) => {
        if (vigente) setQr(imagen)
      })
      .catch(() => {
        if (vigente)
          toast.error("No pudimos dibujar el QR. Inténtalo de nuevo.")
      })
    return () => {
      vigente = false
    }
  }, [url])

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex size-48 shrink-0 items-center justify-center rounded-[16px] border border-tinta/15 bg-white p-2">
        {qr ? (
          <Image
            src={qr}
            alt={`Código QR de ${nombre}`}
            width={176}
            height={176}
            unoptimized
            className="size-full"
          />
        ) : (
          <span className="pieza-hueso size-full animate-pulse rounded-[10px] motion-reduce:animate-none" />
        )}
      </div>
      <div className="flex w-full flex-col gap-3">
        <p className="text-sm leading-relaxed text-tinta/70">
          Imprímelo y pégalo donde vendes: en tu puesto, en el empaque o en tus
          bolsas. Lleva directo a tu tienda.
        </p>
        <a
          href={qr ?? undefined}
          download={`qr-${slug}.png`}
          aria-disabled={!qr}
          className={cn(
            BOTON_SECUNDARIO,
            "sm:w-fit",
            !qr && "pointer-events-none opacity-65"
          )}
        >
          <Download aria-hidden="true" className="size-4" />
          Descargar el QR
        </a>
      </div>
    </div>
  )
}
