import Link from "next/link"
import { Check, Minus, Plus } from "lucide-react"

import { getSiteUrl } from "@/lib/env"
import { getUsuario } from "@/lib/supabase/server"
import { DemoRedes } from "@/components/landing/demo-redes"
import { Entra } from "@/components/landing/entra"
import { Foto } from "@/components/landing/foto"
import { Logo } from "@/components/marca/logo"

export const metadata = {
  title: "Venduo — tu tienda online, y todo lo que hay detrás",
  description:
    "Para quien vende por TikTok, Instagram y WhatsApp: tu tienda online con stock al día, cobros con PagoFácil, pedidos ordenados y catálogos en PDF.",
  // La tarjeta va acá y no en la raíz: una tienda sin logo la heredaría, y
  // su enlace por WhatsApp mostraría a Venduo en vez de la tienda.
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "Venduo",
    description: "Tu tienda online, y todo lo que hay detrás.",
    siteName: "Venduo",
    type: "website",
    images: [{ url: "/marca/compartir.png", width: 1200, height: 630 }],
  },
}

/**
 * Portada pública.
 *
 * La estrategia de esta superficie vive en `.impeccable/surfaces/app-page-tsx.md`.
 *
 * Le habla a quien ya vende por redes y no se levanta pensando "necesito una
 * página web": se levanta respondiendo "¿precio?" por mensaje directo. Por eso
 * la tienda online aparece como lo que es —la vitrina del enlace en la bio— y
 * el resto de la página cuenta lo que hay detrás: stock, cobros, pedidos,
 * vendedores y catálogos. El tono para escribirle está en `ui-styling.md`,
 * "Cómo le hablamos al cliente".
 *
 * Los ejemplos son ilustrativos y lo dicen al pie.
 */

/*
 * PENDIENTE: la tienda de ejemplo todavía no existe. El equipo la crea
 * registrándose y cargando productos. Cuando exista, poner acá su slug.
 */
const TIENDA_EJEMPLO: string | null = null

/** Lo que dice quien vende por redes antes de usar Venduo. */
const DOLORES = [
  "Me preguntan el precio cincuenta veces al día por mensaje.",
  "Vendí algo que ya no tenía.",
  "No sé cuánto me queda de cada talla.",
  "Me pagan por QR y reviso capturas una por una.",
  "Mando fotos sueltas por WhatsApp y se ve desordenado.",
]

/** Una tienda online común contra lo que trae Venduo, fila por fila. */
const COMPARACION = [
  {
    tema: "Tu catálogo",
    comun: "Una página con fotos y precios.",
    venduo:
      "Tu tienda online, con tu plantilla, para el enlace de tu bio y tus chats.",
  },
  {
    tema: "El stock",
    comun: "Lo llevas aparte, en un cuaderno o en tu cabeza.",
    venduo: "Baja solo con cada venta y te avisa antes de que se acabe.",
  },
  {
    tema: "Los cobros",
    comun: "Revisas capturas de transferencia una por una.",
    venduo:
      "Cobras con PagoFácil, y el dinero queda protegido hasta que llega el pedido.",
  },
  {
    tema: "Los pedidos",
    comun: "Te llegan sueltos, mezclados con el resto del chat.",
    venduo:
      "Llegan ordenados, con los datos de quien compra y el WhatsApp listo para coordinar.",
  },
  {
    tema: "Para mandar",
    comun: "Armas a mano un catálogo con capturas.",
    venduo:
      "Catálogos en PDF con tus productos, tus colores y tus precios de hoy.",
  },
  {
    tema: "Quién vende",
    comun: "Solo tú.",
    venduo: "Una red de vendedores que cobra comisión solo si vende.",
  },
]

