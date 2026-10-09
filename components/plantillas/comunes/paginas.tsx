import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"
import type { ComponentType, ReactNode } from "react"

import { descuento, enlaceDeConsulta } from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import { Bloques, ParteFija } from "@/components/plantillas/bloques"
import { Galeria } from "@/components/plantillas/fashion/galeria"
import type {
  KitDeTienda,
  PropsCatalogo,
  PropsFicha,
  PropsInicio,
  PropsTarjeta,
  PropsVacio,
} from "@/components/plantillas/kit"
import { AgregarAlCarrito } from "@/components/tienda/agregar"
import { BuscarYOrdenar } from "@/components/tienda/buscar"
import { FiltrosTienda } from "@/components/tienda/filtros"

/**
 * Las pantallas de las plantillas que comparten esqueleto.
 *
 * Portada, catálogo y ficha se ordenan igual en Calle, Atelier, Pisada,
 * Fórmula y Bazar: una vitrina armada con bloques, el catálogo con filtros y
 * la ficha con su galería. Lo que las distingue —la tarjeta, el título de
 * sección, los rótulos, la grilla, cómo se cierra la portada— lo trae cada kit
 * en `PiezasDePaginas`. Este módulo no sabe de qué plantilla son: recibe las
 * piezas y las compone.
 */
export interface PiezasDePaginas {
  Tarjeta: ComponentType<PropsTarjeta>
  Vacio: ComponentType<PropsVacio>
  Titulo: ComponentType<{
    titulo: string
    enlace?: { etiqueta: string; href: string }
    como?: "h1" | "h2"
  }>
  /** El rótulo chico de los datos: "Descripción", "Cómo comprar". */
  Rotulo: ComponentType<{ children: ReactNode }>
  bloques: KitDeTienda["bloques"]
  /** Las clases de la grilla de productos, de 375 px para arriba. */
  grilla: (columnas: number) => string
  /** Cómo se cierra la portada, después de los bloques. */
  Cierre: ComponentType<{ tienda: TiendaPublica }>
  /** Cómo enmarca la galería cada foto: el radio, un paño, un borde. */
  marcoDeFoto?: string
  /** Si la galería muestra la foto entera sobre su paño en vez de recortarla. */
  fotoEntera?: boolean
  textos: {
    /** Lo que se dice cuando no hay nada cargado todavía. */
    sinProductos: string
    /** El enlace de consulta de la ficha. */
    consulta: string
    /** El nombre del estado de un usado: "Estado de la prenda". */
    estado: string
    /** Cuando un filtro no devuelve nada. */
    sinResultados: string
  }
}

