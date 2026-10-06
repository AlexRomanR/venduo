import Link from "next/link"
import { MessageCircle } from "lucide-react"

import {
  CONDICIONES,
  descuento,
  enlaceDeConsulta,
} from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import { Bloques, ParteFija } from "@/components/plantillas/bloques"
import type {
  PropsCatalogo,
  PropsFicha,
  PropsInicio,
} from "@/components/plantillas/kit"
import { BLOQUES_PERFUME } from "@/components/plantillas/perfume/bloques"
import { Galeria } from "@/components/plantillas/perfume/galeria"
import {
  Tarjeta,
  TituloDeSeccion,
  Vacio,
  Vitrina,
} from "@/components/plantillas/perfume/piezas"
import { AgregarAlCarrito } from "@/components/tienda/agregar"
import { BuscarYOrdenar } from "@/components/tienda/buscar"
import { FiltrosTienda } from "@/components/tienda/filtros"

/**
 * Las pantallas de Esencia.
 *
 * La portada es una vitrina corta: lo favorito, las colecciones y lo recién
 * llegado. El catálogo completo tiene su pantalla. Y cada ficha ofrece hablar
 * con alguien, porque un aroma no se elige leyendo.
 */
export function Inicio({ tienda }: PropsInicio) {
  if (tienda.productos.length === 0 && tienda.bloques.length === 0) {
    return (
      <Vacio
        titulo="Pronto, la colección"
        texto={`${tienda.nombre} todavía no cargó sus productos. Vuelve en un rato.`}
      />
    )
  }

  return (
    <>
      {tienda.bloques.length > 0 ? (
        <Bloques componentes={BLOQUES_PERFUME} tienda={tienda} />
      ) : (
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <TituloDeSeccion titulo={tienda.nombre} como="h1" />
          <div className="mt-12">
            <Vitrina columnas={3}>
              {tienda.productos.slice(0, 9).map((producto) => (
                <Tarjeta
                  key={producto.id}
                  producto={producto}
                  tienda={tienda}
                />
              ))}
            </Vitrina>
          </div>
        </section>
      )}

      <ParteFija
        tienda={tienda}
        nombre="La casa"
        ayuda="Muestra el nombre, la descripción y el WhatsApp de tu tienda. Se cambian en Cuenta, desde tu panel."
      >
        <LaCasa tienda={tienda} />
      </ParteFija>
    </>
  )
}

