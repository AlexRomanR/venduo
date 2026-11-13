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
import { preguntasPlegadas } from "@/components/plantillas/comunes/preguntas"
import {
  Boton,
  Garabato,
  RADIO,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/crayon/piezas"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"

/**
 * Los bloques de Crayón.
 *
 * La portada: el titular con su garabato y una foto muy redonda. Las
 * categorías van en **el tallímetro**: burbujas colgadas de una regla con
 * sus marcas, una por edad —de 0 a 12 meses, de 1 a 3 años—, que se desliza
 * en el celular y se reparte de lado a lado en la computadora.
 */

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver por edad"

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pt-8 pb-12 md:pt-14 md:pb-20">
      <div
        className={cn(
          "grid gap-10",
          foto && "md:grid-cols-[1.1fr_1fr] md:items-center md:gap-16"
        )}
      >
        <div>
          <h1 className="max-w-[12ch] font-titular text-[clamp(2.75rem,11vw,5.5rem)] leading-[0.98]">
            {titulo}
          </h1>
          <Garabato className="mt-4 w-32" />
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-tinta/[0.06] md:mx-auto md:aspect-square md:w-full md:max-w-md md:rounded-full">
            <Image
              src={foto}
              alt=""
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Tallimetro({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 6)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl py-12 md:py-20">
      <div className="px-5">
        <Titulo titulo={texto(bloque, "title") ?? "Por edad"} />
      </div>
      <div className="mt-7 [scrollbar-width:none] overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden">
        <div className="w-max min-w-full">
          <ul className="flex gap-6 md:justify-around">
            {categorias.map((categoria) => (
              <li key={categoria.id} className="flex flex-col items-center">
                <Link
                  href={rutaDeTienda(tienda.slug, "/catalogo", {
                    categoria: categoria.id,
                  })}
                  className="flex min-h-11 items-center gap-2 rounded-full border-2 border-tinta bg-papel px-4 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-tinta hover:text-papel"
                >
                  {categoria.nombre}
                  <span className="tabular text-xs font-medium opacity-60">
                    {categoria.productos}
                  </span>
                </Link>
                <span aria-hidden="true" className="h-6 w-0.5 bg-tinta" />
              </li>
            ))}
          </ul>
          {/* La regla del tallímetro: una marca cada 8 px, más larga cada 40. */}
          <div
            aria-hidden="true"
            className="h-4 border-t-2 border-tinta"
            style={{
              background:
                "repeating-linear-gradient(90deg, var(--tinta) 0 2px, transparent 2px 40px) top / 100% 100% no-repeat, repeating-linear-gradient(90deg, var(--tinta) 0 2px, transparent 2px 8px) top / 100% 50% no-repeat",
            }}
          />
        </div>
      </div>
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

/** El cierre con botón: dos salidas del mismo peso. */
function Cierre({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 md:py-14">
      <div
        className={cn(
          "bg-senal/10 px-6 py-12 text-center md:px-12 md:py-16",
          RADIO
        )}
      >
        <h2 className="mx-auto max-w-[18ch] font-titular text-[clamp(1.875rem,7vw,3rem)] leading-[1.02]">
          {titulo ?? "Escríbenos"}
        </h2>
        <Garabato className="mx-auto mt-3" />
        {cuerpo ? (
          <p className="mx-auto mt-5 max-w-[44ch] leading-relaxed opacity-85">
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

export const BLOQUES_CRAYON: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Tallimetro,
  product_grid: Grilla,
  faq: preguntasPlegadas(Titulo, { regla: "border-tinta/15" }),
  cta: Cierre,
}
