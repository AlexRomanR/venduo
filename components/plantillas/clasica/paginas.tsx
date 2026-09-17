import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ImageOff } from "lucide-react"

import { filtrarCatalogo } from "@/lib/catalogo"
import { CONDICIONES, descuento } from "@/lib/plantillas/bloques"
import { formatMoney } from "@/lib/format"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import { Bloques } from "@/components/plantillas/bloques"
import {
  BLOQUES_CLASICOS,
  Tarjeta,
} from "@/components/plantillas/clasica/bloques"
import type {
  PropsCatalogo,
  PropsEncabezado,
  PropsFicha,
  PropsInicio,
  PropsVacio,
} from "@/components/plantillas/kit"
import { AgregarAlCarrito } from "@/components/tienda/agregar"
import { BuscarYOrdenar } from "@/components/tienda/buscar"
import { FiltrosTienda } from "@/components/tienda/filtros"

/**
 * Las pantallas de la base editorial.
 *
 * La portada lleva los bloques y, debajo, el catálogo completo con su filtro:
 * los bloques son la cara del negocio, y el catálogo es lo que la gente vino a
 * usar. Por eso está siempre, aunque la plantilla no traiga ninguna grilla.
 */
export function Inicio({ tienda, codigo, filtros }: PropsInicio) {
  const catalogo = filtrarCatalogo(tienda.productos, {
    categoria: filtros.categoria,
    condicion: filtros.condicion,
  })
  const usados = tienda.productos.filter((p) => p.condition !== "nuevo").length

  return (
    <>
      {tienda.bloques.length === 0 ? (
        <section className="py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-5">
            <h1 className="max-w-[16ch] font-titular text-[clamp(2.5rem,9vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">
              {tienda.nombre}
            </h1>
            {tienda.descripcion ? (
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed opacity-70">
                {tienda.descripcion}
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        // La grilla de la plantilla sobra: abajo está el catálogo completo con
        // su filtro, y dos grillas seguidas se leen como un error.
        <Bloques
          componentes={BLOQUES_CLASICOS}
          tienda={tienda}
          codigo={codigo}
          omitir={["product_grid"]}
        />
      )}

      <DatosDeLaTienda
        tienda={tienda}
        // Con bloques, la descripción puede no aparecer en ninguno: se muestra
        // acá. Sin bloques ya salió en la portada de respaldo.
        conDescripcion={
          tienda.bloques.length > 0 &&
          !tienda.bloques.some((b) => b.tipo === "about")
        }
      />

      <section
        id="catalogo"
        className="scroll-mt-20 border-t-2 border-tinta py-14 md:py-16"
      >
        <div className="mx-auto w-full max-w-6xl px-5">
          <h2 className="font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-tight font-extrabold tracking-[-0.03em]">
            El catálogo
          </h2>

          <div className="mt-8">
            <FiltrosTienda
              categorias={tienda.categorias}
              usados={usados}
              total={tienda.productos.length}
              mostrando={catalogo.length}
            />
          </div>

          <GrillaDelCatalogo
            tienda={tienda}
            codigo={codigo}
            productos={catalogo}
          />
        </div>
      </section>
    </>
  )
}

function GrillaDelCatalogo({
  tienda,
  codigo,
  productos,
}: {
  tienda: TiendaPublica
  codigo: string | null
  productos: TiendaPublica["productos"]
}) {
  if (productos.length === 0) {
    return (
      <p className="mt-12 max-w-[48ch] leading-relaxed opacity-55">
        {tienda.productos.length === 0
          ? "Esta tienda todavía no cargó sus productos. Vuelve en un rato."
          : "Nada coincide con ese filtro. Prueba con otro, o mira todo el catálogo."}
      </p>
    )
  }

  return (
    <div
      className={cn(
        "mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3",
        tienda.apariencia.disposicion.columnas === 4 && "xl:grid-cols-4"
      )}
    >
      {productos.map((producto) => (
        <Tarjeta
          key={producto.id}
          producto={producto}
          tienda={tienda}
          codigo={codigo}
        />
      ))}
    </div>
  )
}

/**
 * La ficha del negocio, bajo la portada.
 *
 * Es lo que contesta "¿a quién le estoy comprando?" antes de dar un teléfono.
 * Una tienda sin esto se lee como un catálogo anónimo.
 */
function DatosDeLaTienda({
  tienda,
  conDescripcion,
}: {
  tienda: TiendaPublica
  conDescripcion: boolean
}) {
  const descripcion = conDescripcion ? tienda.descripcion : null

  return (
    <section className="border-t border-tinta/15 py-10">
      <div className="mx-auto w-full max-w-6xl px-5">
        {/* Sin descripción no se dibuja la columna: un rótulo sin nada debajo
            se lee como contenido que no cargó. */}
        <div
          className={cn(
            "grid gap-x-10 gap-y-6",
            descripcion ? "md:grid-cols-[1.4fr_1fr]" : "md:grid-cols-2"
          )}
        >
          {descripcion ? (
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                Sobre {tienda.nombre}
              </p>
              <p className="mt-3 max-w-[58ch] leading-relaxed opacity-75">
                {descripcion}
              </p>
            </div>
          ) : (
            <div className="hidden md:block" />
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-start">
            <div>
              <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
                En catálogo
              </dt>
              <dd className="tabular mt-1 font-titular text-xl font-bold">
                {tienda.productos.length}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
                Entrega
              </dt>
              <dd className="mt-1 text-sm leading-snug">
                Coordinada por WhatsApp
              </dd>
            </div>

            {tienda.aceptaVendedores && tienda.comisionBps > 0 ? (
              <div className="col-span-2 border-t border-tinta/15 pt-4">
                <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
                  ¿Quieres vender lo nuestro?
                </dt>
                <dd className="mt-1 text-sm leading-relaxed opacity-70">
                  Esta tienda paga {(tienda.comisionBps / 100).toFixed(0)}% por
                  cada venta que traigas.{" "}
                  <Link
                    href="/sumarme"
                    className="inline-flex min-h-11 items-center font-semibold text-senal underline-offset-4 hover:underline"
                  >
                    Súmate
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  )
}

export function Catalogo({
  tienda,
  codigo,
  filtros,
  productos,
}: PropsCatalogo) {
  const categoria = tienda.categorias.find((c) => c.id === filtros.categoria)
  const usados = tienda.productos.filter((p) => p.condition !== "nuevo").length

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto w-full max-w-6xl px-5">
        <Link
          href={rutaDeTienda(tienda.slug, "", { ref: codigo })}
          className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
          />
          {tienda.nombre}
        </Link>

        <h1 className="mt-6 font-titular text-[clamp(2rem,6vw,3.5rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
          {categoria?.nombre ?? "El catálogo"}
        </h1>

        <div className="mt-8 flex flex-col gap-6">
          <BuscarYOrdenar />
          <FiltrosTienda
            categorias={tienda.categorias}
            usados={usados}
            total={tienda.productos.length}
            mostrando={productos.length}
          />
        </div>

        <GrillaDelCatalogo
          tienda={tienda}
          codigo={codigo}
          productos={productos}
        />
      </div>
    </section>
  )
}

export function Ficha({ tienda, producto, codigo, relacionados }: PropsFicha) {
  const rebaja = descuento(producto)

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
      <Link
        href={rutaDeTienda(tienda.slug, "", { ref: codigo })}
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
        />
        Seguir viendo
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="relative aspect-square w-full overflow-hidden border border-tinta/15 bg-tinta/5">
            {producto.image_url ? (
              <Image
                src={producto.image_url}
                alt={producto.name}
                fill
                unoptimized
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageOff aria-hidden="true" className="size-10 opacity-20" />
              </div>
            )}
          </div>

          {producto.images.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {producto.images.slice(1, 6).map((url, i) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden border border-tinta/15 bg-tinta/5"
                >
                  <Image
                    src={url}
                    alt={`${producto.name}, foto ${i + 2}`}
                    fill
                    unoptimized
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            {producto.category ?? tienda.nombre}
          </p>

          <h1 className="mt-2 max-w-[20ch] font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.03] font-extrabold tracking-[-0.03em]">
            {producto.name}
          </h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="tabular font-titular text-3xl font-extrabold tracking-[-0.03em]">
              {formatMoney(producto.price_cents)}
            </span>
            {producto.compare_at_price_cents ? (
              <span className="tabular text-lg line-through opacity-40">
                {formatMoney(producto.compare_at_price_cents)}
              </span>
            ) : null}
            {rebaja ? (
              <span className="bg-senal px-2 py-0.5 text-xs font-semibold tracking-[0.1em] text-white uppercase">
                −{rebaja}%
              </span>
            ) : null}
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-55">
            <span>{CONDICIONES[producto.condition] ?? producto.condition}</span>
            <span aria-hidden="true">·</span>
            <span>
              {producto.stock > 0
                ? `${producto.stock} disponibles`
                : "Sin stock"}
            </span>
          </p>

          {producto.description ? (
            <p className="mt-6 max-w-[56ch] leading-relaxed opacity-75">
              {producto.description}
            </p>
          ) : null}

          {producto.condition !== "nuevo" && producto.condition_note ? (
            <div className="mt-6 border-l-2 border-senal pl-4">
              <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                Estado del artículo
              </p>
              <p className="mt-2 max-w-[52ch] leading-relaxed opacity-75">
                {producto.condition_note}
              </p>
            </div>
          ) : null}

          <div className="mt-10">
            <AgregarAlCarrito producto={producto} slug={tienda.slug} />
          </div>
        </div>
      </div>

      {relacionados.length > 0 ? (
        <section className="mt-20 border-t-2 border-tinta pt-10">
          <h2 className="font-titular text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-extrabold tracking-[-0.03em]">
            También te puede gustar
          </h2>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((otro) => (
              <Tarjeta
                key={otro.id}
                producto={otro}
                tienda={tienda}
                codigo={codigo}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export function Encabezado({ antetitulo, titulo, bajada }: PropsEncabezado) {
  return (
    <div>
      {antetitulo ? (
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          {antetitulo}
        </p>
      ) : null}
      <h1
        className={cn(
          "font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.03] font-extrabold tracking-[-0.03em]",
          antetitulo && "mt-3"
        )}
      >
        {titulo}
      </h1>
      {bajada ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-70">{bajada}</p>
      ) : null}
    </div>
  )
}

export function Vacio({ titulo, texto, accion }: PropsVacio) {
  return (
    <div className="border-t-2 border-tinta py-14">
      <h2 className="font-titular text-2xl font-extrabold tracking-[-0.03em]">
        {titulo}
      </h2>
      <p className="mt-3 max-w-[46ch] leading-relaxed opacity-70">{texto}</p>
      {accion ? (
        <Link
          href={accion.href}
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          {accion.etiqueta}
        </Link>
      ) : null}
    </div>
  )
}
