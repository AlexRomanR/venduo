import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

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
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"
import {
  Boton,
  ESTUCHE,
  Filete,
  Rotulo,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/quilate/piezas"

/**
 * Los bloques de Quilate.
 *
 * La portada es un mostrador: el titular al centro y la pieza debajo, con una
 * lupa que muestra su detalle. Las categorías no van con foto sino con un
 * ícono de línea —aretes, collar, anillo—: en joyería se elige primero por
 * dónde se lleva, y doce fotos chicas de metal se ven todas iguales.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver las piezas"

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pt-10 pb-14 text-center md:pt-16 md:pb-20">
      <Rotulo>{tienda.nombre}</Rotulo>
      <h1 className="mx-auto mt-5 max-w-[16ch] font-titular text-[clamp(2.25rem,9vw,5rem)] leading-[1.08]">
        {titulo}
      </h1>
      {bajada ? (
        <p className="mx-auto mt-5 max-w-[44ch] text-lg leading-relaxed opacity-80">
          {bajada}
        </p>
      ) : null}
      <div className="mt-8">
        <Boton href={rutaDeTienda(tienda.slug, "/catalogo")}>{accion}</Boton>
      </div>

      {foto ? (
        <div className="relative mx-auto mt-12 w-full max-w-[34rem] md:mt-16">
          <div
            className={cn(
              "relative aspect-square overflow-hidden rounded-[calc(var(--radio)*0.5)]",
              ESTUCHE
            )}
          >
            <Image
              src={foto}
              alt=""
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 544px"
              className="object-cover"
            />
          </div>
          {/* La lupa: la misma foto, de cerca. Decora; no dice nada nuevo. */}
          <span
            aria-hidden="true"
            className="absolute -right-1 -bottom-6 size-28 overflow-hidden rounded-full bg-papel ring-4 ring-papel md:-right-10 md:-bottom-10 md:size-40"
          >
            <span className="absolute inset-0 overflow-hidden rounded-full ring-1 ring-tinta/25 ring-inset">
              <Image
                src={foto}
                alt=""
                fill
                unoptimized
                sizes="160px"
                className="origin-[55%_45%] scale-[2.5] object-cover"
              />
            </span>
          </span>
        </div>
      ) : (
        <Filete className="mx-auto mt-14 max-w-xs" />
      )}
    </section>
  )
}

/* Los íconos de cada lugar del cuerpo, en línea fina, de 40 por 40. */
const TRAZOS: [RegExp, ReactNode][] = [
  [
    /aret|\baros?\b|pendient|zarcill/i,
    <>
      <path d="M13 6v6M27 6v6" />
      <circle cx="13" cy="19" r="6" />
      <circle cx="27" cy="19" r="6" />
      <path d="M13 25v5M27 25v5" />
      <circle cx="13" cy="32" r="1.5" />
      <circle cx="27" cy="32" r="1.5" />
    </>,
  ],
  [
    /collar|cadena|gargantill|dije|colgant/i,
    <>
      <path d="M8 7c0 12 5 18 12 18s12-6 12-18" />
      <path d="M20 25v3" />
      <path d="m20 28 3.5 4-3.5 4-3.5-4z" />
    </>,
  ],
  [
    /anill|sortij|argoll/i,
    <>
      <circle cx="20" cy="25" r="9.5" />
      <path d="m15.5 15.5 4.5-6 4.5 6z" />
    </>,
  ],
  [
    /pulser|brazalet|esclav|tobiller/i,
    <>
      <ellipse cx="20" cy="20" rx="14" ry="9" />
      <ellipse cx="20" cy="20" rx="9.5" ry="5" />
    </>,
  ],
  [
    /reloj/i,
    <>
      <rect x="13" y="12" width="14" height="16" rx="4" />
      <path d="M16 12V5h8v7M16 28v7h8v-7" />
      <path d="M20 16.5V20l2.5 2" />
    </>,
  ],
  [
    /lente|gafa/i,
    <>
      <circle cx="12" cy="22" r="6" />
      <circle cx="28" cy="22" r="6" />
      <path d="M18 22h4M6.5 19.5 5 15M33.5 19.5 35 15" />
    </>,
  ],
  [
    /broche|prendedor|vincha|pinza|cabello/i,
    <>
      <path d="M8 26c6-12 18-12 24 0" />
      <circle cx="20" cy="17.5" r="2.5" />
    </>,
  ],
]

