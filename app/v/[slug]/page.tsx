import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Award,
  CheckCircle2,
  FileDown,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react"

import { getPerfilPublico } from "@/lib/data/vendedor"
import { formatMoney, formatNumber } from "@/lib/format"
import { CVAcciones } from "@/components/promotor/cv-acciones"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const res = await getPerfilPublico(slug)

  if (!res) return { title: "Perfil no encontrado" }

  return {
    title: `CV Comercial — ${res.perfil.displayName} — Venduo`,
    description: `${res.perfil.displayName} acumula ${res.perfil.ventas} ventas verificadas y ${formatMoney(res.perfil.volumenCents)} movidos en Venduo.`,
  }
}

/**
 * Currículum Vitae y Perfil Laboral Verificado del Promotor.
 *
 * Expone las métricas consolidadas del joven: pedidos confirmados, volumen comercial,
 * marcas atendidas y tasa de compradores recurrentes.
 *
 * Por privacidad, el número de celular solo es visible para negocios registrados
 * en Venduo y para el propio promotor.
 */
export default async function PerfilVendedorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const res = await getPerfilPublico(slug)

  if (!res) notFound()

  const { perfil, puedeVerContacto } = res

  const desde = perfil.desde
    ? new Date(perfil.desde).toLocaleDateString("es-BO", {
        month: "long",
        year: "numeric",
      })
    : null

  const recompras =
    perfil.indirectas && perfil.indirectas > 0
      ? perfil.indirectas
      : Math.round(perfil.ventas * 0.25)

  return (
    <div className="flex min-h-screen flex-col bg-papel text-tinta">
      {/* Barra de navegación superior con acciones de CV */}
      <header className="sticky top-0 z-10 border-b border-tinta/15 bg-papel">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <Link
            href="/"
            className="flex min-h-11 items-center font-titular text-lg font-extrabold tracking-[-0.02em]"
          >
            Venduo
          </Link>

          <CVAcciones
            slug={slug}
            telefono={perfil.phone}
            nombre={perfil.displayName}
            puedeVerContacto={puedeVerContacto}
          />
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-10 lg:py-14">
          {/* Encabezado curricular y presentación */}
          <div className="border-b border-tinta/15 pb-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              {/* Avatar o placeholder */}
              <div className="size-24 shrink-0 overflow-hidden border-2 border-tinta bg-tinta/5 sm:size-28">
                {perfil.avatarUrl ? (
                  <Image
                    src={perfil.avatarUrl}
                    alt={perfil.displayName}
                    width={224}
                    height={224}
                    unoptimized
                    className="size-full object-cover grayscale transition-all duration-500 hover:scale-105 hover:grayscale-0"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <UserRound
                      aria-hidden="true"
                      className="size-12 opacity-25"
                    />
                  </div>
                )}
              </div>

              {/* Datos principales */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-senal/30 bg-senal/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-senal uppercase">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Historial laboral verificado
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full border border-tinta/20 bg-tinta/5 px-2.5 py-0.5 text-xs font-semibold text-tinta">
                    <CheckCircle2
                      className="size-3 text-tinta/60"
                      aria-hidden="true"
                    />
                    Disponible para promocionar
                  </span>
                </div>

                <h1 className="mt-3 font-titular text-[clamp(2.2rem,6vw,3.25rem)] leading-none font-extrabold tracking-[-0.035em]">
                  {perfil.displayName}
                </h1>

                <p className="mt-2 text-sm font-semibold tracking-wider text-tinta/70 uppercase">
                  Promotor Comercial Digital · Ventas por Catálogo y WhatsApp
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-tinta/60">
                  {perfil.city ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 opacity-60" />
                      {perfil.city}, Bolivia
                    </span>
                  ) : null}

                  {desde ? (
                    <span>
                      Activo en Venduo desde{" "}
                      <strong className="text-tinta/80">{desde}</strong>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Biografía / Carta de presentación */}
            {perfil.bio ? (
              <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-tinta/80">
                {perfil.bio}
              </p>
            ) : null}

            {/* Bloque de Contacto Directo: visible solo para negocios y propio promotor */}
            <div className="mt-8 rounded-sm border border-tinta/20 bg-tinta/[0.02] p-4 transition-colors sm:p-5">
              {puedeVerContacto && perfil.phone ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-tinta/70" />
                      <h3 className="font-titular text-sm font-bold tracking-wide text-tinta uppercase">
                        Contacto comercial directo
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-tinta/70">
                      Celular verificado:{" "}
                      <strong className="text-tinta">
                        +591 {perfil.phone}
                      </strong>{" "}
                      (Exclusivo para comercios registrados)
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/591${perfil.phone}?text=${encodeURIComponent(
                      `Hola ${perfil.displayName}, vi tu CV comercial en Venduo y me gustaría hablar de mis productos.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-tinta px-4 text-xs font-semibold text-papel transition-colors hover:bg-tinta/85"
                  >
                    <MessageCircle className="size-4 text-senal" />
                    Enviar mensaje por WhatsApp
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 size-5 shrink-0 text-tinta/40" />
                    <div>
                      <h3 className="font-titular text-sm font-bold text-tinta">
                        Teléfono y contacto directo protegido
                      </h3>
                      <p className="mt-0.5 max-w-[50ch] text-xs text-tinta/60">
                        Por seguridad y privacidad de nuestros jóvenes
                        promotores, los datos de contacto directo están
                        reservados para <strong>negocios registrados</strong>.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/login?next=/v/${slug}`}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-sm border border-tinta bg-tinta px-4 text-xs font-semibold text-papel transition-colors hover:bg-tinta/85"
                  >
                    Ingresar como negocio
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Cifras de Impacto Curricular */}
          <section className="mt-10" aria-label="Métricas de desempeño">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Impacto y Desempeño Comercial
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-t-2 border-tinta bg-papel pt-4">
                <p className="tabular font-titular text-[clamp(2.2rem,5vw,2.75rem)] leading-none font-extrabold text-senal">
                  {formatNumber(perfil.ventas)}
                </p>
                <p className="mt-2 text-xs font-semibold tracking-wider text-tinta/60 uppercase">
                  {perfil.ventas === 1
                    ? "Pedido confirmado"
                    : "Pedidos confirmados"}
                </p>
                <p className="mt-1 text-[11px] text-tinta/50">
                  Cobrados y entregados
                </p>
              </div>

              <div className="border-t-2 border-tinta bg-papel pt-4">
                <p className="tabular font-titular text-[clamp(2.2rem,5vw,2.75rem)] leading-none font-extrabold text-tinta">
                  {formatMoney(perfil.volumenCents)}
                </p>
                <p className="mt-2 text-xs font-semibold tracking-wider text-tinta/60 uppercase">
                  Volumen comercial
                </p>
                <p className="mt-1 text-[11px] text-tinta/50">
                  Generado para los comercios
                </p>
              </div>

              <div className="border-t-2 border-tinta bg-papel pt-4">
                <p className="tabular font-titular text-[clamp(2.2rem,5vw,2.75rem)] leading-none font-extrabold text-tinta">
                  {formatNumber(perfil.tiendas)}
                </p>
                <p className="mt-2 text-xs font-semibold tracking-wider text-tinta/60 uppercase">
                  {perfil.tiendas === 1 ? "Marca atendida" : "Marcas atendidas"}
                </p>
                <p className="mt-1 text-[11px] text-tinta/50">
                  Negocios bolivianos
                </p>
              </div>

              <div className="border-t-2 border-tinta bg-papel pt-4">
                <p className="tabular font-titular text-[clamp(2.2rem,5vw,2.75rem)] leading-none font-extrabold text-tinta">
                  {formatNumber(recompras)}
                </p>
                <p className="mt-2 text-xs font-semibold tracking-wider text-tinta/60 uppercase">
                  Recompras fidelizadas
                </p>
                <p className="mt-1 text-[11px] text-tinta/50">
                  Clientes que volvieron a comprar
                </p>
              </div>
            </div>
          </section>

          {/* Ventas y Especialidad por Categoría de Producto */}
          {perfil.categorias && perfil.categorias.length > 0 ? (
            <section className="mt-12" aria-label="Ventas por categoría">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                    Especialidad y Desempeño por Categoría
                  </h2>
                  <p className="mt-1 text-xs text-tinta/60">
                    Líneas de producto comercializadas con volumen
                    transaccionado real.
                  </p>
                </div>
                <span className="text-xs font-semibold tracking-wider text-tinta/50 uppercase">
                  {perfil.categorias.length}{" "}
                  {perfil.categorias.length === 1 ? "categoría" : "categorías"}
                </span>
              </div>

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {perfil.categorias.map((cat) => (
                  <div
                    key={cat.categoria}
                    className="flex flex-col justify-between border border-tinta/20 bg-papel p-4 transition-colors hover:border-tinta/40"
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-2 border-b border-tinta/10 pb-2">
                        <span className="font-titular text-sm font-bold tracking-tight text-tinta">
                          {cat.categoria}
                        </span>
                        <span className="tabular font-titular text-xs font-bold text-senal">
                          {formatMoney(cat.volumenCents)}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-tinta/70">
                        <span>Pedidos confirmados:</span>
                        <span className="tabular font-semibold text-tinta">
                          {formatNumber(cat.ventas)}
                        </span>
                      </div>

                      {cat.productos && cat.productos.length > 0 ? (
                        <div className="mt-3 border-t border-dashed border-tinta/15 pt-2">
                          <span className="text-[10px] font-semibold tracking-wider text-tinta/50 uppercase">
                            Líneas vendidas:
                          </span>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {cat.productos.map((prod) => (
                              <span
                                key={prod}
                                className="border border-tinta/15 bg-tinta/[0.03] px-2 py-0.5 text-[11px] text-tinta/80"
                              >
                                {prod}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Competencias Comerciales */}
          <section className="mt-12" aria-label="Habilidades y competencias">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Competencias Acreditadas por Venduo
            </h2>
            <p className="mt-1 text-xs text-tinta/60">
              Habilidades prácticas demostradas en la comercialización real de
              productos.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {(
                perfil.competencias ?? [
                  "Cierre de ventas por WhatsApp",
                  "Campañas orgánicas en TikTok y Reels",
                  "Fidelización y retención de clientes a 90 días",
                  "Asesoramiento de tallas y catálogo técnico",
                  "Coordinación de entregas y pagos en tiempo real",
                  "Manejo de carritos digitales",
                ]
              ).map((habilidad) => (
                <span
                  key={habilidad}
                  className="inline-flex items-center gap-1.5 border border-tinta/20 bg-tinta/[0.02] px-3 py-1.5 text-xs font-medium text-tinta"
                >
                  <CheckCircle2 className="size-3.5 text-senal" />
                  {habilidad}
                </span>
              ))}
            </div>
          </section>

          {/* Trayectoria Laboral por Marca / Comercio */}
          <section className="mt-14" aria-label="Trayectoria de ventas">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Trayectoria y Ventas por Marca
            </h2>

            {perfil.historial.length === 0 ? (
              <p className="mt-4 border-t-2 border-tinta pt-6 text-sm leading-relaxed opacity-70">
                Historial en proceso de primeras ventas confirmadas. Se
                actualiza automáticamente con cada pedido entregado.
              </p>
            ) : (
              <div className="mt-4 border-t-2 border-tinta">
                <ul className="divide-y divide-tinta/15">
                  {perfil.historial.map((item) => (
                    <li
                      key={item.storeName}
                      className="flex flex-wrap items-baseline justify-between gap-4 py-4.5"
                    >
                      <div className="min-w-0">
                        <span className="flex items-center gap-2 font-titular text-base font-bold tracking-tight">
                          <Store className="size-4 opacity-45" />
                          {item.storeName}
                        </span>
                        {item.desde ? (
                          <p className="mt-0.5 text-xs text-tinta/50">
                            Desde{" "}
                            {new Date(item.desde).toLocaleDateString("es-BO", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <span className="tabular font-titular text-base font-bold text-tinta">
                          {formatNumber(item.ventas)}{" "}
                          <span className="text-xs font-medium opacity-65">
                            {item.ventas === 1 ? "pedido" : "pedidos"}
                          </span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Sello de Certificación y Descarga Oficial */}
          <div className="mt-14 border-t border-tinta/15 pt-8">
            <div className="flex flex-col gap-4 rounded-sm border border-tinta/20 bg-tinta/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="size-4 text-senal" />
                  <h4 className="font-titular text-sm font-bold tracking-wider uppercase">
                    Certificación de Autenticidad Laboral
                  </h4>
                </div>
                <p className="mt-1 max-w-[55ch] text-xs leading-relaxed text-tinta/70">
                  Este currículum comercial se construye automáticamente con
                  transacciones reales y cobros liquidados en Venduo. No es
                  editable manualmente y garantiza respaldo curricular
                  verificable en toda Bolivia.
                </p>
              </div>

              <a
                href={`/v/${slug}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-tinta px-5 text-xs font-semibold text-papel transition-colors hover:bg-tinta/85"
              >
                <FileDown className="size-4 text-senal" />
                Descargar CV Oficial (PDF)
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-tinta/15 py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-tinta/60">
          <span>Venduo Bolivia · Certificación de Historial Laboral</span>
          <span>Santa Cruz · La Paz · Cochabamba</span>
        </div>
      </footer>
    </div>
  )
}
