import Link from "next/link"

/**
 * Chrome de las pantallas de alta: `/crear` y `/sumarme`.
 *
 * Están en el mundo editorial y no en el de los paneles a propósito. Son la
 * continuación directa del ingreso —nadie ha empezado a trabajar todavía— y
 * es donde una persona decide si sigue o se va. Los paneles empiezan después,
 * con los tokens de shadcn.
 */
export function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-papel text-tinta">
      <header className="border-b border-tinta/15">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <Link
            href="/"
            className="flex min-h-11 flex-1 items-center font-titular text-lg font-extrabold tracking-[-0.02em]"
          >
            Venduo
          </Link>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="flex min-h-11 items-center text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-tinta/15">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm opacity-60">
          Venduo · Santa Cruz · La Paz · Cochabamba
        </div>
      </footer>
    </div>
  )
}
