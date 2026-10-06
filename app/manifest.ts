import type { MetadataRoute } from "next"

import { COLORES_DE_MARCA } from "@/lib/marca"

/**
 * El ícono y el nombre al agregar Venduo a la pantalla de inicio del celular.
 * No es una aplicación instalable: se abre en el navegador, como siempre.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Venduo",
    short_name: "Venduo",
    description: "Tu tienda online, tu inventario y tus ventas.",
    start_url: "/auth/destino",
    display: "browser",
    background_color: COLORES_DE_MARCA.papel,
    theme_color: COLORES_DE_MARCA.papel,
    icons: [
      { src: "/marca/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/marca/icono-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/marca/icono-adaptable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
