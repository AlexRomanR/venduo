import type { Metadata } from "next"

import { getSiteUrl } from "@/lib/env"
import { getUsuario } from "@/lib/supabase/server"
import { Portada } from "@/components/portada/portada"

/**
 * Portada pública. La estrategia de esta superficie vive en
 * `.impeccable/surfaces/app-page-tsx.md`, y su sistema en `DESIGN.md`.
 */
export const metadata: Metadata = {
  title: "Venduo — tu tienda online, tu inventario y tus ventas",
  description:
    "Para quien vende por TikTok, Facebook, Instagram y WhatsApp: tu tienda online lista en minutos, con control de stock, pedidos por WhatsApp, catálogos en PDF y estadísticas.",
  // La tarjeta va acá y no en la raíz: una tienda sin logo la heredaría, y
  // su enlace por WhatsApp mostraría a Venduo en vez de la tienda.
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "Venduo",
    description: "Tu tienda online, tu inventario y tus ventas.",
    siteName: "Venduo",
    type: "website",
    images: [{ url: "/marca/compartir.png", width: 1200, height: 630 }],
  },
}

export default async function Inicio() {
  const user = await getUsuario()
  return <Portada conSesion={Boolean(user)} />
}
