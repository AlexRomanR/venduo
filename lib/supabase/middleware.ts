import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { env, isSupabaseConfigured } from "@/lib/env"
import { slugDesdeHost } from "@/lib/tienda"

/** Rutas que exigen sesión iniciada. */
const PROTECTED_PREFIXES = [
  "/panel",
  "/editor",
  "/vendedor",
  "/cuenta",
  "/crear",
  "/sumarme",
  "/explorar",
]

/**
 * Refresca el token de Supabase en cada request y protege las áreas privadas.
 * Sin credenciales configuradas deja pasar todo (modo demo).
 */
/**
 * `rosa-deportes.venduo.com` es `/t/rosa-deportes`.
 *
 * Una reescritura y no una redirección: la barra de direcciones tiene que
 * seguir mostrando el subdominio, que es el punto de tenerlo. La ruta `/t/…`
 * sigue existiendo y sirviendo lo mismo, así que un enlace ya impreso no deja
 * de funcionar el día que se enciende el dominio.
 *
 * Mientras `NEXT_PUBLIC_DOMINIO_TIENDAS` esté vacío esto no hace nada.
 */
function reescribirSubdominio(request: NextRequest) {
  const slug = slugDesdeHost(request.headers.get("host"))
  if (!slug) return null

  const { pathname } = request.nextUrl
  // Ya reescrito, o es una ruta interna que no pertenece a la tienda.
  if (pathname.startsWith("/t/") || pathname.startsWith("/_next")) return null

  const url = request.nextUrl.clone()
  url.pathname = `/t/${slug}${pathname === "/" ? "" : pathname}`
  return url
}

export async function updateSession(request: NextRequest) {
  const destino = reescribirSubdominio(request)
  let response = destino
    ? NextResponse.rewrite(destino, { request })
    : NextResponse.next({ request })

  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          // Se rehace la respuesta conservando la reescritura: recrearla con
          // `next()` a secas mandaría el subdominio a la portada.
          response = destino
            ? NextResponse.rewrite(destino, { request })
            : NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // No poner lógica entre createServerClient y getUser: rompe el refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (!user && needsAuth) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return response
}
