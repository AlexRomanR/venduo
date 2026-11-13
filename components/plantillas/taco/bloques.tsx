import Image from "next/image"
import Link from "next/link"

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
import { preguntasPlegadas } from "@/components/plantillas/comunes/preguntas"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"
import {
  BOTON,
  PLACA,
  Repisa,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/taco/piezas"

/**
 * Los bloques de Taco.
 *
 * La portada es una vitrina apaisada: la foto ancha, apoyada sobre la repisa
 * que cruza la página, y debajo el titular en minúsculas. Los tipos de taco
 * se pasan de lado, cada uno en su placa, y en la computadora se ven seis.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver los modelos"

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pt-5 pb-12 md:pt-8 md:pb-20">
      {foto ? (
        <div
          className={cn(
            "relative aspect-[16/10] overflow-hidden md:aspect-[21/9]",
            PLACA
          )}
        >
          <Image
            src={foto}
            alt=""
            fill
            priority
            unoptimized
            sizes="(max-width: 1280px) 100vw, 1240px"
            className="object-cover object-[50%_65%]"
          />
        </div>
      ) : null}
      <Repisa />
      <div className="mt-6 grid gap-5 md:mt-8 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-14">
        <h1 className="font-titular text-[clamp(3rem,12vw,6rem)] leading-[0.92] lowercase">
          {titulo}
        </h1>
        <div>
          {bajada ? (
            <p className="max-w-[42ch] text-lg leading-relaxed opacity-80">
              {bajada}
            </p>
          ) : null}
          <Link
            href={rutaDeTienda(tienda.slug, "/catalogo")}
            className={cn(BOTON, "mt-6")}
          >
            {accion}
          </Link>
        </div>
      </div>
    </section>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl py-12 md:py-20">
      <div className="px-5">
        <Titulo titulo={texto(bloque, "title") ?? "por tipo de taco"} />
      </div>
      <ul className="mt-7 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-3 overflow-x-auto px-5 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="w-[36%] shrink-0 snap-start sm:w-[24%] md:w-auto"
          >
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className="group block"
            >
              <span
                className={cn(
                  "relative block aspect-[4/3] overflow-hidden",
                  PLACA
                )}
              >
                {categoria.foto ? (
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 40vw, 200px"
                    className="object-cover object-bottom transition-transform duration-500 ease-out group-hover:translate-x-[2%] motion-reduce:transform-none"
                  />
                ) : null}
              </span>
              <Repisa />
              <span className="mt-2 block text-base leading-tight lowercase transition-colors group-hover:text-senal">
                {categoria.nombre}
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
        titulo={texto(bloque, "title") ?? "recién llegados"}
        enlace={{
          etiqueta: "ver todo",
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

/** El cierre con botón: el texto sobre una placa, apoyado en la repisa. */
function Cierre({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 md:py-14">
      <div className={cn("px-6 pt-12 md:px-12 md:pt-16", PLACA)}>
        <h2 className="max-w-[18ch] font-titular text-[clamp(2rem,8vw,3.5rem)] leading-[0.95] lowercase">
          {titulo ?? "escríbenos"}
        </h2>
        {cuerpo ? (
          <p className="mt-4 max-w-[46ch] leading-relaxed opacity-80">
            {cuerpo}
          </p>
        ) : null}
        <Link
          href={rutaDeTienda(tienda.slug, "/catalogo")}
          className={cn(BOTON, "mt-8 mb-12 md:mb-16")}
        >
          {texto(bloque, "buttonLabel") ?? "Ver los modelos"}
        </Link>
      </div>
      <Repisa />
    </section>
  )
}

export const BLOQUES_TACO: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  faq: preguntasPlegadas(Titulo, { regla: "border-tinta/25" }),
  cta: Cierre,
}
