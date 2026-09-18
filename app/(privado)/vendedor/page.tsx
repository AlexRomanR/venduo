import Link from "next/link"
import { ArrowUpRight, FileDown, IdCard, Search, Sparkles } from "lucide-react"

import {
  getMisComisiones,
  getMisCompradores,
  getMisEnlaces,
  getPerfilPromotor,
} from "@/lib/data/promotor"
import { getTramos } from "@/lib/data/precios"
import { getProductosVitrina } from "@/lib/data/vitrina"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney, formatNumber } from "@/lib/format"
import { leerGrafico } from "@/lib/insights/lectura"
import { gananciaSemanal, resumirPromotor, type Enlace } from "@/lib/promotor"
import { cn } from "@/lib/utils"
import { Grafico } from "@/components/insights/grafico"
import { Cifra, Encabezado, Vacio } from "@/components/panel/piezas"
import { Bienvenida } from "@/components/promotor/bienvenida"
import {
  FilaComision,
  FilaComprador,
  FilaEnlace,
} from "@/components/promotor/piezas"

export const metadata = { title: "Mi panel de promotor" }

/**
 * La entrada del promotor.
 *
 * Tiene dos caras y las decide si ya tomó algún producto: sin enlaces no hay
 * nada que resumir, así que se le explica el modelo y se le pone un primer
 * producto a un toque. Con enlaces, lo primero es cuánto ganó y qué hacer hoy.
 * `?guia=1` vuelve a abrir la bienvenida desde la barra lateral.
 */
