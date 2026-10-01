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

  experimental: {
    // Cuánto reutiliza el navegador una pantalla ya traída antes de volver a
    // pedirla. `dynamic` es la que se visitó: ir y volver entre dos secciones
    // dentro de medio minuto no espera a la base. `static` es la que se trajo
    // de antemano —los enlaces de la barra lo hacen con `prefetch`—: un
    // minuto y no los cinco de fábrica, para que un pedido que llega mientras
    // tanto se vea pronto. Lo que cambia la propia persona se ve al instante:
    // cada acción que guarda revalida o refresca, y eso vacía esta memoria.
    staleTimes: {
      dynamic: 30,
      static: 60,
    },
  },

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
