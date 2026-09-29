import type { NextConfig } from "next"

/** Host de Supabase, para permitir sus imágenes en next/image. */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  // `@react-pdf/renderer` arma el documento con un reconciliador propio y
  // lee las fuentes del disco: empaquetarlo lo rompe. Se deja que el runtime
  // lo cargue tal cual desde node_modules.
  serverExternalPackages: ["@react-pdf/renderer"],

  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/**",
            },
          ]
        : []),
      // Fotografía de uso libre para la portada, mientras no haya imágenes
      // propias. Unsplash permite enlazar desde su CDN.
      {
        protocol: "https" as const,
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
