import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, WandSparkles } from "lucide-react"

import { getMiTienda } from "@/lib/data/panel"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { isSupabaseConfigured } from "@/lib/env"
import { urlDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { Pasos, PASOS_CREAR } from "@/components/onboarding/pasos"
import { Miniatura } from "@/components/plantillas/miniatura"

export const metadata = { title: "Tu tienda está lista" }

/**
 * Paso 3 del alta: la tienda ya existe, y se ofrece darle estilo.
 *
 * Es una oferta y no una puerta. Quien quiere cargar productos primero va a su
 * panel con un toque; el editor lo espera en Apariencia.
 */
export default async function ListoPage() {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const nombre = tienda?.name ?? "Tu tienda"
  const url = tienda ? urlDeTienda(tienda.slug) : null

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
      <Pasos pasos={PASOS_CREAR} actual={3} />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Tu tienda ya existe
          </p>
          <h1 className="mt-4 max-w-[16ch] font-titular text-[clamp(2.25rem,7vw,3.5rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
            Ahora, que se vea como tu negocio.
          </h1>
          <p className="mt-5 max-w-[50ch] text-lg leading-relaxed opacity-70">
            Tu logo, tus colores, tu letra y los textos de tu portada. Lo ves
            todo al instante en tu tienda de verdad, y tus clientes no ven nada
            hasta que publiques.
          </p>

          <ul className="mt-8 max-w-[46ch] border-t border-tinta/15 text-sm">
            <li className="border-b border-tinta/15 py-3">
              Arrastra las secciones para ordenarlas.
            </li>
            <li className="border-b border-tinta/15 py-3">
              Sube tu logo y tus fotos.
            </li>
            <li className="flex items-center gap-2 border-b border-tinta/15 py-3">
              <WandSparkles
                aria-hidden="true"
                className="size-4 shrink-0 text-senal"
              />
              O pídeselo a la IA en tus palabras.
            </li>
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/editor?bienvenida=1"
              className={cn(BOTON_PRIMARIO, "px-7")}
            >
              Personalizar ahora
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/panel" className={BOTON_SECUNDARIO}>
              Más tarde, ir a mi panel
            </Link>
          </div>
          <p className="mt-5 text-sm opacity-55">
            Lo encuentras cuando quieras en Apariencia, dentro de tu panel.
          </p>
        </div>

        <div className="lg:pt-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            {nombre}
          </p>
          <div className="mt-5 border-t-2 border-tinta pt-5">
            <Miniatura
              clave={tienda?.template_key ?? "fashion"}
              className="border border-tinta"
            />
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 inline-flex min-h-11 items-center font-mono text-sm break-all opacity-60 transition-opacity hover:opacity-100"
              >
                {url.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