export function paginasDeKit(
  piezas: PiezasDePaginas
): Pick<KitDeTienda, "Inicio" | "Catalogo" | "Ficha"> {
  const { Tarjeta, Vacio, Titulo, Rotulo, bloques, grilla, Cierre, textos } =
    piezas

  function Inicio({ tienda }: PropsInicio) {
    if (tienda.productos.length === 0 && tienda.bloques.length === 0) {
      return (
        <div className="mx-auto w-full max-w-7xl px-5 py-12">
          <Vacio
            titulo={textos.sinProductos}
            texto={`${tienda.nombre} todavía no cargó sus productos. Vuelve en un rato.`}
          />
        </div>
      )
    }

    return (
      <>
        {tienda.bloques.length > 0 ? (
          <Bloques componentes={bloques} tienda={tienda} />
        ) : (
          <section className="mx-auto w-full max-w-7xl px-5 py-14">
            <Titulo titulo={tienda.nombre} como="h1" />
            <div
              className={cn(
                "mt-6",
                grilla(tienda.apariencia.disposicion.columnas)
              )}
            >
              {tienda.productos.slice(0, 12).map((producto) => (
                <Tarjeta
                  key={producto.id}
                  producto={producto}
                  tienda={tienda}
                />
              ))}
            </div>
          </section>
        )}

        <ParteFija
          tienda={tienda}
          nombre="Sobre la tienda"
          ayuda="Muestra el nombre, la descripción y el WhatsApp de tu tienda, y lleva a tu catálogo. Se cambian en Cuenta, desde tu panel."
        >
          <Cierre tienda={tienda} />
        </ParteFija>
      </>
    )
  }

  function Catalogo({ tienda, filtros, productos }: PropsCatalogo) {
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
        <Migas
          pasos={[{ etiqueta: "Inicio", href: rutaDeTienda(tienda.slug, "") }]}
          actual="Catálogo"
        />

        <div className="mt-2">
          <Titulo titulo={titulo} como="h1" />
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
                  ? textos.sinResultados
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
              "mt-8",
              grilla(tienda.apariencia.disposicion.columnas)
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

  function Ficha({ tienda, producto, relacionados }: PropsFicha) {
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
        <div className={cn("px-5 md:px-0", vitrina && "flex justify-center")}>
          <Migas
            pasos={[
              {
                etiqueta: "Catálogo",
                href: rutaDeTienda(tienda.slug, "/catalogo"),
              },
              ...(producto.category_id && producto.category
                ? [
                    {
                      etiqueta: producto.category,
                      href: rutaDeTienda(tienda.slug, "/catalogo", {
                        categoria: producto.category_id,
                      }),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <div
          className={cn(
            vitrina
              ? "mx-auto flex max-w-2xl flex-col items-center gap-8"
              : "grid gap-8 md:grid-cols-[1.25fr_1fr] md:gap-12"
          )}
        >
          <div className={cn(vitrina && "w-full max-w-sm px-5 md:px-0")}>
            <Galeria
              imagenes={imagenes}
              nombre={producto.name}
              retrato={tienda.apariencia.disposicion.tarjeta === "retrato"}
              marco={piezas.marcoDeFoto}
              entera={piezas.fotoEntera}
            />
          </div>

          <div
            className={cn(
              "px-5 md:px-0",
              vitrina
                ? "w-full text-center"
                : "md:sticky md:top-36 md:self-start"
            )}
          >
            <h1 className="font-titular text-[clamp(2rem,6vw,3.25rem)] leading-[0.98]">
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
                <span className="tabular text-lg line-through opacity-55">
                  {formatMoney(producto.compare_at_price_cents)}
                </span>
              ) : null}
              {rebaja ? (
                <span className="rounded-plantilla bg-senal px-2.5 py-1 text-[11px] font-semibold tracking-[0.1em] text-white uppercase">
                  −{rebaja}%
                </span>
              ) : null}
            </div>

            <p
              className={cn(
                "mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-[0.1em] uppercase",
                vitrina && "justify-center"
              )}
            >
              <span className={cn(pocas ? "text-senal" : "opacity-65")}>
                {producto.stock === 0
                  ? "Agotado"
                  : pocas
                    ? `Últimas ${producto.stock}`
                    : "Disponible"}
              </span>
            </p>

            <div
              className={cn("mt-8 text-left", vitrina && "mx-auto max-w-md")}
            >
              <AgregarAlCarrito producto={producto} slug={tienda.slug} />

              {consulta ? (
                <a
                  href={consulta}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 transition-colors hover:text-senal hover:underline"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  {textos.consulta}
                </a>
              ) : null}
            </div>

            <dl
              className={cn(
                "mt-10 border-t border-tinta text-left",
                vitrina && "mx-auto max-w-md"
              )}
            >
              {producto.description ? (
                <Detalle titulo="Descripción" Rotulo={Rotulo}>
                  <p className="leading-relaxed whitespace-pre-line opacity-80">
                    {producto.description}
                  </p>
                </Detalle>
              ) : null}
              <Detalle titulo="Cómo comprar" Rotulo={Rotulo}>
                <p className="leading-relaxed opacity-80">
                  Agrégalo al carrito y manda tu pedido por WhatsApp: la tienda
                  te responde ahí.
                </p>
              </Detalle>
              {producto.sku ? (
                <Detalle titulo="Código" Rotulo={Rotulo}>
                  <p className="tabular opacity-80">{producto.sku}</p>
                </Detalle>
              ) : null}
            </dl>
          </div>
        </div>

        {ficha.relacionados && relacionados.length > 0 ? (
          <section className="mt-16 px-5 md:mt-24 md:px-0">
            <Titulo titulo="También te puede gustar" />
            <div className={cn("mt-6", grilla(4))}>
              {relacionados.map((otro) => (
                <Tarjeta key={otro.id} producto={otro} tienda={tienda} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    )
  }

  return { Inicio, Catalogo, Ficha }
}

function Migas({
  pasos,
  actual,
}: {
  pasos: { etiqueta: string; href: string }[]
  actual?: string
}) {
  return (
    <nav
      aria-label="Estás en"
      className="flex items-center gap-2 overflow-hidden text-[11px] tracking-[0.14em] whitespace-nowrap uppercase"
    >
      {pasos.map((paso, i) => (
        <span key={paso.href} className="flex min-w-0 items-center gap-2">
          {i > 0 ? (
            <span aria-hidden="true" className="opacity-40">
              /
            </span>
          ) : null}
          <Link
            href={paso.href}
            className="flex min-h-11 items-center truncate opacity-65 transition-opacity hover:opacity-100"
          >
            {paso.etiqueta}
          </Link>
        </span>
      ))}
      {actual ? (
        <>
          <span aria-hidden="true" className="opacity-40">
            /
          </span>
          <span className="font-semibold">{actual}</span>
        </>
      ) : null}
    </nav>
  )
}

function Detalle({
  titulo,
  Rotulo,
  children,
}: {
  titulo: string
  Rotulo: PiezasDePaginas["Rotulo"]
  children: ReactNode
}) {
  return (
    <div className="border-b border-tinta/15 py-5">
      <dt>
        <Rotulo>{titulo}</Rotulo>
      </dt>
      <dd className="mt-2 text-sm">{children}</dd>
    </div>
  )
}

/** El enlace grande al catálogo con que cierran varias portadas. */
export function EnlaceAlCatalogo({
  tienda,
  className,
  children,
}: {
  tienda: TiendaPublica
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={rutaDeTienda(tienda.slug, "/catalogo")}
      className={cn("group inline-flex items-center gap-3", className)}
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
      />
    </Link>
  )
}
