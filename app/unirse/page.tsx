import Link from "next/link"
import { Plus } from "lucide-react"

import { getTramos } from "@/lib/data/precios"
import { getUser } from "@/lib/supabase/server"
import { Cifra } from "@/components/landing/cifra"
import { Entra } from "@/components/landing/entra"
import { Foto } from "@/components/landing/foto"
import { PrecioEjemplo } from "@/components/landing/precio-ejemplo"

export const metadata = {
  title: "Únete a Venduo — publica o promociona productos",
}

/**
 * Portada pública.
 *
 * La estrategia de esta superficie vive en `.impeccable/surfaces/app-page-tsx.md`.
 *
 * El mecanismo que tiene que quedar claro en el primer viewport es el del
 * modelo: **el negocio declara cuánto quiere recibir y el precio se arma
 * encima**. Por eso lo primero que se ve no es una tienda dibujada, sino esa
 * cuenta hecha con números reales de los tramos vigentes.
 *
 * Las cifras y los ejemplos son ilustrativos de lo que el producto va a
 * mostrar, no medidas de uso real. Cada bloque que los usa lo dice al pie.
 */

const PASOS_NEGOCIO = [
  {
    n: "01",
    titulo: "Cargas lo que vendes",
    detalle:
      "Foto, nombre, stock y cuánto quieres recibir por cada unidad. Nada de calcular márgenes ni decidir a cuánto publicarlo.",
  },
  {
    n: "02",
    titulo: "Los promotores lo eligen",
    detalle:
      "Tu producto entra al catálogo y cada promotor decide cuáles lleva a sus redes, con su propio enlace. No apruebas a nadie ni pagas por adelantado.",
  },
  {
    n: "03",
    titulo: "Te avisamos que vendiste",
    detalle:
      "Te llega el pedido con el WhatsApp de quien compró. El pago queda retenido hasta que el producto llegue.",
  },
  {
    n: "04",
    titulo: "Coordinas la entrega",
    detalle:
      "Te abrimos la conversación con el detalle ya escrito. Cuando el comprador confirma que lo recibió, cobras tu parte completa.",
  },
]

const PASOS_PROMOTOR = [
  {
    n: "01",
    titulo: "Eliges qué vender",
    detalle:
      "Recorres el catálogo y tomas los productos que te gustan. Sin poner un peso, sin stock en tu casa y sin que nadie te apruebe.",
  },
  {
    n: "02",
    titulo: "Compartes tu enlace",
    detalle:
      "Cada producto te da un enlace y un QR propios, con textos listos para pegar en TikTok, Instagram o el grupo del barrio.",
  },
  {
    n: "03",
    titulo: "Cobras tu comisión",
    detalle:
      "Sale del precio, no de tu bolsillo, y se calcula sola. Te la paga la pasarela cuando el comprador confirma que recibió.",
  },
  {
    n: "04",
    titulo: "Sigues ganando después",
    detalle:
      "Quien compra por tu enlace queda asociado a ti: si vuelve por su cuenta al catálogo, esa venta también te deja comisión.",
  },
]

const RESUELVE = [
  {
    titulo: "El precio, calculado",
    detalle:
      "El negocio dice cuánto quiere recibir. Venduo suma la comisión del promotor y su parte, y publica.",
  },
  {
    titulo: "Promotores sin contrato",
    detalle:
      "Nadie contrata a nadie ni paga sueldo fijo. Se gana por venta, y quien vende no arriesga nada.",
  },
  {
    titulo: "Pago retenido",
    detalle:
      "La plata queda en la pasarela hasta que el pedido llega. Recién ahí se reparte entre las tres partes.",
  },
  {
    titulo: "Entrega por WhatsApp",
    detalle:
      "Con el mensaje ya armado, por donde ya se habla. No inventamos una app de envíos.",
  },
  {
    titulo: "Historial que sirve",
    detalle:
      "Cada venta queda a nombre de quien la hizo, en un perfil público que se manda con un enlace.",
  },
  {
    titulo: "Tus números, preguntando",
    detalle:
      "Qué se vende, cuándo y cuánto. Se pregunta en tus palabras y responde con un gráfico.",
  },
]

