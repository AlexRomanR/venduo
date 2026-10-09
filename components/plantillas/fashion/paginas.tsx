import Link from "next/link"
import { ArrowRight, MessageCircle, ShoppingBag } from "lucide-react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { descuento, enlaceDeConsulta } from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import { Bloques, ParteFija } from "@/components/plantillas/bloques"
import { BLOQUES_FASHION } from "@/components/plantillas/fashion/bloques"
import { Galeria } from "@/components/plantillas/fashion/galeria"
import {
  Tarjeta,
  TituloDeSeccion,
  Vacio,
} from "@/components/plantillas/fashion/piezas"
import type {
  PropsCatalogo,
  PropsFicha,
  PropsInicio,
} from "@/components/plantillas/kit"
import { AgregarAlCarrito } from "@/components/tienda/agregar"
import { BuscarYOrdenar } from "@/components/tienda/buscar"
import { FiltrosTienda } from "@/components/tienda/filtros"

/**
 * Las pantallas de Pasarela.
 *
 * A diferencia de la base editorial, la portada no carga el catálogo entero:
 * es una vitrina armada —lo nuevo, lo más buscado, las categorías— y el
 * catálogo vive en su propia pantalla, con búsqueda y orden. Una tienda de
 * ropa con cuarenta prendas en la portada no deja ver ninguna.
 */
export function Inicio({ tienda }: PropsInicio) {
  const catalogo = rutaDeTienda(tienda.slug, "/catalogo")

  if (tienda.productos.length === 0 && tienda.bloques.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-12">
        <Vacio
          titulo="La colección está en camino"
          texto={`${tienda.nombre} todavía no cargó sus productos. Vuelve en un rato.`}
        />
      </div>
    )
  }

  return (
    <>
      {tienda.bloques.length > 0 ? (
        <Bloques componentes={BLOQUES_FASHION} tienda={tienda} />
      ) : (
        <section className="mx-auto w-full max-w-7xl px-5 py-14">
          <TituloDeSeccion titulo={tienda.nombre} como="h1" />
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {tienda.productos.slice(0, 12).map((producto) => (
              <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
            ))}
          </div>
        </section>
      )}

      {tienda.productos.length > 0 ? (
        <ParteFija
          tienda={tienda}
          nombre="Ver todo"
          ayuda="Lleva a tu catálogo completo. Viene con la plantilla y aparece cuando tienes productos."
        >
          <Link
            href={catalogo}
            className="group block border-y-2 border-tinta transition-colors hover:bg-tinta hover:text-papel"
          >
            <span className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-8 md:py-12">
              <span className="font-titular text-[clamp(2.25rem,9vw,5.5rem)] leading-none">
                Ver todo
              </span>
              <span className="flex items-center gap-3 text-xs font-semibold tracking-[0.16em] uppercase">
                <span className="tabular hidden sm:inline">
                  {tienda.productos.length}{" "}
                  {tienda.productos.length === 1 ? "producto" : "productos"}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-6 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
                />
              </span>
            </span>
          </Link>
        </ParteFija>
      ) : null}

      <ParteFija
        tienda={tienda}
        nombre="Sobre la tienda"
        ayuda="Muestra el nombre, la descripción y el WhatsApp de tu tienda. Se cambian en Cuenta, desde tu panel."
      >
        <SobreLaTienda tienda={tienda} />
      </ParteFija>
    </>
  )
}