/** El rombo: lo que va cuando la categoría no se reconoce. */
const ROMBO = (
  <>
    <path d="m20 7 11 13-11 13L9 20z" />
    <path d="M9 20h22M15 13.5l5 6.5 5-6.5" />
  </>
)

function Icono({ nombre }: { nombre: string }) {
  const trazo = TRAZOS.find(([patron]) => patron.test(nombre))?.[1] ?? ROMBO
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-10 md:size-12"
    >
      {trazo}
    </svg>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
      <Titulo titulo={texto(bloque, "title") ?? "Por dónde la llevas"} />

      <ul className="mt-8 grid grid-cols-3 border-t border-l border-tinta/15 md:mt-10">
        {categorias.map((categoria) => (
          <li key={categoria.id} className="border-r border-b border-tinta/15">
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className="group flex h-full flex-col items-center gap-3 px-2 py-6 text-center transition-colors hover:bg-tinta/[0.04] md:py-9"
            >
              <span className="transition-transform duration-500 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none">
                <Icono nombre={categoria.nombre} />
              </span>
              <span className="text-xs leading-snug tracking-[0.18em] uppercase md:text-[13px]">
                {categoria.nombre}
              </span>
              <span className="tabular -mt-1.5 text-xs opacity-60">
                {categoria.productos}{" "}
                {categoria.productos === 1 ? "pieza" : "piezas"}
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
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <Titulo
        titulo={texto(bloque, "title") ?? "Recién llegadas"}
        enlace={{
          etiqueta: "Ver todas",
          href: rutaDeTienda(tienda.slug, "/catalogo"),
        }}
      />
      <div
        data-ajuste="disposicion.tarjeta disposicion.columnas"
        className={cn("mt-8 md:mt-10", grilla(columnas))}
      >
        {productos.map((producto) => (
          <Tarjeta key={producto.id} producto={producto} tienda={tienda} />
        ))}
      </div>
    </section>
  )
}

/** Un texto de la casa: con foto, la pieza en un círculo y la historia al lado. */
function Texto({ bloque }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  const foto = texto(bloque, "imageUrl")
  if (!titulo && !cuerpo && !foto) return null

  return (
    <section
      className={cn(
        "mx-auto grid w-full max-w-5xl gap-10 px-5 py-14 md:py-20",
        foto && "md:grid-cols-[0.8fr_1fr] md:items-center md:gap-16"
      )}
    >
      {foto ? (
        <div
          className={cn(
            "relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-full",
            ESTUCHE
          )}
        >
          <Image
            src={foto}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className={cn("text-center", foto && "md:text-left")}>
        {titulo ? (
          <h2 className="font-titular text-[clamp(1.75rem,6vw,2.75rem)] leading-[1.12]">
            {titulo}
          </h2>
        ) : null}
        {cuerpo ? (
          <p className="mt-5 text-lg leading-relaxed whitespace-pre-line opacity-80">
            {cuerpo}
          </p>
        ) : null}
      </div>
    </section>
  )
}

/** El cierre con botón: un estuche al centro, enmarcado por un filete. */
function Cierre({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 md:py-14">
      <div
        className={cn(
          "rounded-[calc(var(--radio)*0.5)] px-6 py-14 text-center md:py-20",
          ESTUCHE
        )}
      >
        <h2 className="mx-auto max-w-[20ch] font-titular text-[clamp(1.5rem,6vw,2.5rem)] leading-[1.12]">
          {titulo ?? "Escríbenos"}
        </h2>
        {cuerpo ? (
          <p className="mx-auto mt-4 max-w-[46ch] leading-relaxed opacity-80">
            {cuerpo}
          </p>
        ) : null}
        <div className="mt-8">
          <Boton href={rutaDeTienda(tienda.slug, "/catalogo")}>
            {texto(bloque, "buttonLabel") ?? "Ver las piezas"}
          </Boton>
        </div>
      </div>
    </section>
  )
}

export const BLOQUES_QUILATE: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  about: Texto,
  cta: Cierre,
}