export default async function PromotorPage({
  searchParams,
}: {
  searchParams: Promise<{ guia?: string }>
}) {
  const { guia } = await searchParams
  const [perfil, enlaces, comisiones, compradores, tramos] = await Promise.all([
    getPerfilPromotor(),
    getMisEnlaces(),
    getMisComisiones(),
    getMisCompradores(),
    getTramos(),
  ])

  if (enlaces.length === 0 || guia === "1") {
    const { items } = await getProductosVitrina({ porPagina: 6 })
    return (
      <Bienvenida
        nombre={perfil.nombre}
        tramos={tramos}
        productos={items.slice(0, 6)}
      />
    )
  }

  const resumen = resumirPromotor(enlaces, comisiones, compradores)
  const semanas = gananciaSemanal(comisiones, 12)
  const estaSemana = semanas[semanas.length - 1]?.valor ?? 0
  const hayGanancia = semanas.some((s) => s.valor > 0)
  const lectura = hayGanancia
    ? leerGrafico({ formato: "dinero" }, semanas)
    : null
  const consejo = siguientePaso(enlaces)

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
        <div className="flex-1 animate-in duration-700 fill-mode-both fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Tu panel de promotor
          </p>
          <h1 className="mt-3 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
            Hola, {perfil.nombre.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-[54ch] leading-relaxed opacity-70">
            {estaSemana > 0 ? (
              <>
                Esta semana llevas{" "}
                <span className="tabular font-semibold text-senal opacity-100">
                  {formatMoney(estaSemana)}
                </span>
                . Cada enlace que compartes hoy es una venta posible mañana.
              </>
            ) : (
              "Esta semana todavía no hay ventas. Comparte tus enlaces con tres personas hoy: así empieza cada semana buena."
            )}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/vendedor/catalogo"
            className={cn(BOTON_SECUNDARIO, "active:scale-[0.98]")}
          >
            <Search aria-hidden="true" className="size-4" />
            Buscar más productos
          </Link>
          {perfil.slug ? (
            <>
              <Link
                href={`/v/${perfil.slug}`}
                className="flex min-h-12 items-center justify-center gap-2 px-3 font-semibold transition-colors hover:text-senal"
              >
                <IdCard aria-hidden="true" className="size-4" />
                Mi CV comercial
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              <a
                href={`/v/${perfil.slug}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-tinta/25 px-4 font-semibold transition-colors hover:border-tinta"
              >
                <FileDown aria-hidden="true" className="size-4 text-senal" />
                Descargar CV (PDF)
              </a>
            </>
          ) : null}
        </div>
      </div>

      <section className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Ganado"
          valor={formatMoney(resumen.ganadoCents)}
          detalle={
            resumen.pagadoCents > 0
              ? `${formatMoney(resumen.pagadoCents)} ya en tu cuenta`
              : "Confirmado por los negocios"
          }
        />
        <Cifra
          etiqueta="Por cobrar"
          valor={formatMoney(resumen.porCobrarCents)}
          detalle={
            resumen.pendienteCents > 0
              ? `Y ${formatMoney(resumen.pendienteCents)} retenido`
              : "Llega cuando se reparte"
          }
        />
        <Cifra
          etiqueta="Ventas con tu enlace"
          valor={formatNumber(resumen.ventasDirectas)}
          detalle={
            resumen.ventasIndirectas > 0
              ? `Y ${formatNumber(resumen.ventasIndirectas)} de compradores que volvieron`
              : `En ${formatNumber(resumen.negocios)} ${resumen.negocios === 1 ? "negocio" : "negocios"}`
          }
        />
        <Cifra
          etiqueta="Compradores que trajiste"
          valor={formatNumber(resumen.compradoresVigentes)}
          detalle={`Siguen contigo · ${formatNumber(resumen.compradores)} en total`}
        />
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <div>
          <Encabezado
            etiqueta="Lo que ganaste por semana"
            accion={{
              href: "/vendedor/estadisticas",
              texto: "Ver estadísticas",
            }}
          />
          <div className="mt-6">
            {hayGanancia ? (
              <Grafico
                spec={{
                  titulo: "Ganancia por semana",
                  explicacion: "Tus comisiones de las últimas 12 semanas.",
                  grafico: "columna",
                  formato: "dinero",
                }}
                filas={semanas}
              />
            ) : (
              <div className="border-t-2 border-tinta pt-6">
                <p className="font-titular text-lg font-bold tracking-[-0.02em]">
                  Tu gráfico empieza con tu primera venta
                </p>
                <p className="mt-2 max-w-[48ch] text-sm leading-relaxed opacity-70">
                  Cada comisión suma a su semana. Doce semanas de ventas te
                  dicen qué días y qué productos te funcionan.
                </p>
              </div>
            )}
          </div>
          {lectura ? (
            <p className="mt-4 max-w-[60ch] text-sm leading-relaxed opacity-70">
              {lectura}
            </p>
          ) : null}
        </div>

        <aside className="self-start border-2 border-tinta p-5 sm:p-6">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Tu próximo paso
          </p>
          <h2 className="mt-3 font-titular text-xl leading-snug font-bold tracking-[-0.02em]">
            {consejo.titulo}
          </h2>
          <p className="mt-2 text-sm leading-relaxed opacity-70">
            {consejo.detalle}
          </p>
          <Link
            href={consejo.href}
            className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-senal transition-opacity hover:opacity-70"
          >
            {consejo.accion}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </aside>
      </section>

      <section>
        <Encabezado
          etiqueta="Tus enlaces"
          titulo={`${formatNumber(enlaces.length)} ${enlaces.length === 1 ? "producto" : "productos"} para compartir`}
          accion={{ href: "/vendedor/enlaces", texto: "Ver todos" }}
        />
        <ul className="mt-4 border-t-2 border-tinta">
          {enlaces.slice(0, 4).map((enlace) => (
            <FilaEnlace key={enlace.id} enlace={enlace} />
          ))}
        </ul>
      </section>

      <section className="grid gap-12 lg:grid-cols-2 lg:gap-14">
        <div>
          <Encabezado
            etiqueta="Compradores que trajiste"
            accion={{ href: "/vendedor/compradores", texto: "Ver todos" }}
          />
          {compradores.length === 0 ? (
            <div className="mt-6">
              <Vacio
                titulo="Todavía no trajiste a nadie"
                detalle="Cuando alguien compra por primera vez con tu enlace, queda contigo 90 días: si vuelve a comprar por su cuenta, ganas igual."
              />
            </div>
          ) : (
            <ul className="mt-4 border-t-2 border-tinta">
              {compradores.slice(0, 3).map((comprador) => (
                <FilaComprador key={comprador.id} comprador={comprador} />
              ))}
            </ul>
          )}
        </div>

        <div>
          <Encabezado
            etiqueta="Últimas comisiones"
            accion={{ href: "/vendedor/ganancias", texto: "Ver ganancias" }}
          />
          {comisiones.length === 0 ? (
            <div className="mt-6">
              <Vacio
                titulo="Tu primera comisión está cerca"
                detalle="Aparece sola cuando alguien compra con tu enlace y el pago entra. No tienes que registrar nada."
              />
            </div>
          ) : (
            <ul className="mt-4 border-t-2 border-tinta">
              {comisiones.slice(0, 5).map((comision) => (
                <FilaComision key={comision.id} comision={comision} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

/**
 * Lo más útil que puede hacer hoy, calculado de sus enlaces.
 *
 * El orden es de urgencia: un producto sin stock le hace perder una venta que
 * ya consiguió; uno que nunca vendió es una oportunidad; y si todo anda, lo
 * que suma es tener más productos.
 */
function siguientePaso(enlaces: Enlace[]) {
  const sinStock = enlaces.filter((e) => !e.disponible)
  if (sinStock.length > 0) {
    return {
      titulo: `${sinStock.length === 1 ? "Un producto tuyo se quedó" : `${sinStock.length} productos tuyos se quedaron`} sin stock.`,
      detalle:
        "Si alguien entra por ese enlace no va a poder comprar. Deja de compartirlo hasta que el negocio reponga, o suma otro parecido.",
      accion: "Revisar mis enlaces",
      href: "/vendedor/enlaces",
    }
  }

  const sinVentas = enlaces.filter((e) => e.unidades === 0)
  if (sinVentas.length > 0) {
    const primero = sinVentas[0]
    return {
      titulo: `${primero.nombre} todavía no se vendió.`,
      detalle: `Te deja ${formatMoney(primero.gananciaCents)} por venta. Mándalo hoy a un grupo de WhatsApp o ponlo en tu estado: la mayoría de las ventas llegan del primer círculo.`,
      accion: "Compartirlo ahora",
      href: "/vendedor/enlaces",
    }
  }

  const mejor = [...enlaces].sort((a, b) => b.unidades - a.unidades)[0]
  return {
    titulo: "Todo lo que tomaste ya vendió.",
    detalle: `${mejor.nombre} es tu mejor producto. Busca otros parecidos: quien te compró uno ya confía en lo que recomiendas.`,
    accion: "Buscar más productos",
    href: "/vendedor/catalogo",
  }
}