/** Quién vende y cómo se compra. En moda, eso decide tanto como la prenda. */
function SobreLaTienda({ tienda }: { tienda: TiendaPublica }) {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr] md:gap-16 md:py-20">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-60">
          Sobre la tienda
        </p>
        <h2 className="mt-3 font-titular text-[clamp(2rem,7vw,3.75rem)] leading-[0.92]">
          {tienda.nombre}
        </h2>
        {tienda.descripcion ? (
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed opacity-75">
            {tienda.descripcion}
          </p>
        ) : null}
      </div>

      <ul className="self-end border-t-2 border-tinta">
        <Servicio icono={<ShoppingBag aria-hidden="true" className="size-5" />}>
          Tu pedido llega a nuestro WhatsApp y lo cerramos ahí
        </Servicio>
        {tienda.whatsapp ? (
          <Servicio
            icono={<MessageCircle aria-hidden="true" className="size-5" />}
          >
            <a
              href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="underline-offset-4 hover:text-senal hover:underline"
            >
              ¿Dudas con una talla? Escríbenos
            </a>
          </Servicio>
        ) : null}
      </ul>
    </section>
  )
}

function Servicio({
  icono,
  children,
}: {
  icono: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li className="flex min-h-14 items-center gap-4 border-b border-tinta/15 py-3 text-sm font-medium">
      <span className="shrink-0 opacity-70">{icono}</span>
      <span>{children}</span>
    </li>
  )
}

