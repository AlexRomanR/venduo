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
import {
  Boton,
  ReglaDeEstrellas,
  Tarjeta,
  Titulo,
  grilla,
} from "@/components/plantillas/ambar/piezas"
import { BLOQUES_CLASICOS } from "@/components/plantillas/clasica/bloques"
import { preguntasPlegadas } from "@/components/plantillas/comunes/preguntas"
import type { KitDeTienda, PropsBloque } from "@/components/plantillas/kit"

/**
 * Los bloques de Ámbar.
 *
 * La portada sigue la banda de tinta de la cabecera: el titular en papel y el
 * frasco en un marco ochavado, cerrada abajo por la regla de estrellas. Las
 * familias —amaderados, dulces, florales— van en azulejos de tinta con la
 * foto apagada al costado.
 */

/** El marco ochavado: un octógono con las esquinas cortadas. */
const OCHAVADO =
  "[clip-path:polygon(12%_0,88%_0,100%_12%,100%_88%,88%_100%,12%_100%,0_88%,0_12%)]"

function Portada({ bloque, tienda }: PropsBloque) {
  const foto = fotoDePortada(bloque, tienda)
  const titulo = texto(bloque, "title") ?? tienda.nombre
  const bajada = texto(bloque, "subtitle")
  const accion = accionDePortada(bloque) ?? "Ver los perfumes"

  return (
    <section className="bg-tinta text-papel">
      <div
        className={cn(
          "mx-auto grid w-full max-w-7xl gap-10 px-5 pt-10 pb-12 md:pt-16 md:pb-16",
          foto
            ? "md:grid-cols-[1.1fr_1fr] md:items-center md:gap-16"
            : "text-center"
        )}
      >
        <div>
          <h1
            className={cn(
              "font-titular text-[clamp(2.5rem,10vw,5rem)] leading-[1.05]",
              foto ? "max-w-[14ch]" : "mx-auto max-w-[16ch]"
            )}
          >
            {titulo}
          </h1>
          {bajada ? (
            <p
              className={cn(
                "mt-5 max-w-[42ch] text-lg leading-relaxed opacity-80",
                !foto && "mx-auto"
              )}
            >
              {bajada}
            </p>
          ) : null}
          <Boton
            href={rutaDeTienda(tienda.slug, "/catalogo")}
            claro
            className="mt-8"
          >
            {accion}
          </Boton>
        </div>

        {foto ? (
          <div
            className={cn("mx-auto w-full max-w-md bg-papel/25 p-px", OCHAVADO)}
          >
            <div className={cn("relative aspect-square bg-papel/10", OCHAVADO)}>
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
          </div>
        ) : null}
      </div>
      <ReglaDeEstrellas className="text-papel/35" />
    </section>
  )
}

function Categorias({ bloque, tienda }: PropsBloque) {
  const categorias = categoriasConFoto(tienda, numero(bloque, "limit") ?? 8)
  if (categorias.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-12 md:py-20">
      <Titulo titulo={texto(bloque, "title") ?? "Por familia"} />
      <ul className="mt-7 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            <Link
              href={rutaDeTienda(tienda.slug, "/catalogo", {
                categoria: categoria.id,
              })}
              className="group relative flex h-[5.5rem] flex-col justify-center overflow-hidden rounded-plantilla bg-tinta px-4 text-papel md:h-28"
            >
              {categoria.foto ? (
                <span className="absolute inset-y-0 right-0 w-[45%]">
                  <Image
                    src={categoria.foto}
                    alt=""
                    fill
                    unoptimized
                    sizes="200px"
                    className="object-cover opacity-35 transition-opacity duration-500 group-hover:opacity-55"
                  />
                </span>
              ) : null}
              <span className="relative font-titular text-lg leading-tight md:text-xl">
                {categoria.nombre}
              </span>
              <span className="tabular relative mt-0.5 text-xs opacity-70">
                {categoria.productos}{" "}
                {categoria.productos === 1 ? "perfume" : "perfumes"}
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
        titulo={texto(bloque, "title") ?? "Los más pedidos"}
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

/** El cierre con botón: otra banda de noche, entre dos reglas. */
function Cierre({ bloque, tienda }: PropsBloque) {
  const titulo = texto(bloque, "title")
  const cuerpo = texto(bloque, "body")
  if (!titulo && !cuerpo) return null

  return (
    <section className="bg-tinta text-papel">
      <ReglaDeEstrellas className="text-papel/35" />
      <div className="mx-auto w-full max-w-3xl px-5 py-14 text-center md:py-20">
        <h2 className="font-titular text-[clamp(1.875rem,7vw,3rem)] leading-[1.08]">
          {titulo ?? "Escríbenos"}
        </h2>
        {cuerpo ? (
          <p className="mx-auto mt-4 max-w-[46ch] leading-relaxed opacity-80">
            {cuerpo}
          </p>
        ) : null}
        <Boton
          href={rutaDeTienda(tienda.slug, "/catalogo")}
          claro
          className="mt-8"
        >
          {texto(bloque, "buttonLabel") ?? "Ver los perfumes"}
        </Boton>
      </div>
      <ReglaDeEstrellas className="text-papel/35" />
    </section>
  )
}

export const BLOQUES_AMBAR: KitDeTienda["bloques"] = {
  ...BLOQUES_CLASICOS,
  hero: Portada,
  categories: Categorias,
  product_grid: Grilla,
  faq: preguntasPlegadas(Titulo),
  cta: Cierre,
}
