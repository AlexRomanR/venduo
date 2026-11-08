import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CircleAlert, GalleryVerticalEnd, QrCode, Send } from "lucide-react"

import { rutaDeVistaDePlantilla } from "@/lib/api/miniaturas"
import { getBarraLateral } from "@/lib/data/barra"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import {
  PastillaDeEnlace,
  QrDeTienda,
  RedesParaCompartir,
  TarjetasDeHistoria,
} from "@/components/panel/compartir"
import { Cabecera, Seccion } from "@/components/panel/piezas"

export const metadata = { title: "Compartir" }

/**
 * Compartir: llevar la tienda a donde ya se vende. La misma pantalla de la app
 * (`(compartir)/compartir`): arriba la tienda como la ve quien compra, su
 * enlace —se toca y se copia— y un botón por red; después, tarjetas para
 * historias hechas con la tienda, y el QR para el puesto.
 */
export default async function CompartirPage() {
  const [barra, mia] = await Promise.all([getBarraLateral(), getMiTienda()])
  if (isSupabaseConfigured && !mia?.template_key) redirect("/crear")
  const tienda = barra.tienda
  if (!tienda) redirect("/crear")

  const legible = tienda.url.replace(/^https?:\/\//, "")
  const mensaje = `Hola, te comparto mi tienda ${tienda.nombre}: ${tienda.url}`
  const vista =
    mia?.vista_url ?? rutaDeVistaDePlantilla(mia?.template_key ?? null)
  const aLaVista = tienda.publicada && !tienda.pausada

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Comparte tu tienda."
        resaltar="tu tienda"
        bajada="Llévala a donde ya vendes: tus chats, tus historias, tu puesto."
      />

      {aLaVista ? null : (
        <div className="flex items-start gap-3 rounded-[16px] border-2 border-senal px-4 py-3.5 text-senal">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="font-semibold">
            {tienda.pausada ? (
              "Venduo pausó tu tienda: nadie la ve."
            ) : (
              <>
                Tu tienda está en borrador: nadie la ve todavía.{" "}
                <Link
                  href="/cuenta"
                  className="underline underline-offset-4"
                >
                  Publícala
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      <Seccion
        id="tu-tienda"
        icono={Send}
        titulo="Tu tienda"
        bajada="Toca el enlace para copiarlo."
        relleno
      >
        <div className="flex items-center gap-5">
          <span className="relative block aspect-[9/19] w-24 shrink-0 overflow-hidden rounded-[18px] border-4 border-tinta bg-tinta/[0.05]">
            <Image
              src={vista}
              alt=""
              fill
              unoptimized
              sizes="96px"
              className="object-cover object-top"
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="font-titular text-xl leading-tight font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere]">
              {tienda.nombre}
            </p>
            <PastillaDeEnlace url={tienda.url} legible={legible} />
          </div>
        </div>
        <RedesParaCompartir mensaje={mensaje} url={tienda.url} />
      </Seccion>

      <Seccion
        id="historias"
        icono={GalleryVerticalEnd}
        titulo="Para tus historias"
        bajada="Una imagen vertical con tu tienda, para Instagram, TikTok o tu estado de WhatsApp."
        relleno
      >
        <TarjetasDeHistoria slug={tienda.slug} />
      </Seccion>

      <Seccion
        id="qr"
        icono={QrCode}
        titulo="Tu QR"
        bajada="Quien lo escanea llega a tu tienda."
        relleno
      >
        <QrDeTienda
          nombre={tienda.nombre}
          slug={tienda.slug}
          url={tienda.url}
        />
      </Seccion>
    </div>
  )
}
