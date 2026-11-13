"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Check, Copy, Globe } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import {
  armarCelular,
  EscenaDelCelular,
  type TiendaDelCelular,
} from "@/components/panel/resumen/celular"
import { useEscena } from "@/components/panel/resumen/escena"

/**
 * El final del alta: la tienda recién creada, de verdad y en vivo, adentro del
 * celular del Resumen. Es una escena, pero cabe en una pantalla: se arma una
 * vez al llegar —el titular sube, el celular entra girando, se estampa la
 * calcomanía y se escribe la nota— y no vuelve a empezar. Con "Reducir
 * movimiento", todo en su lugar desde el principio.
 */
export function EscenaLista({
  tienda,
  url,
  vista,
  conEditor,
}: {
  tienda: TiendaDelCelular
  url: string
  vista: { url: string; real: boolean }
  /** Venduo puede apagar el editor: entonces no se ofrece. */
  conEditor: boolean
}) {
  const raiz = React.useRef<HTMLElement>(null)
  const [copiado, setCopiado] = React.useState(false)
  useEscena(raiz, armarCelular)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      toast.success("Copiamos el enlace.")
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("No pudimos copiar el enlace. Cópialo a mano.")
    }
  }

  return (
    <section
      ref={raiz}
      data-escena
      aria-label="Tu tienda"
      // Una columna que se achica: con `auto`, el enlace largo la ensanchaba
      // más que la pantalla.
      className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_0.95fr] lg:gap-10"
    >
      {/* En el celular el orden es titular, celular, enlace y botones: esta
          columna se deshace (`contents`) y cada pieza dice su lugar. */}
      <div className="flex min-w-0 flex-col gap-6 max-lg:contents lg:gap-8">
        <div className="js-sube max-lg:order-1">
          <h1 className="pieza-titular font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
            Tu tienda ya está <span className="pieza-resaltado">en línea</span>.
          </h1>
          <p className="mt-3 max-w-[44ch] text-sm leading-relaxed opacity-70 sm:text-base">
            La puedes personalizar ahora o subir tus productos desde tu panel.
          </p>
        </div>

        {/* El enlace: se toca para abrirla, y al lado se copia. */}
        <div className="js-sube pieza-ficha flex min-h-12 items-center gap-2 border border-tinta/15 bg-hoja py-1 pr-1 pl-3 max-lg:order-3">
          <Globe aria-hidden="true" className="size-4 shrink-0 opacity-60" />
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex min-h-10 min-w-0 flex-1 items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
          >
            <span className="truncate">{tienda.legible}</span>
            <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
          </a>
          <button
            type="button"
            onClick={copiar}
            className="pieza-ficha flex min-h-10 shrink-0 items-center gap-1.5 border border-tinta/15 px-3 text-sm font-semibold transition-colors hover:border-tinta"
          >
            {copiado ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>

        <div
          className={cn(
            "js-sube grid gap-2 max-lg:order-4 lg:max-w-[26rem]",
            conEditor && "lg:grid-cols-2"
          )}
        >
          {conEditor ? (
            <Link
              href="/editor?bienvenida=1"
              className={cn(BOTON_PRIMARIO, "w-full px-4")}
            >
              Personalizar ahora
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
          <Link
            href="/panel"
            className={cn(
              conEditor ? BOTON_SECUNDARIO : BOTON_PRIMARIO,
              "w-full px-4"
            )}
          >
            Ir a mi panel
          </Link>
        </div>
      </div>

      <div className="max-lg:order-2 max-lg:-my-6">
        <EscenaDelCelular
          tienda={tienda}
          vista={vista}
          enVivo={url}
          destino={conEditor ? "/editor?bienvenida=1" : url}
          externo={!conEditor}
          etiqueta={conEditor ? "Editar tu tienda" : "Ver tu tienda"}
          icono={conEditor ? undefined : ArrowUpRight}
          nota="así se ve hoy"
        />
      </div>
    </section>
  )
}