function LaCasa({ tienda }: { tienda: TiendaPublica }) {
  const servicios = [
    tienda.whatsapp
      ? {
          icono: MessageCircle,
          titulo: "Asesoría",
          texto: "Te ayudamos a elegir por WhatsApp, sin compromiso.",
        }
      : null,
    {
      icono: MessageCircle,
      titulo: "Tu pedido",
      texto: "Llega a nuestro WhatsApp y lo cerramos contigo ahí mismo.",
    },
  ].filter((servicio) => servicio !== null)

  return (
    <section className="border-t border-tinta/10">
      <div className="mx-auto w-full max-w-5xl px-5 py-16 md:py-24">
        <TituloDeSeccion
          antetitulo="La casa"
          titulo={tienda.nombre}
          bajada={tienda.descripcion}
        />

        <ul
          className={cn(
            "mt-12 grid gap-px border border-tinta/10 bg-tinta/10",
            servicios.length === 3 && "sm:grid-cols-3",
            servicios.length === 2 && "sm:grid-cols-2"
          )}
        >
          {servicios.map((servicio) => {
            const Icono = servicio.icono
            const contenido = (
              <>
                <Icono
                  aria-hidden="true"
                  className="mx-auto size-5 stroke-[1.25] text-senal"
                />
                <p className="mt-4 text-[11px] tracking-[0.24em] uppercase">
                  {servicio.titulo}
                </p>
                <p className="mx-auto mt-2 max-w-[28ch] text-sm leading-relaxed opacity-70">
                  {servicio.texto}
                </p>
              </>
            )

            return (
              <li key={servicio.titulo} className="bg-papel text-center">
                {"href" in servicio && servicio.href ? (
                  <Link
                    href={servicio.href}
                    className="block px-6 py-9 transition-colors hover:bg-tinta/[0.03]"
                  >
                    {contenido}
                  </Link>
                ) : (
                  <div className="px-6 py-9">{contenido}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function Catalogo({ tienda, filtros, productos }: PropsCatalogo) {
  const categoria = tienda.categorias.find((c) => c.id === filtros.categoria)
  const usados = tienda.productos.filter((p) => p.condition !== "nuevo").length
  const hayFiltro = Boolean(
    filtros.categoria || filtros.condicion || filtros.buscar
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-10 pb-20 md:pt-16">
      <TituloDeSeccion
        antetitulo="La colección"
        titulo={
          categoria?.nombre ??
          (filtros.condicion === "oferta"
            ? "En oferta"
            : filtros.condicion
              ? (CONDICIONES[filtros.condicion] ?? "La colección")
              : "Toda la colección")
        }
        como="h1"
      />

      <div className="mt-12 flex flex-col gap-5 border-y border-tinta/10 py-6">
        <FiltrosTienda
          categorias={tienda.categorias}
          usados={usados}
          total={tienda.productos.length}
          mostrando={productos.length}
          redondeadas
        />
        <BuscarYOrdenar redondeado />
      </div>

      {productos.length === 0 ? (
        <Vacio
          titulo={hayFiltro ? "Nada con ese filtro" : "Pronto, la colección"}
          texto={
            hayFiltro
              ? "No encontramos nada con lo que elegiste. Prueba con otra búsqueda o mira toda la colección."
              : `${tienda.nombre} todavía no cargó sus productos. Vuelve en un rato.`
          }
          accion={
            hayFiltro
              ? {
                  etiqueta: "Ver toda la colección",
                  href: rutaDeTienda(tienda.slug, "/catalogo", {}),
                }
              : undefined
          }
        />
      ) : (
        <div className="mt-12">
          <Vitrina columnas={tienda.apariencia.disposicion.columnas}>
            {productos.map((producto) => (
              <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
            ))}
          </Vitrina>
        </div>
      )}
    </div>
  )
}

export function Ficha({ tienda, producto, relacionados }: PropsFicha) {
  const { ficha } = tienda.apariencia
  const vitrina = ficha.diseno === "vitrina"
  const consulta = enlaceDeConsulta(tienda, producto)
  const rebaja = descuento(producto)
  const imagenes =
    producto.images.length > 0
      ? producto.images
      : producto.image_url
        ? [producto.image_url]
        : []

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-8 pb-20 md:pt-14">
      {/* Vitrina: el frasco solo, en su arco, y todo centrado debajo, como en
          un mostrador. Dividida: foto y texto lado a lado en la computadora. */}
      <div
        className={cn(
          vitrina
            ? "mx-auto flex max-w-2xl flex-col items-center gap-12"
            : "grid gap-12 md:grid-cols-2 md:gap-16"
        )}
      >
        <div className={cn(vitrina && "w-full max-w-[16rem] sm:max-w-xs")}>
          <Galeria imagenes={imagenes} nombre={producto.name} />
        </div>

        <div
          className={cn(
            "text-center",
            vitrina ? "w-full" : "md:pt-8 md:text-left"
          )}
        >
          {producto.category ? (
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: producto.category_id,
              })}
              className="inline-flex min-h-11 items-center text-[11px] tracking-[0.28em] text-senal uppercase underline-offset-4 hover:underline"
            >
              {producto.category}
            </Link>
          ) : null}

          <h1 className="mt-2 font-titular text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.02] text-balance italic">
            {producto.name}
          </h1>

          <p
            className={cn(
              "mt-5 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-xl tracking-[0.03em]",
              !vitrina && "md:justify-start"
            )}
          >
            <span className="tabular">{formatMoney(producto.price_cents)}</span>
            {producto.compare_at_price_cents ? (
              <span className="tabular text-base line-through opacity-45">
                {formatMoney(producto.compare_at_price_cents)}
              </span>
            ) : null}
            {rebaja ? (
              <span className="rounded-plantilla border border-senal px-3 py-0.5 text-[10px] tracking-[0.2em] text-senal uppercase">
                −{rebaja}%
              </span>
            ) : null}
          </p>

          <span
            aria-hidden="true"
            className={cn(
              "mx-auto mt-7 block h-px w-12 bg-senal",
              !vitrina && "md:mx-0"
            )}
          />

          {producto.description ? (
            <p
              className={cn(
                "mx-auto mt-7 max-w-[50ch] leading-loose whitespace-pre-line opacity-80",
                !vitrina && "md:mx-0"
              )}
            >
              {producto.description}
            </p>
          ) : null}

          {producto.condition !== "nuevo" && producto.condition_note ? (
            <p
              className={cn(
                "mx-auto mt-5 max-w-[50ch] text-sm leading-relaxed italic opacity-70",
                !vitrina && "md:mx-0"
              )}
            >
              {CONDICIONES[producto.condition]}: {producto.condition_note}
            </p>
          ) : null}

          <div className={cn("mt-10 text-left", vitrina && "mx-auto max-w-md")}>
            <AgregarAlCarrito producto={producto} slug={tienda.slug} />
          </div>

          <dl
            className={cn(
              "mt-10 grid grid-cols-2 gap-px border border-tinta/10 bg-tinta/10 text-center",
              vitrina && "mx-auto max-w-md"
            )}
          >
            <div className="bg-papel px-4 py-5">
              <dt className="text-[10px] tracking-[0.24em] uppercase opacity-55">
                Condición
              </dt>
              <dd className="mt-1.5 text-sm">
                {CONDICIONES[producto.condition] ?? producto.condition}
              </dd>
            </div>
            <div className="bg-papel px-4 py-5">
              <dt className="text-[10px] tracking-[0.24em] uppercase opacity-55">
                Disponibilidad
              </dt>
              <dd className="mt-1.5 text-sm">
                {producto.stock === 0
                  ? "Agotado"
                  : producto.stock <= producto.low_stock_threshold
                    ? `Quedan ${producto.stock}`
                    : "En existencia"}
              </dd>
            </div>
          </dl>

          {consulta ? (
            <a
              href={consulta}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm underline-offset-4 transition-colors hover:text-senal hover:underline"
            >
              <MessageCircle
                aria-hidden="true"
                className="size-4 stroke-[1.5]"
              />
              ¿No sabes si es para ti? Pregúntanos
            </a>
          ) : null}
        </div>
      </div>

      {ficha.relacionados && relacionados.length > 0 ? (
        <section className="mt-20 border-t border-tinta/10 pt-16 md:mt-28">
          <TituloDeSeccion titulo="Quizás también te guste" />
          <div className="mt-12">
            <Vitrina columnas={4}>
              {relacionados.map((otro) => (
                <Tarjeta key={otro.id} producto={otro} tienda={tienda} />
              ))}
            </Vitrina>
          </div>
        </section>
      ) : null}
    </div>
  )
}