const PREGUNTAS = [
  {
    p: "¿Quién pone el precio?",
    r: "Lo pone el sistema. Tú dices cuánto quieres recibir por tu producto y Venduo le suma la comisión de quien lo venda y su propia parte. Ese es el precio que ve el comprador, y lo que tú recibes no cambia.",
  },
  {
    p: "¿Cuánto cuesta publicar?",
    r: "Nada. No hay mensualidad ni publicidad por adelantado: la plataforma solo gana un porcentaje cuando una venta se cierra, y ese porcentaje ya está sumado en el precio publicado.",
  },
  {
    p: "¿Cuánto gana un promotor?",
    r: "Un porcentaje del producto, más alto en lo barato y más bajo en lo caro, para que vender siempre valga el esfuerzo. Se calcula solo, sale del precio y nunca del bolsillo del promotor, que no paga nada nunca.",
  },
  {
    p: "¿Qué pasa si el comprador vuelve solo?",
    r: "Si llegó por el enlace de un promotor, queda asociado a él por un tiempo: aunque después compre por su cuenta en el catálogo, esa venta le deja comisión igual. Si nadie lo trajo, ese porcentaje vuelve al negocio.",
  },
  {
    p: "¿Cuándo me pagan?",
    r: "El comprador le paga a la pasarela y el dinero queda retenido. Cuando el negocio marca el pedido como enviado y el comprador confirma que lo recibió, se libera y se reparte: su parte al negocio, la comisión al promotor.",
  },
  {
    p: "¿Y si el producto no llega?",
    r: "Mientras el pago está retenido, el comprador puede reclamar y la plata se congela hasta que Venduo revise el caso. Por eso comprarle a alguien que no conoces deja de ser una apuesta.",
  },
  {
    p: "¿Tengo que dejar de vender por WhatsApp?",
    r: "No. Sigue vendiendo donde ya vendes: Venduo suma un canal más, con gente promocionando tus productos y el cobro resuelto.",
  },
]