const PASOS = [
  {
    n: "01",
    titulo: "Subes tus productos",
    detalle:
      "Con su foto, su precio y cuántas unidades tienes. Lo nuevo y lo de segunda mano, en el mismo lugar.",
  },
  {
    n: "02",
    titulo: "Pones tu enlace en la bio",
    detalle:
      "O lo mandas por WhatsApp. Quien te sigue ve todo tu catálogo ordenado, con precios y lo que queda, sin preguntarte nada.",
  },
  {
    n: "03",
    titulo: "Los pedidos llegan pagados",
    detalle:
      "Pagan con PagoFácil, el stock se descuenta solo y tú coordinas la entrega por WhatsApp.",
  },
]

const INCLUYE = [
  {
    titulo: "Tienda online con plantillas",
    detalle:
      "Eliges una plantilla de tu rubro y la ajustas a tu marca: colores, letra, portada. La IA te ayuda si se lo pides.",
  },
  {
    titulo: "Control de stock",
    detalle:
      "Cada venta descuenta del inventario. Te avisa lo que se está acabando y nadie compra lo que ya no tienes.",
  },
  {
    titulo: "Cobro con PagoFácil",
    detalle:
      "Quien compra paga en línea y el dinero queda en custodia hasta la entrega. Confía más, y tú no revisas capturas.",
  },
  {
    titulo: "Pedidos con WhatsApp",
    detalle:
      "Cada pedido trae quién compró, qué y cuánto, con el mensaje para coordinar la entrega ya escrito.",
  },
  {
    titulo: "Catálogos en PDF",
    detalle:
      "Eliges productos o un pack, una de doce plantillas, y descargas un catálogo con tus colores para mandar por WhatsApp.",
    nuevo: true,
  },
  {
    titulo: "Red de vendedores",
    detalle:
      "Otros venden tus productos con su propio enlace. La comisión se calcula sola y solo se paga si venden.",
  },
  {
    titulo: "Estadísticas en tus palabras",
    detalle:
      "Le preguntas «¿qué se vendió más este mes?» y te responde con un gráfico.",
  },
]

const RUBROS = [
  "Ropa y calzado",
  "Belleza y maquillaje",
  "Perfumes",
  "Accesorios y joyas",
  "Celulares y tecnología",
  "Deporte",
  "Segunda mano",
]

const PREGUNTAS = [
  {
    p: "¿Es una tienda online?",
    r: "Sí, y más que eso. Tienes tu tienda online con tu enlace, y detrás el stock, los cobros, los pedidos, los vendedores y los catálogos en PDF. Todo se maneja desde el celular.",
  },
  {
    p: "Ya vendo por TikTok y WhatsApp. ¿Tengo que dejar de hacerlo?",
    r: "No. Sigues vendiendo donde ya te conocen. Venduo pone el enlace en tu bio y en tus chats, y lo que pasa después —el pago, el stock, el pedido— se ordena solo.",
  },
  {
    p: "¿Cómo me pagan mis clientes?",
    r: "Con PagoFácil. El dinero queda retenido hasta que el pedido llega, así quien compra no tiene miedo de pagarle a una cuenta de redes, y tú no tienes que revisar comprobantes.",
  },
  {
    p: "¿Qué es el catálogo en PDF?",
    r: "Un catálogo armado con tus productos —los que elijas, una categoría o un pack— en una de doce plantillas, con tus colores. Lo descargas y lo mandas por WhatsApp o lo subes a un estado.",
  },
  {
    p: "¿Necesito saber de computación?",
    r: "No. Si sabes subir una foto a TikTok, sabes usar Venduo. Y si algo no te sale, se lo pides a la IA en tus palabras.",
  },
  {
    p: "¿Cuánto cuesta?",
    r: "Abrir tu tienda y probar todo no cuesta nada. Los planes llegan después, y Venduo no se queda con comisión de tus ventas.",
  },
  {
    p: "¿Qué gana el vendedor?",
    r: "La comisión que define cada tienda, y un historial con su nombre que puede mostrar cuando busque trabajo. El vendedor no paga nada, nunca.",
  },
]

