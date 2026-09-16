import Link from "next/link"
import { Plus } from "lucide-react"

import { getUser } from "@/lib/supabase/server"
import { Cifra } from "@/components/landing/cifra"
import { DemoTienda } from "@/components/landing/demo-tienda"
import { Entra } from "@/components/landing/entra"
import { Foto } from "@/components/landing/foto"

export const metadata = {
  title: "Venduo — tu tienda online en minutos",
}

/**
 * Portada pública.
 *
 * La estrategia de esta superficie vive en `.impeccable/surfaces/app-page-tsx.md`.
 *
 * Las cifras y los ejemplos son ilustrativos de lo que el producto va a
 * mostrar, no medidas de uso real. Cada bloque que los usa lo dice al pie.
 */

/*
 * PENDIENTE: la tienda de ejemplo todavía no existe. El equipo la crea
 * registrándose y cargando productos. Cuando exista, poner acá su slug.
 */
const TIENDA_EJEMPLO: string | null = null

const PASOS = [
  {
    n: "01",
    titulo: "Cuentas qué vendes",
    detalle:
      "Escribes o dictas un párrafo: qué productos, a qué precio, a quién le vendes. Puedes pegar las fotos que ya tienes.",
  },
  {
    n: "02",
    titulo: "Eliges una plantilla",
    detalle:
      "La IA llena el catálogo, escribe las descripciones y ordena las categorías. Tú corriges lo que no te cuadra, con el mismo editor.",
  },
  {
    n: "03",
    titulo: "Publicas y cobras",
    detalle:
      "Compartes el enlace en tus mismos canales. El cliente paga por QR y cada venta entra sola a tus estadísticas.",
  },
]

const MODULOS = [
  {
    titulo: "Editor con IA",
    detalle:
      "Le hablas y la tienda cambia: precios, textos, categorías, portada. Sin tocar una línea de código.",
  },
  {
    titulo: "Cobro por QR",
    detalle:
      "El QR de tu banco o billetera en cada pedido, con el comprobante adjunto a la venta.",
  },
  {
    titulo: "Inteligencia de negocio",
    detalle:
      "Qué se vende, cuándo y cuánto. Le preguntas en tus palabras y te responde con un gráfico.",
  },
  {
    titulo: "Marketing con IA",
    detalle:
      "Textos para Facebook y WhatsApp, hechos con tu propio catálogo y tu forma de hablar.",
  },
  {
    titulo: "Red de vendedores",
    detalle:
      "Activas vendedores que trabajan a comisión. Cada uno con su enlace, su QR y su registro.",
  },
  {
    titulo: "Segunda mano",
    detalle:
      "Lo usado también se vende. Publicas reacondicionados en la misma tienda, con otra etiqueta.",
  },
]

const PREGUNTAS = [
  {
    p: "¿Necesito saber de computación?",
    r: "No. Si sabes mandar un audio por WhatsApp, sabes usar Venduo. Describes tu negocio, la IA arma la tienda y tú corriges lo que no te guste.",
  },
  {
    p: "¿Cuánto cuesta?",
    r: "Crear la tienda y publicarla no cuesta nada. Los planes con dominio propio y más vendedores llegan después.",
  },
  {
    p: "¿Cómo me pagan mis clientes?",
    r: "Con el QR de tu banco o billetera, en cada pedido. El cliente escanea, paga y sube su comprobante; tú confirmas y la venta entra a tus estadísticas.",
  },
  {
    p: "¿Qué gana el vendedor?",
    r: "La comisión que define cada tienda, y un historial con su nombre que puede mostrar después. El vendedor no paga nada, nunca.",
  },
  {
    p: "¿Qué es el historial laboral verificable?",
    r: "Una hoja de vida que se arma sola: cuántas ventas hiciste, con qué tiendas y desde cuándo. Nadie la edita a mano, y se comparte con un enlace.",
  },
  {
    p: "Ya me va bien por WhatsApp. ¿Para qué cambio?",
    r: "No cambias: sigue vendiendo ahí. Venduo te pone el catálogo, el cobro y los números detrás, y el enlace de tu tienda lo pegas en el mismo chat.",
  },
]

