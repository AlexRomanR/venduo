"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImageUp, Loader2, QrCode, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  CAMPO_LINEA,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { createClient } from "@/lib/supabase/client"
import { BUCKETS, uploadFile } from "@/lib/supabase/storage"
import { cn } from "@/lib/utils"
import type { Cuenta } from "@/lib/data/cuenta"

/**
 * Cómo te pagan.
 *
 * Venduo no procesa el cobro: el comprador transfiere al QR del comercio y
 * sube su comprobante. Sin este QR cargado, la pantalla de pago de la tienda
 * queda con un hueco y el comprador tiene que preguntar por WhatsApp — que
 * funciona, pero pierde ventas.
 */
export function FormCobro({ cuenta }: { cuenta: Cuenta }) {
  const router = useRouter()
  const tienda = cuenta.tienda!
  const entrada = React.useRef<HTMLInputElement>(null)

  const [whatsapp, setWhatsapp] = React.useState(tienda.whatsapp ?? "")
  const [instrucciones, setInstrucciones] = React.useState(
    tienda.paymentInstructions ?? ""
  )
  const [qrUrl, setQrUrl] = React.useState(tienda.paymentQrUrl)
  const [subiendo, setSubiendo] = React.useState(false)
  const [guardando, setGuardando] = React.useState(false)

  async function guardarCampos(cambios: Record<string, string | null>) {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return false
    }

    const { error } = await supabase
      .from("stores")
      .update({ ...cambios, updated_at: new Date().toISOString() })
      .eq("id", tienda.id)

    if (error) {
      toast.error("No pudimos guardar los datos de cobro.")
      return false
    }
    return true
  }

  async function subirQr(archivo: File | undefined) {
    if (!archivo) return

    setSubiendo(true)
    try {
      // Va al bucket público de imágenes de tienda: este QR se le muestra a
      // cualquiera que compre, no es un secreto.
      const subida = await uploadFile(
        BUCKETS.productImages,
        archivo,
        `${tienda.id}/cobro`
      )

      if (await guardarCampos({ payment_qr_url: subida.url })) {
        setQrUrl(subida.url)
        toast.success("QR de cobro actualizado.")
        router.refresh()
      }
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("MB")
          ? error.message
          : "No pudimos subir esa imagen. Prueba con otra."
      )
    } finally {
      setSubiendo(false)
      if (entrada.current) entrada.current.value = ""
    }
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    setGuardando(true)

    const ok = await guardarCampos({
      whatsapp: whatsapp.trim() || null,
      payment_instructions: instrucciones.trim() || null,
    })

    setGuardando(false)
    if (ok) {
      toast.success("Datos de cobro guardados.")
      router.refresh()
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-8">
      <div>
        <p className={ETIQUETA_CAMPO}>Tu QR para cobrar</p>
        <p className={cn(AYUDA_CAMPO, "mt-2 max-w-[56ch] leading-relaxed")}>
          El QR de tu banco. Es lo que ve quien compra, en la pantalla de pago,
          y contra lo que transfiere.
        </p>

        <div className="mt-5 flex flex-wrap items-start gap-5">
          <div className="size-32 shrink-0 border border-tinta/20 bg-white">
            {qrUrl ? (
              <Image
                src={qrUrl}
                alt="Tu QR de cobro"
                width={256}
                height={256}
                unoptimized
                className="size-full object-contain"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <QrCode aria-hidden="true" className="size-8 opacity-20" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              disabled={subiendo}
              className={BOTON_SECUNDARIO}
            >
              {subiendo ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <ImageUp aria-hidden="true" className="size-4" />
              )}
              {qrUrl ? "Cambiar el QR" : "Subir mi QR"}
            </button>

            {qrUrl ? (
              <button
                type="button"
                onClick={async () => {
                  if (await guardarCampos({ payment_qr_url: null })) {
                    setQrUrl(null)
                    toast.success("QR quitado.")
                    router.refresh()
                  }
                }}
                className="flex min-h-11 items-center gap-2 text-sm font-semibold opacity-70 transition-colors hover:text-senal hover:opacity-100"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Quitarlo
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => subirQr(e.target.files?.[0])}
        />
      </div>

      <label className="block">
        <span className={ETIQUETA_CAMPO}>WhatsApp de la tienda</span>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          type="tel"
          inputMode="tel"
          placeholder="59170000000"
          maxLength={30}
          className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
        />
        <span className={cn(AYUDA_CAMPO, "mt-2 block max-w-[56ch]")}>
          Con código de país, sin espacios ni signos. Es el botón por el que un
          comprador te escribe para coordinar la entrega.
        </span>
      </label>

      <label className="block">
        <span className={ETIQUETA_CAMPO}>Datos de tu cuenta</span>
        <textarea
          value={instrucciones}
          onChange={(e) => setInstrucciones(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder={
            "Banco Unión · Caja de ahorro 10000012345\nA nombre de Rosa Chávez"
          }
          className="mt-2 w-full resize-none rounded-none border-0 border-b border-tinta bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:ring-0 focus-visible:outline-none"
        />
        <span className={cn(AYUDA_CAMPO, "mt-2 block max-w-[56ch]")}>
          Por si alguien prefiere transferir sin escanear. Se muestra debajo del
          QR.
        </span>
      </label>

      <div>
        <button type="submit" disabled={guardando} className={BOTON_PRIMARIO}>
          {guardando ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Guardar
        </button>
      </div>
    </form>
  )
}