export default async function Inicio() {
  const user = await getUsuario()

  return (
    <div className="min-h-screen bg-papel text-tinta">
      <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <span className="flex-1 text-lg">
            <Logo />
          </span>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#por-que" className="opacity-70 hover:opacity-100">
              Por qué Venduo
            </a>
            <a href="#incluye" className="opacity-70 hover:opacity-100">
              Qué incluye
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
        {/* El producto funcionando en el primer viewport, no explicado. */}
        <section className="mx-auto max-w-6xl px-5 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                Para quien vende por redes
              </p>
              <h1 className="mt-5 max-w-[14ch] font-titular text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.97] font-extrabold tracking-[-0.035em] text-balance">
                Tu tienda online, y todo lo que hay detrás.
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed opacity-70">
                Ya vendes por TikTok, Instagram y WhatsApp. Venduo te da la
                tienda online para el enlace de tu bio y el sistema que la
                maneja: el stock al día, los cobros con PagoFácil, los pedidos
                ordenados y catálogos en PDF para mandar.
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
              <p className="mt-4 text-sm opacity-70">
                Abrirla no cuesta nada. No pedimos tarjeta.
              </p>
            </div>

            <DemoRedes />
          </div>
        </section>

        {/* El problema, dicho como lo dice quien lo vive. */}
        <section className="border-t border-tinta/15">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              ¿Te suena?
            </p>
            <h2 className="mt-5 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
              Vender por redes funciona. Manejarlo, no tanto.
            </h2>

            <ul className="mt-12 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {DOLORES.map((dolor, i) => (
                <Entra key={dolor} demora={(i % 3) * 70}>
                  <li className="border-t border-tinta/15 py-6">
                    <p className="border-l-2 border-senal pl-4 font-titular text-lg leading-snug font-bold tracking-[-0.01em]">
                      «{dolor}»
                    </p>
                  </li>
                </Entra>
              ))}
              <Entra demora={140}>
                <li className="border-t border-tinta/15 py-6">
                  <p className="max-w-[34ch] leading-relaxed opacity-70">
                    Nada de eso se arregla con una página web más. Se arregla
                    con lo que hay detrás de la página.
                  </p>
                </li>
              </Entra>
            </ul>
          </div>
        </section>

        {/* Por qué no es solo una tienda online. */}
        <section id="por-que" className="scroll-mt-20 border-t border-tinta/15">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Por qué no es solo una tienda online
            </p>
            <h2 className="mt-5 max-w-[20ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
              Una tienda muestra tus productos. Venduo maneja tu negocio.
            </h2>

            <div className="mt-12 border border-tinta">
              <div className="hidden grid-cols-[10rem_1fr_1fr] border-b border-tinta text-xs font-semibold tracking-[0.12em] uppercase sm:grid">
                <span className="px-5 py-3" />
                <span className="border-l border-tinta/15 px-5 py-3 opacity-70">
                  Una tienda online común
                </span>
                <span className="border-l border-tinta/15 px-5 py-3 text-senal">
                  Venduo
                </span>
              </div>
              {COMPARACION.map((fila) => (
                <div
                  key={fila.tema}
                  className="grid border-t border-tinta/15 first:border-t-0 sm:grid-cols-[10rem_1fr_1fr]"
                >
                  <p className="px-4 pt-4 font-titular font-bold tracking-[-0.01em] sm:px-5 sm:py-4">
                    {fila.tema}
                  </p>
                  <p className="flex gap-2 px-4 pt-2 text-sm leading-relaxed opacity-70 sm:border-l sm:border-tinta/15 sm:px-5 sm:py-4">
                    <Minus
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <span>
                      <span className="sr-only">Una tienda común: </span>
                      {fila.comun}
                    </span>
                  </p>
                  <p className="flex gap-2 px-4 pt-2 pb-4 text-sm leading-relaxed sm:border-l sm:border-tinta/15 sm:px-5 sm:py-4">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-senal"
                    />
                    <span>
                      <span className="sr-only">Con Venduo: </span>
                      {fila.venduo}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-tinta/15">
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
                        <span className="tabular pt-1 font-titular text-sm font-bold opacity-65">
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
          id="incluye"
          className="scroll-mt-20 border-t border-tinta/15 py-20"
        >
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Qué incluye
            </p>
            <h2 className="mt-5 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
              Todo lo que antes hacías en cinco apps distintas.
            </h2>

            <div className="mt-12 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUYE.map((m, i) => (
                <Entra key={m.titulo} demora={(i % 3) * 70}>
                  <div className="group border-t border-tinta/15 py-6 transition-colors hover:border-senal">
                    <h3 className="flex flex-wrap items-center gap-2 font-titular text-lg font-bold tracking-[-0.02em] transition-colors group-hover:text-senal">
                      {m.titulo}
                      {m.nuevo ? (
                        <span className="border border-senal px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold tracking-[0.12em] text-senal uppercase">
                          Nuevo
                        </span>
                      ) : null}
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

        {/* Para quién es: los rubros que se venden por redes. */}
        <section className="border-t border-tinta/15">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                Para quién es
              </p>
              <h2 className="mt-5 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
                Para quien ya vende, y quiere vender ordenado.
              </h2>
              <p className="mt-5 max-w-[52ch] leading-relaxed opacity-70">
                Si tus clientes te encuentran en TikTok, Instagram, Facebook o
                WhatsApp, Venduo es para ti. Empiezas con lo que ya tienes: las
                fotos de tu celular y tus precios.
              </p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {RUBROS.map((rubro) => (
                  <li
                    key={rubro}
                    className="border border-tinta/25 px-3 py-2 text-sm font-semibold"
                  >
                    {rubro}
                  </li>
                ))}
              </ul>
            </div>

            <Entra>
              <Foto
                id="1573633509389-0e3075dea01b"
                alt="Joven mostrando su teléfono"
                pie="Vender por el mismo canal donde ya te conocen."
                ratio="aspect-[4/5]"
              />
            </Entra>
          </div>
        </section>

        {/* El bloque rojo: la red de vendedores y la tesis del proyecto. */}
        <section
          id="vendedores"
          className="campo-senal scroll-mt-20 bg-senal text-white"
        >
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
            <p className="text-xs font-semibold tracking-[0.12em] text-white/80 uppercase">
              Red de vendedores
            </p>
            <h2 className="mt-5 max-w-[18ch] font-titular text-[clamp(2rem,6vw,3.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
              Otros venden tus productos, y cobran solo si venden.
            </h2>
            <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-white/90">
              Cada vendedor tiene su enlace y su código. Cuando alguien compra
              por ahí, la comisión se calcula sola y no te cuesta nada más. Para
              el vendedor, cada venta queda registrada con su nombre: siete de
              cada diez jóvenes que trabajan en Bolivia no tienen nada que lo
              demuestre, y esto es su primer historial laboral.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/login?rol=vendedor"
                className="inline-block rounded-sm border-2 border-white px-5 py-3 font-semibold transition-colors hover:bg-white hover:text-senal"
              >
                Sumarme como vendedor
              </Link>
              <Link
                href="/login?rol=emprendedor"
                className="inline-block rounded-sm bg-white px-5 py-3 font-semibold text-senal transition-colors hover:bg-white/90"
              >
                Abrir mi tienda con vendedores
              </Link>
            </div>
            <p className="mt-8 max-w-[60ch] text-xs leading-relaxed text-white/75">
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
            <h2 className="max-w-[16ch] font-titular text-[clamp(2.25rem,7vw,4rem)] leading-[1] font-extrabold tracking-[-0.035em]">
              Tu tienda online hoy. Tu negocio ordenado esta semana.
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-5 py-8 text-sm opacity-70">
          <Logo className="opacity-100" />
          <span className="flex-1">Santa Cruz · La Paz · Cochabamba</span>
          <a href="mailto:hola@venduo.bo" className="hover:opacity-100">
            hola@venduo.bo
          </a>
        </div>
      </footer>
    </div>
  )
}