export default async function Inicio() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-papel text-tinta">
      <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <span className="flex-1 font-titular text-lg font-extrabold tracking-[-0.02em]">
            Venduo
          </span>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#como-funciona" className="opacity-70 hover:opacity-100">
              Cómo funciona
            </a>
            <a href="#modulos" className="opacity-70 hover:opacity-100">
              Módulos
            </a>
            <a href="#vendedores" className="opacity-70 hover:opacity-100">
              Vendedores
            </a>
            <a href="#preguntas" className="opacity-70 hover:opacity-100">
              Preguntas
            </a>
          </nav>

          {/* Quien ya tiene cuenta entraba por la misma puerta que quien
              viene a crear una, y no la encontraba. */}
          {user ? null : (
            <Link
              href="/login"
              className="flex min-h-11 items-center px-1 text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
            >
              Ingresar
            </Link>
          )}

          <Link
            href={user ? "/auth/destino" : "/login?rol=emprendedor"}
            className="flex min-h-11 items-center rounded-sm bg-senal px-4 text-sm font-semibold text-white transition-colors hover:bg-senal-alta"
          >
            {user ? "Ir a mi panel" : "Crear mi tienda"}
          </Link>
        </div>
      </header>

      <main>
        {/* El mecanismo funcionando en el primer viewport, no explicado. */}
        <section className="mx-auto max-w-6xl px-5 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <h1 className="max-w-[13ch] font-titular text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.97] font-extrabold tracking-[-0.035em] text-balance">
                Cuenta qué vendes. Venduo arma la tienda.
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed opacity-70">
                Ya vendes por TikTok, Facebook o WhatsApp. Describe tu negocio
                en un párrafo, elige una plantilla y en minutos tienes tienda
                online con catálogo, cobro por QR y estadísticas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login?rol=emprendedor"
                  className="rounded-sm bg-senal px-5 py-3 font-semibold text-white transition-colors hover:bg-senal-alta"
                >
                  Crear mi tienda
                </Link>
                <Link
                  href="/login?rol=vendedor"
                  className="rounded-sm border-2 border-tinta px-5 py-3 font-semibold transition-colors hover:bg-tinta hover:text-white"
                >
                  Quiero vender
                </Link>
              </div>
            </div>

            <DemoTienda />
          </div>
        </section>

        <section className="border-y border-tinta/15">
          <div className="mx-auto grid max-w-6xl gap-9 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <Cifra
              valor={8}
              sufijo=" min"
              detalle="Promedio en publicar una tienda"
            />
            <Cifra
              valor={10}
              sufijo="%"
              detalle="Comisión para el vendedor, por venta"
            />
            <Cifra valor={4100} detalle="Vendedores con historial activo" />
            <Cifra valor={0} prefijo="Bs " detalle="Para abrir y publicar" />
          </div>
          <div className="mx-auto max-w-6xl px-5 pb-8">
            <p className="text-xs opacity-45">
              Cifras ilustrativas de la demostración. Venduo está en desarrollo.
            </p>
          </div>
        </section>

        {/* Las dos audiencias, cada una con su promesa y su acción. */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-12 sm:grid-cols-2 sm:gap-14">
            <Entra>
              <div className="border-t-2 border-tinta pt-6">
                <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                  Para quien ya vende
                </p>
                <h2 className="mt-5 max-w-[15ch] font-titular text-[clamp(1.75rem,4.5vw,2.4rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
                  Monta tu tienda hablando, no programando.
                </h2>
                <p className="mt-4 max-w-[46ch] leading-relaxed opacity-70">
                  Le cuentas a la IA qué vendes, a quién y a qué precio. Ella
                  arma el catálogo, los textos y las promociones. Tú revisas y
                  publicas.
                </p>
                <Link
                  href="/login?rol=emprendedor"
                  className="mt-7 inline-block rounded-sm bg-senal px-5 py-3 font-semibold text-white transition-colors hover:bg-senal-alta"
                >
                  Crear mi tienda gratis
                </Link>
                <p className="mt-3 text-sm opacity-55">
                  Lista en menos de 10 minutos. No pedimos tarjeta.
                </p>
              </div>
            </Entra>

            <Entra demora={90}>
              <div className="border-t-2 border-tinta pt-6">
                <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                  Para quien quiere vender
                </p>
                <h2 className="mt-5 max-w-[15ch] font-titular text-[clamp(1.75rem,4.5vw,2.4rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
                  Súmate a una tienda y arma tu historial.
                </h2>
                <p className="mt-4 max-w-[46ch] leading-relaxed opacity-70">
                  Eliges una tienda, vendes con tu propio enlace y ganas
                  comisión. Cada venta queda registrada a tu nombre.
                </p>
                <Link
                  href="/login?rol=vendedor"
                  className="mt-7 inline-block rounded-sm border-2 border-tinta px-5 py-3 font-semibold transition-colors hover:bg-tinta hover:text-white"
                >
                  Sumarme como vendedor
                </Link>
                <p className="mt-3 text-sm opacity-55">
                  Desde los 16 años. Sin inversión inicial.
                </p>
              </div>
            </Entra>
          </div>
        </section>

        <section
          id="como-funciona"
          className="scroll-mt-20 border-t border-tinta/15"
        >
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                  Cómo funciona
                </p>
                <ol className="mt-8">
                  {PASOS.map((paso, i) => (
                    <Entra key={paso.n} demora={i * 70}>
                      <li className="flex gap-5 border-t border-tinta/15 py-6">
                        <span className="tabular pt-1 font-titular text-sm font-bold opacity-40">
                          {paso.n}
                        </span>
                        <div>
                          <h3 className="font-titular text-xl font-bold tracking-[-0.02em]">
                            {paso.titulo}
                          </h3>
                          <p className="mt-2 max-w-[48ch] text-sm leading-relaxed opacity-70">
                            {paso.detalle}
                          </p>
                        </div>
                      </li>
                    </Entra>
                  ))}
                </ol>
              </div>

              <Entra className="lg:pt-10">
                <Foto
                  id="1687422808248-f807f4ea2a2e"
                  alt="Comerciante revisando pedidos en su teléfono"
                  pie="El negocio que ya existe, con el celular como mostrador."
                  ratio="aspect-[4/5]"
                />
              </Entra>
            </div>
          </div>
        </section>

        <section
          id="modulos"
          className="scroll-mt-20 border-t border-tinta/15 py-20"
        >
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Qué viene adentro
            </p>
            <h2 className="mt-5 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
              Todo lo que antes hacías en cinco apps distintas.
            </h2>

            <div className="mt-12 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {MODULOS.map((m, i) => (
                <Entra key={m.titulo} demora={(i % 3) * 70}>
                  <div className="group border-t border-tinta/15 py-6 transition-colors hover:border-senal">
                    <h3 className="font-titular text-lg font-bold tracking-[-0.02em] transition-colors group-hover:text-senal">
                      {m.titulo}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed opacity-70">
                      {m.detalle}
                    </p>
                  </div>
                </Entra>
              ))}
            </div>
          </div>
        </section>

        {/* Tríptico: quién está del otro lado. */}
        <section className="border-t border-tinta/15 py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-3">
            <Entra>
              <Foto
                id="1573633509389-0e3075dea01b"
                alt="Joven mostrando su teléfono"
                pie="Vender por el mismo canal donde ya estás."
                ratio="aspect-[3/4]"
              />
            </Entra>
            <Entra demora={80}>
              <Foto
                id="1516055619834-586f8c75d1de"
                alt="Entrega de un pedido en la puerta"
                pie="La entrega se coordina por WhatsApp, entre las dos personas."
                ratio="aspect-[3/4]"
              />
            </Entra>
            <Entra demora={160}>
              <Foto
                id="1537511446984-935f663eb1f4"
                alt="Taller pequeño con mercadería"
                pie="El depósito de donde sale el pedido."
                ratio="aspect-[3/4]"
              />
            </Entra>
          </div>
        </section>

        {/* El bloque rojo: la tesis del proyecto, dicha sin adorno. */}
        <section
          id="vendedores"
          className="campo-senal scroll-mt-20 bg-senal text-white"
        >
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
            <h2 className="max-w-[20ch] font-titular text-[clamp(2rem,6vw,3.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
              Siete de cada diez jóvenes que trabajan en Bolivia lo hacen sin
              contrato, sin recibo y sin nada que lo demuestre.
            </h2>
            <p className="mt-8 max-w-[34ch] font-titular text-xl leading-snug font-bold sm:text-2xl">
              Venduo convierte cada venta en un registro con nombre, fecha y
              monto. Eso, juntado, es un historial laboral.
            </p>
            <Link
              href="/login?rol=vendedor"
              className="mt-9 inline-block rounded-sm border-2 border-white px-5 py-3 font-semibold transition-colors hover:bg-white hover:text-senal"
            >
              Sumarme como vendedor
            </Link>
            <p className="mt-8 max-w-[60ch] text-xs leading-relaxed text-white/65">
              Estimación propia de Venduo sobre empleo juvenil urbano; el dato
              oficial varía según la fuente y el año.
            </p>
          </div>
        </section>

        <section
          id="preguntas"
          className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20"
        >
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Preguntas
          </p>
          <h2 className="mt-5 max-w-[16ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
            Lo que todos nos preguntan primero.
          </h2>

          {/* <details> nativo: accesible, sin JavaScript, sin dependencias. */}
          <div className="mt-12">
            {PREGUNTAS.map((q) => (
              <details
                key={q.p}
                className="group border-t border-tinta/15 [&[open]_.mas]:rotate-45"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-start gap-4 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 font-titular font-bold tracking-[-0.01em] transition-colors group-hover:text-senal">
                    {q.p}
                  </span>
                  <Plus
                    aria-hidden="true"
                    className="mas mt-0.5 size-5 shrink-0 text-senal transition-transform duration-300 ease-out"
                  />
                </summary>
                <p className="max-w-[68ch] pb-7 leading-relaxed opacity-70">
                  {q.r}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-tinta/15">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-[12ch] font-titular text-[clamp(2.25rem,7vw,4rem)] leading-[1] font-extrabold tracking-[-0.035em]">
              Abre la tienda hoy. Vende esta semana.
            </h2>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/login?rol=emprendedor"
                className="rounded-sm bg-senal px-5 py-3 font-semibold text-white transition-colors hover:bg-senal-alta"
              >
                Crear mi tienda gratis
              </Link>
              <Link
                href="/login?rol=vendedor"
                className="rounded-sm border-2 border-tinta px-5 py-3 font-semibold transition-colors hover:bg-tinta hover:text-white"
              >
                Sumarme como vendedor
              </Link>
            </div>

            {TIENDA_EJEMPLO ? (
              <Link
                href={`/t/${TIENDA_EJEMPLO}`}
                className="mt-8 inline-block text-sm underline underline-offset-4 opacity-70 hover:opacity-100"
              >
                O mira primero una tienda hecha con Venduo
              </Link>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="border-t border-tinta/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-5 py-8 text-sm opacity-60">
          <span className="font-titular font-bold opacity-100">Venduo</span>
          <span className="flex-1">Santa Cruz · La Paz · Cochabamba</span>
          <a href="mailto:hola@venduo.bo" className="hover:opacity-100">
            hola@venduo.bo
          </a>
        </div>
      </footer>
    </div>
  )
}