export function Catalogo({ tienda, filtros, productos }: PropsCatalogo) {
  const categoria = tienda.categorias.find((c) => c.id === filtros.categoria)
  const ofertas = tienda.productos.filter(
    (p) => p.compare_at_price_cents
  ).length
  const titulo =
    categoria?.nombre ?? (filtros.oferta ? "En oferta" : null) ?? "Catálogo"
  const hayFiltro = Boolean(
    filtros.categoria || filtros.oferta || filtros.buscar
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-6 pb-16 md:pt-10">
      <nav
        aria-label="Estás en"
        className="flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase"
      >
        <Link
          href={rutaDeTienda(tienda.slug, "")}
          className="flex min-h-11 items-center opacity-60 transition-opacity hover:opacity-100"
        >
          Inicio
        </Link>
        <span aria-hidden="true" className="opacity-40">
          /
        </span>
        <span className="font-semibold">Catálogo</span>
      </nav>

      <div className="mt-2">
        <TituloDeSeccion titulo={titulo} como="h1" />
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <FiltrosTienda
          categorias={tienda.categorias}
          ofertas={ofertas}
          total={tienda.productos.length}
          mostrando={productos.length}
        />
        <BuscarYOrdenar />
      </div>

      {productos.length === 0 ? (
        <div className="mt-10">
          <Vacio
            titulo={hayFiltro ? "Nada por aquí" : "Todavía sin productos"}
            texto={
              hayFiltro
                ? "Ninguna prenda coincide con lo que elegiste. Prueba con otro filtro o mira todo."
                : `${tienda.nombre} todavía no cargó sus productos. Vuelve en un rato.`
            }
            accion={
              hayFiltro
                ? {
                    etiqueta: "Ver todo",
                    href: rutaDeTienda(tienda.slug, "/catalogo", {}),
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div
          className={cn(
            "mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5",
            tienda.apariencia.disposicion.columnas >= 4 && "lg:grid-cols-4"
          )}
        >
          {productos.map((producto) => (
            <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
          ))}
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
  const pocas =
    producto.stock > 0 && producto.stock <= producto.low_stock_threshold
  const imagenes =
    producto.images.length > 0
      ? producto.images
      : producto.image_url
        ? [producto.image_url]
        : []

  return (
    <div className="mx-auto w-full max-w-7xl pb-16 md:px-5 md:pt-4">
      <nav
        aria-label="Estás en"
        className={cn(
          "flex items-center gap-2 overflow-hidden px-5 text-[11px] tracking-[0.16em] whitespace-nowrap uppercase md:px-0",
          vitrina && "justify-center"
        )}
      >
        <Link
          href={rutaDeTienda(tienda.slug, "/catalogo")}
          className="flex min-h-11 items-center opacity-60 transition-opacity hover:opacity-100"
        >
          Catálogo
        </Link>
        {producto.category_id && producto.category ? (
          <>
            <span aria-hidden="true" className="opacity-40">
              /
            </span>
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: producto.category_id,
              })}
              className="flex min-h-11 items-center truncate opacity-60 transition-opacity hover:opacity-100"
            >
              {producto.category}
            </Link>
          </>
        ) : null}
      </nav>

      {/* Vitrina: la prenda sola al centro, más chica y con aire, y todo lo
          demás debajo. Dividida: la foto manda a lo ancho y el texto la
          acompaña al costado. */}
      <div
        className={cn(
          vitrina
            ? "mx-auto flex max-w-2xl flex-col items-center gap-8"
            : "grid gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12"
        )}
      >
        <div className={cn(vitrina && "w-full max-w-[18rem] sm:max-w-sm")}>
          <Galeria
            imagenes={imagenes}
            nombre={producto.name}
            retrato={tienda.apariencia.disposicion.tarjeta === "retrato"}
          />
        </div>

        <div
          className={cn(
            "px-5 md:px-0",
            vitrina ? "w-full text-center" : "md:sticky md:top-36 md:self-start"
          )}
        >
          <h1 className="font-titular text-[clamp(2rem,6vw,3.25rem)] leading-[0.95]">
            {producto.name}
          </h1>

          <div
            className={cn(
              "mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2",
              vitrina && "justify-center"
            )}
          >
            <span className="tabular text-2xl font-semibold">
              {formatMoney(producto.price_cents)}
            </span>
            {producto.compare_at_price_cents ? (
              <span className="tabular text-lg line-through opacity-45">
                {formatMoney(producto.compare_at_price_cents)}
              </span>
            ) : null}
            {rebaja ? (
              <span className="bg-senal px-2 py-1 text-[11px] font-semibold tracking-[0.12em] text-white uppercase">
                −{rebaja}%
              </span>
            ) : null}
          </div>

          <p
            className={cn(
              "mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-[0.12em] uppercase",
              vitrina && "justify-center"
            )}
          >
            <span className={cn(pocas ? "text-senal" : "opacity-60")}>
              {producto.stock === 0
                ? "Agotado"
                : pocas
                  ? `Últimas ${producto.stock}`
                  : "Disponible"}
            </span>
          </p>

          <div className={cn("mt-8 text-left", vitrina && "mx-auto max-w-md")}>
            <AgregarAlCarrito producto={producto} slug={tienda.slug} />

            {consulta ? (
              <a
                href={consulta}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 transition-colors hover:text-senal hover:underline"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                ¿Dudas con la talla o el color? Pregúntanos
              </a>
            ) : null}
          </div>

          <dl
            className={cn(
              "mt-10 border-t-2 border-tinta text-left",
              vitrina && "mx-auto max-w-md"
            )}
          >
            {producto.description ? (
              <Detalle titulo="Descripción">
                <p className="leading-relaxed whitespace-pre-line opacity-80">
                  {producto.description}
                </p>
              </Detalle>
            ) : null}
            <Detalle titulo="Cómo comprar">
              <p className="leading-relaxed opacity-80">
                Agrégala al carrito y manda tu pedido por WhatsApp: la tienda te
                responde ahí.
              </p>
            </Detalle>
            {producto.sku ? (
              <Detalle titulo="Código">
                <p className="tabular opacity-80">{producto.sku}</p>
              </Detalle>
            ) : null}
          </dl>
        </div>
      </div>

      {ficha.relacionados && relacionados.length > 0 ? (
        <section className="mt-16 px-5 md:mt-24 md:px-0">
          <TituloDeSeccion titulo="También te puede gustar" />
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5 lg:grid-cols-4">
            {relacionados.map((otro) => (
              <Tarjeta key={otro.id} producto={otro} tienda={tienda} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Detalle({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-tinta/15 py-5">
      <dt className="text-[11px] font-semibold tracking-[0.18em] uppercase">
        {titulo}
      </dt>
      <dd className="mt-2 text-sm">{children}</dd>
    </div>
  )
}
