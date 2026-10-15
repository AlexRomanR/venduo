import Link from "next/link"
import type { ReactNode } from "react"

import { CORREO_DE_CONTACTO } from "@/lib/legal"
import { Logo } from "@/components/marca/logo"

/**
 * El armazón de una página de texto de Venduo: privacidad, términos, borrar la
 * cuenta. Es para leer, así que va angosta —unos 65 caracteres por renglón—
 * y con las secciones numeradas, que es como se cita un texto así.
 */
export function PaginaLegal({
  titulo,
  bajada,
  vigente,
  children,
}: {
  titulo: string
  bajada: string
  /** Desde cuándo vale el texto. Las páginas que solo explican algo no lo llevan. */
  vigente?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-papel text-tinta">
      <header className="border-b border-tinta/15">
        <div className="mx-auto flex max-w-3xl items-center px-5 py-3.5">
          <Link href="/" aria-label="Venduo, la portada" className="text-lg">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <h1 className="font-titular text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] md:text-5xl">
          {titulo}
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed opacity-70">
          {bajada}
        </p>
        {vigente ? (
          <p className="mt-6 text-sm opacity-65">Vigente desde el {vigente}.</p>
        ) : null}

        <div className="mt-10 flex max-w-[65ch] flex-col gap-10 border-t border-tinta/15 pt-10">
          {children}
        </div>
      </main>

      <footer className="border-t border-tinta/15">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 px-5 py-8 text-sm opacity-70">
          <Link
            href="/privacidad"
            className="min-h-11 content-center hover:opacity-100"
          >
            Privacidad
          </Link>
          <Link
            href="/terminos"
            className="min-h-11 content-center hover:opacity-100"
          >
            Términos
          </Link>
          <Link
            href="/borrar-cuenta"
            className="min-h-11 content-center hover:opacity-100"
          >
            Borrar tu cuenta
          </Link>
          <a
            href={`mailto:${CORREO_DE_CONTACTO}`}
            className="min-h-11 content-center hover:opacity-100"
          >
            {CORREO_DE_CONTACTO}
          </a>
        </div>
      </footer>
    </div>
  )
}

/** Una sección numerada del texto. */
export function Apartado({
  numero,
  titulo,
  children,
}: {
  numero: number
  titulo: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={`apartado-${numero}`}
      className="flex flex-col gap-3 text-base leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-semibold [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5"
    >
      <h2
        id={`apartado-${numero}`}
        className="font-titular text-xl font-bold tracking-[-0.02em]"
      >
        <span className="mr-2 tabular-nums opacity-55">{numero}.</span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

/** El correo de soporte, como enlace. */
export function Correo() {
  return <a href={`mailto:${CORREO_DE_CONTACTO}`}>{CORREO_DE_CONTACTO}</a>
}
