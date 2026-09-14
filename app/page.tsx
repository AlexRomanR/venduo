import Link from "next/link"
import { ArrowRight, Store, Users } from "lucide-react"

import { getUser } from "@/lib/supabase/server"
import { formatMoney } from "@/lib/format"
import { PanelRaspable } from "@/components/landing/panel-raspable"

export const metadata = {
  title: "Venduo — tu tienda online en minutos",
}

/**
 * Portada pública.
 *
 * La estrategia de esta superficie vive en `.impeccable/surfaces/app-page-tsx.md`.
 */

/*
 * PENDIENTE: la tienda de ejemplo todavía no existe. El equipo la crea
 * registrándose y cargando productos. Cuando exista, poner acá su slug y el
 * bloque se vuelve un enlace navegable.
 */
const TIENDA_EJEMPLO: string | null = null

/*
 * PENDIENTE: estas cifras son material de pitch sin fuente verificada. No se
 * muestran hasta tener el origen, porque la sección las presenta con su
 * fuente a la vista. No inventar una referencia plausible.
 */
const CIFRAS: Array<{ dato: string; texto: string; fuente: string }> = []

// Ejemplo, no una promesa: la comisión la define cada emprendedor.
const COMISION_EJEMPLO_BPS = 1500
const VENTA_EJEMPLO_CENTS = 30000

export default async function Inicio() {
  const user = await getUser()
  const ganancia = (VENTA_EJEMPLO_CENTS * COMISION_EJEMPLO_BPS) / 10000

  return (
    <div className="campo-recarga min-h-screen bg-recarga text-white">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-5">
        <span className="flex-1 font-denominacion text-lg tracking-tight">
          VENDUO
        </span>
        <Link
          href={user ? "/panel" : "/login"}
          className="rounded-md px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
        >
          {user ? "Ir a mi panel" : "Entrar"}
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="pt-6 pb-14 sm:pt-10">
          <h1 className="max-w-[16ch] text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:max-w-[20ch] sm:text-6xl">
            Él no puede pagar un sueldo. Tú no consigues trabajo que deje
            rastro.
          </h1>
          <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-white/85 sm:text-lg">
            Venduo convierte su negocio en una tienda online, y te deja
            venderla. Cada venta tuya te paga una comisión y queda anotada a tu
            nombre.
          </p>
        </section>

        {/* La denominación: la escala manda, no un contenedor. */}
        <section
          aria-labelledby="denominacion"
          className="border-y border-white/15 py-10 sm:py-14"
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-center sm:gap-10">
            <p
              id="denominacion"
              className="tabular font-denominacion text-[clamp(5rem,26vw,11rem)] leading-[0.78] tracking-[-0.04em] text-denominacion"
            >
              {COMISION_EJEMPLO_BPS / 100}%
            </p>
            <p className="max-w-[22ch] text-center text-sm leading-relaxed text-white/75 sm:pb-4 sm:text-left">
              es lo que un emprendedor puede dejarte por cada venta. Lo define
              él, y queda congelado el día que vendes.
            </p>
          </div>

          <div className="mx-auto mt-9 w-full max-w-sm">
            <PanelRaspable>
              <p className="text-xs tracking-wide uppercase opacity-70">
                Vendes {formatMoney(VENTA_EJEMPLO_CENTS)}, ganas
              </p>
              <p className="tabular mt-1 font-denominacion text-4xl tracking-tight">
                {formatMoney(ganancia)}
              </p>
              <p className="mt-2 font-mono text-xs tracking-[0.2em] opacity-60">
                TU CÓDIGO · K7M2QP4
              </p>
            </PanelRaspable>
            <p className="mt-3 text-center text-xs text-white/55">
              Ejemplo. Cada tienda define su propia comisión.
            </p>
          </div>
        </section>

        {/* Las dos acciones, del ancho de la tarjeta y sin scroll de por medio. */}
        <section
          aria-label="Empezar"
          className="grid gap-3 py-10 sm:grid-cols-2"
        >
          <CaminoTarjeta
            href="/login?rol=emprendedor"
            icono={Store}
            titulo="Tengo un negocio"
            detalle="Tu tienda online, cobro por QR y una red que vende por ti."
          />
          <CaminoTarjeta
            href="/login?rol=vendedor"
            icono={Users}
            titulo="Quiero vender"
            detalle="Gana comisión y construye un historial de trabajo verificable."
          />
        </section>

        <ElCircuito />

        {CIFRAS.length > 0 ? (
          <section
            aria-label="El problema"
            className="border-t border-white/15 pt-10"
          >
            <ul className="grid gap-6 sm:grid-cols-3">
              {CIFRAS.map((c) => (
                <li key={c.dato}>
                  <p className="tabular font-denominacion text-5xl tracking-[-0.04em] text-denominacion">
                    {c.dato}
                  </p>
                  <p className="mt-2 text-sm text-white/80">{c.texto}</p>
                  <p className="mt-1 text-xs text-white/50">{c.fuente}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {TIENDA_EJEMPLO ? (
          <section className="border-t border-white/15 pt-10">
            <Link
              href={`/t/${TIENDA_EJEMPLO}`}
              className="group inline-flex items-center gap-2 text-base font-medium text-white underline underline-offset-4"
            >
              Mira una tienda hecha con Venduo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  )
}

function CaminoTarjeta({
  href,
  icono: Icono,
  titulo,
  detalle,
}: {
  href: string
  icono: typeof Store
  titulo: string
  detalle: string
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[7.5rem] flex-col justify-between rounded-md bg-carton p-5 text-tinta shadow-[0_2px_10px_rgba(20,6,15,0.28)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(20,6,15,0.34)]"
    >
      <Icono className="size-5 text-recarga" aria-hidden="true" />
      <div className="mt-4">
        <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {titulo}
          <ArrowRight
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
            aria-hidden="true"
          />
        </p>
        <p className="mt-1 text-sm leading-relaxed opacity-70">{detalle}</p>
      </div>
    </Link>
  )
}

/**
 * El circuito como una tira perforada que desciende: un solo hilo continuo,
 * no tres tarjetas de características.
 */
function ElCircuito() {
  const pasos = [
    {
      titulo: "El negocio se vuelve tienda",
      detalle:
        "Describe lo que vendes. La IA arma el catálogo, los textos y la página, y tú la corriges hasta que sea tuya.",
    },
    {
      titulo: "Alguien sale a venderla",
      detalle:
        "Se suma con un código, recibe su enlace y su QR, y vende por donde ya se mueve: WhatsApp, TikTok, el barrio.",
    },
    {
      titulo: "La venta queda a su nombre",
      detalle:
        "El enlace la atribuye sola. La comisión se calcula, se congela y se suma a un historial que nadie puede editar.",
    },
  ]

  return (
    <section
      aria-label="Cómo funciona"
      className="border-t border-white/15 py-12"
    >
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Una sola venta, dos personas que ganan
      </h2>

      <ol className="mt-8 border-l border-dashed border-white/30 pl-6 sm:pl-8">
        {pasos.map((paso, i) => (
          <li
            key={paso.titulo}
            className={i === pasos.length - 1 ? "relative" : "relative pb-9"}
          >
            <span
              aria-hidden="true"
              className="absolute top-2 -left-[1.6rem] size-2.5 rounded-full bg-denominacion sm:-left-[2.1rem]"
            />
            <h3 className="text-lg font-semibold tracking-tight">
              {paso.titulo}
            </h3>
            <p className="mt-1.5 max-w-[58ch] text-sm leading-relaxed text-white/80">
              {paso.detalle}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
