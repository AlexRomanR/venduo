"use client"

import * as React from "react"
import Image from "next/image"
import { Check, ImagePlus, Images, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  ErrorDeImagen,
  listarBiblioteca,
  subirImagen,
  TIPOS_ACEPTADOS,
  type ImagenDeBiblioteca,
} from "@/lib/editor/imagenes"
import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"

/**
 * La foto de una sección.
 *
 * Tres caminos al mismo lugar: subir una del teléfono, soltarla encima, o
 * elegir de la biblioteca —lo que la tienda ya subió y las fotos de sus
 * productos—. Reusar una foto de producto es lo más común: es la que el
 * negocio ya tiene.
 */
export function CampoImagen({
  etiqueta,
  ayuda,
  valor,
  alCambiar,
}: {
  etiqueta: string
  ayuda?: string
  valor: string | undefined
  alCambiar: (url: string | undefined) => void
}) {
  const { tienda, esDemo } = useEditor()
  const [subiendo, setSubiendo] = React.useState(false)
  const [encima, setEncima] = React.useState(false)
  const [conBiblioteca, setConBiblioteca] = React.useState(false)
  const [subidas, setSubidas] = React.useState<ImagenDeBiblioteca[]>([])
  const entrada = React.useRef<HTMLInputElement>(null)

  async function subir(archivo: File) {
    if (esDemo) {
      toast.error("En modo demo no se suben imágenes.")
      return
    }
    setSubiendo(true)
    try {
      const url = await subirImagen(tienda.id, "imagenes", archivo)
      setSubidas((previas) => [
        { url, nombre: archivo.name, fecha: new Date().toISOString() },
        ...previas,
      ])
      alCambiar(url)
    } catch (error) {
      toast.error(
        error instanceof ErrorDeImagen
          ? error.message
          : "No pudimos subir la foto. Inténtalo de nuevo."
      )
    } finally {
      setSubiendo(false)
      if (entrada.current) entrada.current.value = ""
    }
  }

  return (
    <div className="relative">
      <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
        {etiqueta}
      </p>

      <div
        onDragOver={(evento) => {
          if (!evento.dataTransfer.types.includes("Files")) return
          evento.preventDefault()
          setEncima(true)
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(evento) => {
          evento.preventDefault()
          setEncima(false)
          const archivo = evento.dataTransfer.files[0]
          if (archivo) void subir(archivo)
        }}
        className={cn(
          "relative mt-2 flex aspect-[16/9] items-center justify-center overflow-hidden border border-dashed bg-tinta/[0.04] transition-colors",
          encima ? "border-senal bg-senal/[0.06]" : "border-tinta/25"
        )}
      >
        {valor ? (
          <Image
            src={valor}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 360px"
            className="object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 text-center text-xs opacity-55">
            <ImagePlus aria-hidden="true" className="size-6" />
            {encima ? "Suéltala acá" : "Arrastra una foto acá"}
          </span>
        )}
        {subiendo ? (
          <span className="absolute inset-0 flex items-center justify-center gap-2 bg-papel/85 text-sm font-semibold">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Subiendo…
          </span>
        ) : null}
      </div>

      {ayuda ? <p className="mt-2 text-xs opacity-55">{ayuda}</p> : null}

      <div className="mt-1 flex flex-wrap gap-x-5">
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={subiendo}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal disabled:opacity-50"
        >
          <Upload aria-hidden="true" className="size-4" />
          Subir foto
        </button>
        <button
          type="button"
          onClick={() => setConBiblioteca((abierta) => !abierta)}
          aria-expanded={conBiblioteca}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          <Images aria-hidden="true" className="size-4" />
          Tu biblioteca
        </button>
        {valor ? (
          <button
            type="button"
            onClick={() => alCambiar(undefined)}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Quitar
          </button>
        ) : null}
      </div>

      {conBiblioteca ? (
        <Biblioteca
          elegida={valor}
          subidas={subidas}
          alElegir={(url) => {
            alCambiar(url)
            setConBiblioteca(false)
          }}
        />
      ) : null}

      <input
        ref={entrada}
        type="file"
        accept={TIPOS_ACEPTADOS.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0]
          if (archivo) void subir(archivo)
        }}
      />
    </div>
  )
}

function Biblioteca({
  elegida,
  subidas,
  alElegir,
}: {
  elegida: string | undefined
  subidas: ImagenDeBiblioteca[]
  alElegir: (url: string) => void
}) {
  const { tienda, productos, esDemo } = useEditor()
  const [guardadas, setGuardadas] = React.useState<ImagenDeBiblioteca[] | null>(
    null
  )

  React.useEffect(() => {
    let vigente = true
    if (esDemo) {
      setGuardadas([])
      return
    }
    listarBiblioteca(tienda.id).then((lista) => {
      if (vigente) setGuardadas(lista)
    })
    return () => {
      vigente = false
    }
  }, [tienda.id, esDemo])

  const propias = [...subidas, ...(guardadas ?? [])].filter(
    (imagen, indice, lista) =>
      lista.findIndex((otra) => otra.url === imagen.url) === indice
  )
  const deProductos = productos.filter((producto) => producto.foto).slice(0, 24)

  return (
    <div className="mt-2 border-t border-tinta/15 pt-4 motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in">
      <p className="text-xs font-semibold opacity-60">Las que subiste</p>
      {guardadas === null ? (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="aspect-square animate-pulse bg-tinta/10" />
          ))}
        </div>
      ) : propias.length === 0 ? (
        <p className="mt-2 text-xs opacity-55">
          Todavía ninguna. Las fotos que subas quedan acá para reusarlas.
        </p>
      ) : (
        <Grilla
          imagenes={propias.map((imagen) => imagen.url)}
          elegida={elegida}
          alElegir={alElegir}
        />
      )}

      {deProductos.length > 0 ? (
        <>
          <p className="mt-4 text-xs font-semibold opacity-60">
            Las de tus productos
          </p>
          <Grilla
            imagenes={deProductos.map((producto) => producto.foto as string)}
            nombres={deProductos.map((producto) => producto.nombre)}
            elegida={elegida}
            alElegir={alElegir}
          />
        </>
      ) : null}
    </div>
  )
}

function Grilla({
  imagenes,
  nombres,
  elegida,
  alElegir,
}: {
  imagenes: string[]
  nombres?: string[]
  elegida: string | undefined
  alElegir: (url: string) => void
}) {
  return (
    <ul className="mt-2 grid grid-cols-3 gap-2">
      {imagenes.map((url, indice) => {
        const activa = url === elegida
        return (
          <li key={url}>
            <button
              type="button"
              onClick={() => alElegir(url)}
              aria-pressed={activa}
              aria-label={
                nombres?.[indice]
                  ? `Usar la foto de ${nombres[indice]}`
                  : `Usar la foto ${indice + 1}`
              }
              className={cn(
                "relative block aspect-square w-full overflow-hidden bg-tinta/[0.06] transition-opacity hover:opacity-85",
                activa && "outline-2 outline-offset-2 outline-tinta"
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
              {activa ? (
                <span className="absolute top-1 right-1 flex size-5 items-center justify-center bg-tinta text-papel">
                  <Check aria-hidden="true" className="size-3.5" />
                </span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
