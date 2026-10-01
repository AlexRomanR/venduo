"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Copy, Download, MessageCircle, X } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
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
 * Compartir la tienda: el enlace, el QR y un mensaje listo para WhatsApp.
 *
 * Reemplaza a la columna con el QR que ocupaba el Resumen todo el tiempo. El
 * QR se usa una vez —para imprimirlo y pegarlo donde se vende— y el enlace
 * todos los días: los dos van juntos, a un toque, y el QR se dibuja recién al
 * abrir, así no pesa en cada carga del panel.
 *
 * `children` es el botón que lo abre: la cabecera y los primeros pasos usan
 * cada uno el suyo.
 *
 * El enlace legible llega armado desde el servidor: calcularlo acá obligaba a
 * importar `lib/tienda`, que trae el entorno validado con zod, y eso eran cien
 * kilobytes más en el celular por quitar un `https://`.
 */
export function CompartirTienda({
  nombre,
  slug,
  url,
  legible,
  children,
}: {
  nombre: string
  slug: string
  url: string
  /** El enlace sin `https://`, como se dicta y se lee. */
  legible: string
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = React.useState(false)
  const [qr, setQr] = React.useState<string | null>(null)
  const [copiado, setCopiado] = React.useState(false)

  React.useEffect(() => {
    if (!abierto || qr) return
    let vigente = true
    // A 1024 px sirve para imprimirlo grande; en pantalla se muestra chico.
    import("@/lib/qr")
      .then(({ toDataURL }) =>
        toDataURL(url, { size: 1024, margin: 2, dark: "#16171a" })
      )
      .then((imagen) => {
        if (vigente) setQr(imagen)
      })
      .catch(() => {
        if (vigente) toast.error("No pudimos dibujar el QR. Prueba de nuevo.")
      })
    return () => {
      vigente = false
    }
  }, [abierto, qr, url])

  React.useEffect(() => {
    if (!copiado) return
    const id = window.setTimeout(() => setCopiado(false), 2000)
    return () => window.clearTimeout(id)
  }, [copiado])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      toast.success("Enlace copiado. Pégalo donde quieras.")
    } catch {
      toast.error("No pudimos copiarlo. Mantén apretado el enlace y cópialo.")
    }
  }

  const mensaje = `Hola, te comparto mi tienda ${nombre}: ${url}`

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[92svh] gap-0 overflow-y-auto rounded-none border-2 border-tinta bg-papel p-0 text-tinta shadow-none sm:max-w-md"
      >
        <div className="flex items-start gap-4 border-b border-tinta/15 p-5">
          <div className="flex-1">
            <DialogTitle className="font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
              Comparte tu tienda
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm leading-relaxed text-tinta/70">
              Cada persona que entra por este enlace puede comprarte.
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Cerrar"
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal"
          >
            <X aria-hidden="true" className="size-5" />
          </DialogClose>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div className="mx-auto flex size-56 items-center justify-center border border-tinta p-2">
            {qr ? (
              <Image
                src={qr}
                alt={`Código QR de ${nombre}`}
                width={208}
                height={208}
                unoptimized
                className="size-full"
              />
            ) : (
              <span className="size-full animate-pulse bg-tinta/[0.06] motion-reduce:animate-none" />
            )}
          </div>

          <div>
            <label
              htmlFor="enlace-de-la-tienda"
              className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65"
            >
              Tu enlace
            </label>
            <div className="mt-2 flex border border-tinta">
              <input
                id="enlace-de-la-tienda"
                readOnly
                value={legible}
                onFocus={(evento) => evento.currentTarget.select()}
                className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={copiar}
                className={cn(
                  "flex min-h-12 shrink-0 items-center gap-2 border-l border-tinta px-4 text-sm font-semibold transition-colors",
                  copiado
                    ? "bg-tinta text-papel"
                    : "hover:bg-tinta hover:text-papel"
                )}
              >
                {copiado ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : (
                  <Copy aria-hidden="true" className="size-4" />
                )}
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
              target="_blank"
              rel="noreferrer noopener"
              className={BOTON_PRIMARIO}
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Enviar por WhatsApp
            </a>
            <a
              href={qr ?? undefined}
              download={`qr-${slug}.png`}
              aria-disabled={!qr}
              className={cn(
                BOTON_SECUNDARIO,
                !qr && "pointer-events-none opacity-65"
              )}
            >
              <Download aria-hidden="true" className="size-4" />
              Descargar el QR
            </a>
          </div>

          <p className="text-sm leading-relaxed opacity-70">
            Imprime el QR y pégalo donde vendes: en tu puesto, en el empaque o
            en tus bolsas. Lleva directo a tu tienda.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
