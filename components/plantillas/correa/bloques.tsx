import Image from "next/image"
import Link from "next/link"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import {
  accionDePortada,
  categoriasConFoto,
  fotoDePortada,
  numero,
  productosDeGrilla,
  texto,
} from "@/lib/plantillas/bloques"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { BLOQUES_CLASICOS } from "@/components/plantillas/clasica/bloques"
import {
  Boton,
  Tarjeta,
  Titulo,
  azulejo,
  grilla,
  variablesDeAzulejos,
} from "@/components/plantillas/correa/piezas"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"

/**
 * Los bloques de Correa.
 *
 * La portada es una vidriera: el titular ancho y, al lado, un mosaico de tres
 * azulejos de colores con la portada y dos carteras de la tienda. Las
 * categorías —de mano, cruzadas, mochilas— van cada una sobre su azulejo.
 */

const RADIO = "rounded-[1.25rem]"

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver las carteras"
  const otras = tienda.productosDeEjemplo
    ? []
    : tienda.productos
        .map((p) => p.image_url)
        .filter((f): f is string => Boolean(f) && f !== foto)
        .slice(0, 2)

  return (
    <section
      style={variablesDeAzulejos(tienda)}
      className="mx-auto w-full max-w-7xl px-5 pt-8 pb-12 md:pt-14 md:pb-20"
    >
      <div
        className={cn(
          "grid gap-8",
          foto && "md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14"
        )}
      >
        <div
          className={cn(
            !foto && cn("bg-[var(--azulejo-1)] px-6 py-14 md:px-12", RADIO)
          )}
        >
          <h1 className="max-w-[13ch] font-titular text-[clamp(2.5rem,11vw,5.5rem)] leading-[0.95]">
            {titulo}
          </h1>
          {bajada ? (
            <p className="mt-5 max-w-[40ch] text-lg leading-relaxed opacity-80">
              {bajada}
            </p>
          ) : null}
          <Boton href={rutaDeTienda(tienda.slug, "/catalogo")} className="mt-8">
            {accion}
          </Boton>
        </div>

        {foto ? (
          <div
            className={cn(
              "grid gap-2 md:gap-3",
              otras.length > 0 ? "grid-cols-[1.25fr_1fr]" : "grid-cols-1"
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden bg-[var(--azulejo-1)]",
                RADIO,
                otras.length > 0 ? "row-span-2 min-h-full" : "aspect-[4/3]"
              )}
            >
              <Image
                src={foto}
                alt=""
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 60vw, 35vw"
                className="object-cover mix-blend-multiply"
              />
            </div>
            {otras.map((otra, i) => (
              <div
                key={otra}
                style={{ backgroundColor: azulejo(i + 1) }}
                className={cn("relative aspect-square overflow-hidden", RADIO)}
              >
                <Image
                  src={otra}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 40vw, 25vw"
                  className="object-cover mix-blend-multiply"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 8)
  if (categorias.length === 0) return null

  return (
    <section
      style={variablesDeAzulejos(tienda)}
      className="mx-auto w-full max-w-7xl px-5 py-12 md:py-20"
    >
      <Titulo titulo={texto(bloque, "title") ?? "Por tamaño"} />
      <ul className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {categorias.map((categoria, i) => (
          <li key={categoria.id}>
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              style={{ backgroundColor: azulejo(i) }}
              className={cn("group block overflow-hidden p-3 md:p-4", RADIO)}
            >
              <span className="relative block aspect-[5/4]">
                {categoria.foto ? (
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 45vw, 25vw"
                    className="object-contain mix-blend-multiply transition-transform duration-300 ease-out group-hover:-translate-y-[3%] motion-reduce:transform-none"
                  />
                ) : null}
              </span>
              <span className="mt-2 flex items-baseline justify-between gap-2">
                <span className="truncate font-titular text-lg leading-tight">
                  {categoria.nombre}
                </span>
                <span className="tabular shrink-0 text-sm font-semibold opacity-70">
                  {categoria.productos}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Grilla({ bloque, tienda }: PropsBloque) {
  const productos = productosDeGrilla(bloque, tienda.productos)
  if (productos.length === 0) return null

  const columnas =
    numero(bloque, "columns") ?? tienda.apariencia.disposicion.columnas

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-20">
      <Titulo
        titulo={texto(bloque, "title") ?? "Lo nuevo"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo"),
        }}
      />
      <div
        data-ajuste="disposicion.tarjeta disposicion.columnas"
        className={cn("mt-7", grilla(columnas))}
      >
        {productos.map((producto) => (
          <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
        ))}
      </div>
    </section>
  )
}

/** El cierre con botón: el segundo azulejo de lado a lado, con dos salidas. */
function Cierre({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section
      style={variablesDeAzulejos(tienda)}
      className="mx-auto w-full max-w-7xl px-5 py-10 md:py-14"
    >
      <div
        className={cn(
          "bg-[var(--azulejo-2)] px-6 py-12 text-center md:px-12 md:py-16",
          RADIO
        )}
      >
        <h2 className="mx-auto max-w-[18ch] font-titular text-[clamp(1.875rem,7vw,3.25rem)] leading-[1]">
          {titulo ?? "Escríbenos"}
        </h2>
        {cuerpo ? (
          <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed opacity-85">
            {cuerpo}
          </p>
        ) : null}
        <div
          className={cn(
            "mx-auto mt-8 grid max-w-md gap-2",
            tienda.whatsapp && "sm:grid-cols-2"
          )}
        >
          <Boton href={rutaDeTienda(tienda.slug, "/catalogo")} className="px-4">
            {texto(bloque, "buttonLabel") ?? "Ver el catálogo"}
          </Boton>
          {tienda.whatsapp ? (
            <Boton
              href={`https://wa.me/${numeroDeWhatsApp(tienda.whatsapp)}`}
              externo
              lleno={false}
              className="px-4"
            >
              Escríbenos
            </Boton>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export const BLOQUES_CORREA: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  cta: Cierre,
}
