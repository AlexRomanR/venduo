import { Suspense } from "react"
import type { Metadata, Viewport } from "next"

import {
  esTiendaVaciaDeQuienMira,
  getTiendaPublica,
} from "@/lib/data/tienda-publica"
import { urlDeTienda } from "@/lib/tienda"
import { EstiloDePlantilla } from "@/components/plantillas/estilo"
import { AvisoDeVacaciones } from "@/components/tienda/aviso-de-vacaciones"
import { AvisoSinProductos } from "@/components/tienda/aviso-sin-productos"
import { ProveedorCarrito } from "@/components/tienda/carrito"

/**
 * La tienda pública tiene su propio marco, sin el armazón del panel.
 *
 * Quien entra acá es un comprador que llegó de un enlace de WhatsApp o de un
 * QR: no tiene cuenta y no debe ver navegación de la aplicación.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tienda = await getTiendaPublica(slug)

  if (!tienda) return { title: "Tienda no encontrada" }

  const descripcion =
    tienda.descripcion ?? `Compra en ${tienda.nombre} y coordina por WhatsApp.`

  // Esto es lo que se ve cuando alguien pega el enlace en WhatsApp, que es por
  // donde va a viajar. Sin la tarjeta, el enlace se ve como texto suelto.
  return {
    title: { absolute: `${tienda.nombre} · Venduo` },
    description: descripcion,
    openGraph: {
      title: tienda.nombre,
      description: descripcion,
      url: urlDeTienda(slug),
      siteName: "Venduo",
      type: "website",
      images: tienda.logoUrl ? [{ url: tienda.logoUrl }] : undefined,
    },
  }
}

/** La barra del navegador del celular toma el color del papel de la tienda. */
export async function generateViewport({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Viewport> {
  const { slug } = await params
  const tienda = await getTiendaPublica(slug)
  return tienda ? { themeColor: tienda.apariencia.colores.papel } : {}
}

async function AvisoAlDueno({
  tiendaId,
  slug,
}: {
  tiendaId: string
  slug: string
}) {
  return (await esTiendaVaciaDeQuienMira(tiendaId)) ? (
    <AvisoSinProductos slug={slug} />
  ) : null
}

export default async function TiendaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // La misma lectura que la página: `getTiendaPublica` está en caché por visita.
  const tienda = await getTiendaPublica(slug)

  return (
    <ProveedorCarrito
      slug={slug}
      tienda={tienda && !tienda.esDemo ? tienda.id : undefined}
      vacaciones={tienda?.vacaciones ?? null}
    >
      {/* El tema se pinta en el servidor, junto con el HTML: si esperara al
          navegador, la tienda aparecería un instante con los colores de
          Venduo antes de tomar los suyos. */}
      {tienda ? <EstiloDePlantilla apariencia={tienda.apariencia} /> : null}
      <div
        data-plantilla={tienda?.plantilla}
        className="flex min-h-screen flex-col bg-papel text-tinta"
      >
        {/* Encima de cualquier plantilla, sin preguntar cuál es: solo usa los
            colores de la tienda. */}
        {tienda?.vacaciones ? (
          <AvisoDeVacaciones hasta={tienda.vacaciones.hasta} />
        ) : null}
        {children}
      </div>
      {/* Solo se pregunta quién mira si la tienda está vacía, y sin hacer
          esperar a la página: quien compra no paga esta consulta. */}
      {tienda && !tienda.esDemo && tienda.productos.length === 0 ? (
        <Suspense fallback={null}>
          <AvisoAlDueno tiendaId={tienda.id} slug={tienda.slug} />
        </Suspense>
      ) : null}
    </ProveedorCarrito>
  )
}
