import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import {
  accionDePortada,
  categoriasConFoto,
  filtroDeGrilla,
  fotoDePortada,
  numero,
  productosDeGrilla,
  texto,
} from "@/lib/plantillas/bloques"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type { TiendaPublica } from "@/lib/data/tienda-publica"
import {
  Rotulo,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/bazar/piezas"
import { BLOQUES_CLASICOS } from "@/components/plantillas/clasica/bloques"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"

/**
 * Los bloques de Bazar.
 *
 * La portada es un mostrador: el titular a un lado y, al otro, tres cosas de
 * la tienda apoyadas un poco torcidas, porque un bazar se entiende por la
 * variedad y no por un producto estrella. Las categorías son un tablero de
 * recuadros de distinto tamaño, el primero más grande.
 */

/**
 * Las fotos del mostrador: la de la portada y otras dos, de productos
 * distintos. Los de ejemplo del editor no entran, como en `fotoDePortada`.
 */
function fotosDelMostrador(
  principal: string | null,
  tienda: TiendaPublica
): string[] {
  if (!principal) return []
  if (tienda.productosDeEjemplo) return [principal]
  const otras = tienda.productos
    .map((p) => p.image_url)
    .filter((url): url is string => Boolean(url) && url !== principal)
  return [principal, ...Array.from(new Set(otras)).slice(0, 2)]
}

const GIROS = ["-rotate-3", "rotate-6", "-rotate-6"]

function Portada({ bloque, tienda }: PropsBloque) {
  const fotos = fotosDelMostrador(fotoDePortada(bloque, tienda), tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver todo lo que hay"

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pt-8 pb-12 md:pt-14 md:pb-16">
      <div
        className={cn(
          "grid gap-10",
          fotos.length > 0 && "md:grid-cols-[1.1fr_1fr] md:items-center"
        )}
      >
        <div>
          <Rotulo>{tienda.nombre}</Rotulo>
          <h1 className="mt-4 font-titular text-[clamp(3rem,13vw,7rem)] leading-[0.92]">
            {titulo}
          </h1>
          {bajada ? (
            <p className="mt-5 max-w-[44ch] text-lg leading-relaxed opacity-80">
              {bajada}
            </p>
          ) : null}
          <Link
            href={rutaDeTienda(tienda.slug, "/catalogo")}
            className="group mt-8 inline-flex min-h-13 items-center gap-3 rounded-plantilla bg-tinta pr-2 pl-6 font-semibold text-papel transition-[background-color,transform] hover:bg-senal hover:text-white active:scale-[0.98]"
          >
            {accion}
            <span className="flex size-9 items-center justify-center rounded-full bg-papel text-tinta transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none">
              <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </Link>
        </div>

        {fotos.length > 0 ? (
          <div className="relative mx-auto aspect-[5/4] w-full max-w-md md:max-w-none">
            {fotos.map((foto, i) => (
              <div
                key={foto}
                className={cn(
                  "absolute overflow-hidden border-4 border-papel bg-tinta/[0.06] shadow-[0_18px_36px_-18px_color-mix(in_oklab,var(--tinta)_45%,transparent)]",
                  "rounded-[1.5rem]",
                  GIROS[i],
                  fotos.length === 1
                    ? "inset-[6%]"
                    : i === 0
                      ? "top-[4%] left-[14%] z-20 h-[78%] w-[56%]"
                      : i === 1
                        ? "top-0 right-0 z-10 h-[54%] w-[40%]"
                        : "bottom-0 left-0 z-30 h-[44%] w-[34%]"
                )}
              >
                <Image
                  src={foto}
                  alt=""
                  fill
                  priority={i === 0}
                  unoptimized
                  sizes="(max-width: 768px) 60vw, 30vw"
                  className="object-cover"
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
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null
  // De dos por dos solo si hay con qué llenar el tablero a su lado: con
  // menos de cinco quedaba un hueco debajo de las chicas.
  const grande = categorias.length >= 5

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-16">
      <Titulo titulo={texto(bloque, "title") ?? "¿Qué estás buscando?"} />

      <ul className="mt-6 grid auto-rows-[9.5rem] grid-cols-2 gap-2.5 md:auto-rows-[11rem] md:grid-cols-4 md:gap-4">
        {categorias.map((categoria, i) => (
          <li
            key={categoria.id}
            // El primero, el grande: a lo ancho en el celular, donde dos columnas
            // no le dejan lugar a su nombre, y de dos por dos en la computadora.
            className={cn(
              i === 0 && "col-span-2",
              i === 0 && grande && "md:row-span-2"
            )}
          >
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className={cn(
                "group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] p-4 transition-transform active:scale-[0.98] md:p-5",
                i === 0 ? "bg-tinta text-papel" : "bg-tinta/[0.06]"
              )}
            >
              <span className="relative z-10">
                <span
                  className={cn(
                    "block font-titular break-words",
                    i === 0
                      ? "text-[clamp(1.75rem,7vw,3rem)]"
                      : "text-xl md:text-2xl",
                    "leading-none"
                  )}
                >
                  {categoria.nombre}
                </span>
                <span className="tabular mt-1.5 block text-xs font-semibold opacity-70">
                  {categoria.productos}{" "}
                  {categoria.productos === 1 ? "producto" : "productos"}
                </span>
              </span>

              {categoria.foto ? (
                <span
                  className={cn(
                    "absolute overflow-hidden rounded-full border-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transform-none",
                    i === 0
                      ? "-right-6 -bottom-6 size-40 border-tinta md:size-56"
                      : "-right-4 -bottom-4 size-20 border-papel md:size-24"
                  )}
                >
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes={i === 0 ? "224px" : "96px"}
                    className="object-cover"
                  />
                </span>
              ) : null}

              <ArrowRight
                aria-hidden="true"
                className="relative z-10 size-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
              />
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
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-16">
      <Titulo
        titulo={texto(bloque, "title") ?? "Productos"}
        enlace={{
          etiqueta: "Ver todo",
          href: rutaDeTienda(tienda.slug, "/catalogo", {
            condicion: filtroDeGrilla(bloque).condicion,
          }),
        }}
      />
      <div className={cn("mt-6", grilla(columnas))}>
        {productos.map((producto) => (
          <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
        ))}
      </div>
    </section>
  )
}

export const BLOQUES_BAZAR: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
}