export default async function Inicio() {
  const [user, tramos] = await Promise.all([getUser(), getTramos()])

  return (
    <div className="min-h-screen bg-papel text-tinta">
      <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <Link
            href="/"
            className="flex-1 font-titular text-lg font-extrabold tracking-[-0.02em]"
          >
            Venduo
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#como-funciona" className="opacity-70 hover:opacity-100">
              Cómo funciona
            </a>
            <a href="#precio" className="opacity-70 hover:opacity-100">
              El precio
            </a>
            <a href="#promotores" className="opacity-70 hover:opacity-100">
              Promotores
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
            className="flex min-h-11 items-center rounded-plantilla bg-senal px-4 text-sm font-semibold text-white transition-colors hover:bg-senal-alta"
          >
            {user ? "Ir a mi panel" : "Publicar mis productos"}
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <h1 className="max-w-[14ch] font-titular text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.97] font-extrabold tracking-[-0.035em] text-balance">
                Tú pones el producto. Nosotros, quién lo venda.
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed opacity-70">
                Publica lo que haces diciendo solo cuánto quieres recibir por
                cada cosa. Una red de jóvenes promotores lo lleva a sus redes, y
                a ti te avisamos cuando alguien compre para que coordines la
                entrega.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login?rol=emprendedor"
                  className="rounded-plantilla bg-senal px-5 py-3 font-semibold text-white transition-colors hover:bg-senal-alta"
                >
                  Publicar mis productos
                </Link>
                <Link
                  href="/login?rol=promotor"
                  className="rounded-plantilla border-2 border-tinta px-5 py-3 font-semibold transition-colors hover:bg-tinta hover:text-papel"
                >
                  Ser promotor
                </Link>
              </div>
              <p className="mt-4 text-sm opacity-55">
                Publicar no cuesta nada. Si no vendes, no pagas.
              </p>
            </div>

            <Entra>
              <PrecioEjemplo tramos={tramos} />
            </Entra>
          </div>
        </section>

        <section className="border-y border-tinta/15">
          <div className="mx-auto grid max-w-6xl gap-9 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <Cifra
              valor={0}
              prefijo="Bs "
              detalle="Para publicar tus productos"
            />
            <Cifra
              valor={0}
              prefijo="Bs "
              detalle="De inversión para el promotor"
            />
            <Cifra
              valor={16}
              sufijo=" años"
              detalle="Edad mínima para vender"
            />
            <Cifra
              valor={96}
              sufijo="%"
              detalle="De los jóvenes que trabajan lo hacen en la informalidad"
            />
          </div>
          <div className="mx-auto max-w-6xl px-5 pb-8">
            <p className="text-xs opacity-45">
              Venduo está en desarrollo. El dato de informalidad juvenil varía
              según la fuente y el año.
            </p>
          </div>
        </section>

        {/* Las dos audiencias, cada una con su promesa y su acción. */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-12 sm:grid-cols-2 sm:gap-14">
            <Entra>
              <div className="border-t-2 border-tinta pt-6">
                <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                  Para quien produce
                </p>
                <h2 className="mt-5 max-w-[15ch] font-titular text-[clamp(1.75rem,4.5vw,2.4rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
                  Vende sin poner un peso por adelantado.
                </h2>
                <p className="mt-4 max-w-[46ch] leading-relaxed opacity-70">
                  Cargas tus productos con cuánto quieres recibir y ahí termina
                  tu trabajo hasta que alguien compre. Sin publicidad, sin
                  contratar, sin negociar porcentajes con nadie.
                </p>
                <Link
                  href="/login?rol=emprendedor"
                  className="mt-7 inline-block rounded-plantilla bg-senal px-5 py-3 font-semibold text-white transition-colors hover:bg-senal-alta"
                >
                  Publicar mis productos
                </Link>
                <p className="mt-3 text-sm opacity-55">
                  Cargas el primero en dos minutos. No pedimos tarjeta.
                </p>
              </div>
            </Entra>

            <Entra demora={90}>
              <div className="border-t-2 border-tinta pt-6">
                <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                  Para quien quiere ganar
                </p>
                <h2 className="mt-5 max-w-[15ch] font-titular text-[clamp(1.75rem,4.5vw,2.4rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
                  Vende productos que no son tuyos y arma tu historial.
                </h2>
                <p className="mt-4 max-w-[46ch] leading-relaxed opacity-70">
                  Eliges del catálogo lo que te guste, lo compartes con tu
                  enlace y ganas comisión por cada venta. Sin invertir, sin
                  guardar mercadería y sin que nadie te apruebe.
                </p>
                <Link
                  href="/login?rol=promotor"
                  className="mt-7 inline-block rounded-plantilla border-2 border-tinta px-5 py-3 font-semibold transition-colors hover:bg-tinta hover:text-papel"
                >
                  Ser promotor
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
            <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Cómo funciona
            </p>
            <h2 className="mt-5 max-w-[20ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
              Dos caminos que terminan en la misma venta.
            </h2>

            <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-2">
              <Pasos
                titulo="Si produces o revendes"
                pasos={PASOS_NEGOCIO}
                acento
              />
              <Pasos titulo="Si vas a promocionar" pasos={PASOS_PROMOTOR} />
            </div>
          </div>
        </section>

        {/* El mecanismo económico, explicado con la cuenta hecha. */}
        <section id="precio" className="scroll-mt-20 border-t border-tinta/15">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                El precio
              </p>
              <h2 className="mt-5 max-w-[16ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
                Nadie negocia porcentajes.
              </h2>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed opacity-70">
                El negocio declara lo que quiere recibir. Encima se suman la
                comisión del promotor y la parte de Venduo, las dos escalonadas
                según el precio del producto: más altas en lo barato, donde una
                venta chica tiene que valer el esfuerzo, y más bajas en lo caro.
              </p>
              <ul className="mt-8 flex max-w-[52ch] flex-col">
                {[
                  "El negocio recibe su monto completo, venda quien venda.",
                  "El comprador paga lo mismo llegue por donde llegue.",
                  "Si nadie promocionó la venta, esa comisión vuelve al negocio.",
                ].map((linea) => (
                  <li
                    key={linea}
                    className="border-t border-tinta/15 py-4 text-sm leading-relaxed opacity-75"
                  >
                    {linea}
                  </li>
                ))}
              </ul>
            </div>

            <Entra className="lg:pt-6">
              <PrecioEjemplo
                tramos={tramos}
                baseCents={4000}
                nombre="Alfajor artesanal x6"
              />
            </Entra>
          </div>
        </section>

        <section className="border-t border-tinta/15 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Qué resuelve
            </p>
            <h2 className="mt-5 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
              Lo que antes había que armar a mano, cada semana.
            </h2>

            <div className="mt-12 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {RESUELVE.map((m, i) => (
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
                pie="Promocionar por el mismo canal donde ya estás."
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
                pie="El taller que produce y no tenía dónde vender."
                ratio="aspect-[3/4]"
              />
            </Entra>
          </div>
        </section>

        {/* El bloque rojo: la tesis del proyecto, dicha sin adorno. */}
        <section
          id="promotores"
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
              href="/login?rol=promotor"
              className="mt-9 inline-block rounded-plantilla border-2 border-white px-5 py-3 font-semibold transition-colors hover:bg-white hover:text-senal"
            >
              Ser promotor
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
              Publica hoy. Vende esta semana.
            </h2>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/login?rol=emprendedor"
                className="rounded-plantilla bg-senal px-5 py-3 font-semibold text-white transition-colors hover:bg-senal-alta"
              >
                Publicar mis productos
              </Link>
              <Link
                href="/login?rol=promotor"
                className="rounded-plantilla border-2 border-tinta px-5 py-3 font-semibold transition-colors hover:bg-tinta hover:text-papel"
              >
                Ser promotor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-tinta/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-5 py-8 text-sm opacity-60">
          <span className="font-titular font-bold opacity-100">Venduo</span>
          <span className="flex-1">Santa Cruz · La Paz · Cochabamba</span>
          <Link href="/" className="min-h-11 py-3 hover:opacity-100">
            Ir al Marketplace
          </Link>
          <a href="mailto:hola@venduo.bo" className="hover:opacity-100">
            hola@venduo.bo
          </a>
        </div>
      </footer>
    </div>
  )
}

/** Una columna de pasos numerados. El acento marca el camino del negocio. */
function Pasos({
  titulo,
  pasos,
  acento = false,
}: {
  titulo: string
  pasos: Array<{ n: string; titulo: string; detalle: string }>
  acento?: boolean
}) {
  return (
    <div>
      <h3
        className={
          acento
            ? "font-titular text-xl font-bold tracking-[-0.02em] text-senal"
            : "font-titular text-xl font-bold tracking-[-0.02em]"
        }
      >
        {titulo}
      </h3>
      <ol className="mt-4">
        {pasos.map((paso, i) => (
          <Entra key={paso.n} demora={i * 70}>
            <li className="flex gap-5 border-t border-tinta/15 py-6">
              <span className="tabular pt-1 font-titular text-sm font-bold opacity-40">
                {paso.n}
              </span>
              <div>
                <h4 className="font-titular text-lg font-bold tracking-[-0.02em]">
                  {paso.titulo}
                </h4>
                <p className="mt-2 max-w-[48ch] text-sm leading-relaxed opacity-70">
                  {paso.detalle}
                </p>
              </div>
            </li>
          </Entra>
        ))}
      </ol>
    </div>
  )
}
