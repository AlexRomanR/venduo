"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Copy, MessageCircle, QrCode, Share2, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Las herramientas para compartir un enlace.
 *
 * WhatsApp va primero y en rojo porque es donde ocurre la venta: se abre con el
 * mensaje ya escrito y el promotor solo elige a quién mandarlo. Copiar queda
 * para TikTok, Instagram o un estado; el QR, para mostrarlo desde el celular o
 * imprimirlo.
 *
 * `compacto` es para las listas: íconos de 44 px con su nombre accesible.
 */
export function CompartirEnlace({
  url,
  mensaje,
  producto,
  qr,
  compacto = false,
}: {
  url: string
  mensaje: string
  producto: string
  /** El QR ya dibujado en el servidor, como data URL. */
  qr?: string | null
  compacto?: boolean
}) {
  const [copiado, setCopiado] = React.useState(false)
  const [puedeCompartir, setPuedeCompartir] = React.useState(false)

  // `navigator.share` existe en el celular y casi nunca en escritorio. Se mira
  // después de montar: en el servidor no hay navigator y el HTML no coincidiría.
  React.useEffect(() => {
    setPuedeCompartir(typeof navigator !== "undefined" && "share" in navigator)
  }, [])

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      toast.success("Enlace copiado. Pégalo donde quieras.")
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso de portapapeles el enlace igual está a la vista.
      toast.error("No pudimos copiarlo. Mantén presionado el enlace.")
    }
  }

  async function compartir() {
    try {
      await navigator.share({ title: producto, text: mensaje, url })
    } catch {
      // Cerrar la hoja de compartir también cae acá: no es un error.
    }
  }

  const icono = "size-4 shrink-0"
  const cuadrado =
    "flex size-11 items-center justify-center border border-tinta/25 transition-[color,border-color,transform] hover:border-tinta active:scale-[0.97] motion-reduce:active:scale-100"

  if (compacto) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Compartir ${producto} por WhatsApp`}
          className="flex size-11 items-center justify-center bg-senal text-white transition-[background-color,transform] hover:bg-senal-alta active:scale-[0.97] motion-reduce:active:scale-100"
        >
          <MessageCircle aria-hidden="true" className={icono} />
        </a>
        <button
          type="button"
          onClick={copiar}
          aria-label={`Copiar el enlace de ${producto}`}
          className={cuadrado}
        >
          {copiado ? (
            <Check aria-hidden="true" className={cn(icono, "text-senal")} />
          ) : (
            <Copy aria-hidden="true" className={icono} />
          )}
        </button>
        {qr ? (
          <BotonQr qr={qr} producto={producto} className={cuadrado} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer noopener"
        className="flex min-h-11 items-center gap-2 rounded-plantilla bg-senal px-4 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-senal-alta active:scale-[0.98] motion-reduce:active:scale-100"
      >
        <MessageCircle aria-hidden="true" className={icono} />
        Mandar por WhatsApp
      </a>

      <button
        type="button"
        onClick={copiar}
        className="flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-sm font-semibold transition-[background-color,color,transform] hover:bg-tinta hover:text-papel active:scale-[0.98] motion-reduce:active:scale-100"
      >
        {copiado ? (
          <Check aria-hidden="true" className={icono} />
        ) : (
          <Copy aria-hidden="true" className={icono} />
        )}
        {copiado ? "Copiado" : "Copiar enlace"}
      </button>

      {puedeCompartir ? (
        <button
          type="button"
          onClick={compartir}
          className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:text-senal"
        >
          <Share2 aria-hidden="true" className={icono} />
          Compartir
        </button>
      ) : null}

      {qr ? (
        <BotonQr
          qr={qr}
          producto={producto}
          className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:text-senal"
          conTexto
        />
      ) : null}
    </div>
  )
}

function BotonQr({
  qr,
  producto,
  className,
  conTexto = false,
}: {
  qr: string
  producto: string
  className: string
  conTexto?: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={conTexto ? undefined : `Ver el QR de ${producto}`}
          className={className}
        >
          <QrCode aria-hidden="true" className="size-4 shrink-0" />
          {conTexto ? "Ver QR" : null}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-[22rem] gap-0 rounded-none border-2 border-tinta bg-papel p-6 text-tinta shadow-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogTitle className="font-titular text-lg font-bold tracking-[-0.02em]">
              {producto}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-tinta/70">
              Quien lo escanea llega con tu código ya puesto.
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Cerrar"
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal"
          >
            <X aria-hidden="true" className="size-5" />
          </DialogClose>
        </div>
        <div className="mt-5 border border-tinta p-3">
          <Image
            src={qr}
            alt={`Código QR de tu enlace para ${producto}`}
            width={320}
            height={320}
            unoptimized
            className="h-auto w-full"
          />
        </div>
        <a
          href={qr}
          download={`qr-${producto.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`}
          className="mt-4 flex min-h-11 items-center justify-center rounded-plantilla border-2 border-tinta text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          Descargar para imprimir
        </a>
      </DialogContent>
    </Dialog>
  )
}
