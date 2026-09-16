"use client"

import * as React from "react"
import Image from "next/image"
import { ImagePlus, Loader2, Star, X } from "lucide-react"
import { toast } from "sonner"

import { BUCKETS, uploadFile } from "@/lib/supabase/storage"
import { cn } from "@/lib/utils"

const MAXIMO = 6

/**
 * Las fotos del producto.
 *
 * Suben al bucket en cuanto se eligen y lo que queda en el formulario son las
 * URL: si el guardado falla, queda un archivo huérfano —que cuesta centavos—
 * en vez de un producto apuntando a algo que no existe.
 *
 * La primera es la portada. Es la que se ve en la vitrina y en el panel, y por
 * eso se puede cambiar sin volver a subir nada: reordenar es más barato que
 * pedirle a alguien que borre y suba de nuevo.
 */
export function Fotos({
  valor,
  alCambiar,
  carpeta,
}: {
  valor: string[]
  alCambiar: (fotos: string[]) => void
  /** La tienda: agrupa los archivos y evita mezclar catálogos en el bucket. */
  carpeta: string
}) {
  const entrada = React.useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = React.useState(0)

  const libres = MAXIMO - valor.length

  async function elegir(archivos: FileList | null) {
    if (!archivos?.length) return

    const lote = Array.from(archivos).slice(0, libres)
    if (lote.length < archivos.length) {
      toast.info(`Solo entran ${MAXIMO} fotos por producto.`)
    }

    setSubiendo(lote.length)

    // En serie y no en paralelo: son fotos de celular por datos móviles, y
    // seis subidas a la vez se pisan entre ellas más de lo que se adelanta.
    const nuevas: string[] = []
    for (const archivo of lote) {
      try {
        const subida = await uploadFile(BUCKETS.productImages, archivo, carpeta)
        nuevas.push(subida.url)
      } catch (error) {
        toast.error(
          error instanceof Error && error.message.includes("MB")
            ? error.message
            : `No pudimos subir "${archivo.name}".`
        )
      }
    }

    setSubiendo(0)
    if (entrada.current) entrada.current.value = ""
    if (nuevas.length > 0) alCambiar([...valor, ...nuevas])
  }

  function quitar(url: string) {
    alCambiar(valor.filter((f) => f !== url))
  }

  function haciaLaPortada(url: string) {
    alCambiar([url, ...valor.filter((f) => f !== url)])
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {valor.map((url, i) => (
          <figure
            key={url}
            className={cn(
              "group relative size-24 overflow-hidden border bg-tinta/5",
              i === 0 ? "border-senal" : "border-tinta/25"
            )}
          >
            <Image
              src={url}
              alt={i === 0 ? "Portada del producto" : `Foto ${i + 1}`}
              width={240}
              height={240}
              unoptimized
              className="size-full object-cover"
            />

            {i === 0 ? (
              <figcaption className="absolute inset-x-0 bottom-0 bg-senal px-1 py-0.5 text-center text-[10px] font-semibold tracking-[0.1em] text-white uppercase">
                Portada
              </figcaption>
            ) : (
              <button
                type="button"
                onClick={() => haciaLaPortada(url)}
                aria-label="Usar como portada"
                className="absolute bottom-1 left-1 flex size-7 items-center justify-center bg-papel/90 text-tinta transition-colors hover:bg-senal hover:text-white"
              >
                <Star aria-hidden="true" className="size-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => quitar(url)}
              aria-label={`Quitar foto ${i + 1}`}
              className="absolute top-1 right-1 flex size-7 items-center justify-center bg-papel/90 text-tinta transition-colors hover:bg-tinta hover:text-papel"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </figure>
        ))}

        {libres > 0 ? (
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={subiendo > 0}
            className="flex size-24 flex-col items-center justify-center gap-1 border border-dashed border-tinta/40 text-xs transition-colors hover:border-senal hover:text-senal disabled:opacity-50"
          >
            {subiendo > 0 ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <ImagePlus aria-hidden="true" className="size-5" />
            )}
            {subiendo > 0 ? `Subiendo ${subiendo}` : "Agregar"}
          </button>
        ) : null}
      </div>

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(e) => elegir(e.target.files)}
      />

      <p className="mt-3 text-xs leading-relaxed text-tinta/55">
        Hasta {MAXIMO} fotos, 5 MB cada una. La primera es la portada: es la que
        se ve en tu tienda y la que comparte el vendedor.
      </p>
    </div>
  )
}
