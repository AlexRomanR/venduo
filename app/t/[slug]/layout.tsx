import type { Metadata } from "next"

import { getTiendaPublica } from "@/lib/data/tienda-publica"
import { urlDeTienda } from "@/lib/tienda"

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

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-papel text-tinta">{children}</div>
}
