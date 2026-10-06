import Image from "next/image"
import { Boxes } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { Entra } from "@/components/landing/entra"
import { Simbolo } from "@/components/marca/logo"

import vendedora from "@/public/portada/vendedora.webp"
import tiendaRosa from "@/public/portada/tienda-rosa.webp"

/**
 * El primer viewport de la portada: quien vende, su tienda y lo que le avisa
 * Venduo.
 *
 * Tres capas, y cada una dice una de las tres cosas del titular. La foto es
 * quien vende por redes: joven, con el celular en la mano y un pedido listo. El
 * celular es una tienda real —Rosa Deportes, de las de demostración—
 * capturada tal como se ve: es la tienda online. Las dos tarjetas son lo que
 * hay detrás: el pedido que llegó, que es la venta, y el stock que se está
 * acabando, que es el inventario. La del pedido lleva el símbolo de Venduo
 * porque es Venduo quien avisa.
 *
 * Las tarjetas van sobre papel y con borde, nunca la marca suelta sobre la
 * foto (`marca.md`). Sin sombras: la profundidad la dan el solapamiento y la
 * regla.
 *
 * La captura de la tienda es un archivo: si su diseño cambia, se vuelve a
 * sacar a 390 px de ancho y doble densidad, desde la sección "Lo nuevo". Está
 * retocada: el primer producto de la tienda era un mouse gamer, que no pega en
 * una tienda de deportes, y en la captura es una zapatilla de running, con
 * una foto de Pexels (2529148) sobre fondo claro, como los demás productos. Por eso el pie dice que
 * la tienda es ilustrativa.
 */

const PEDIDO = {
  numero: 152,
  lineas: "2× Polera básica · 1× Gorra deportiva",
  totalCents: 18500,
}

export function Vitrina() {
  return (
    <figure>
      <div className="relative pb-8 pl-6 sm:pb-10 sm:pl-12">
        {/* La foto vuelve a color al pasar el cursor, como las demás de la
            portada: el rojo de señal es el único acento. */}
        <div className="relative ml-auto aspect-[4/5] w-[86%] overflow-hidden bg-tinta/10">
          <Image
            src={vendedora}
            alt="Una joven con su celular y una bolsa de compras"
            fill
            priority
            placeholder="blur"
            sizes="(max-width: 1024px) 80vw, 440px"
            quality={85}
            className="object-cover object-top grayscale transition-[filter] duration-500 ease-out hover:grayscale-0"
          />
        </div>

        {/* La tienda, en un celular recto: nada de teléfonos flotando en
            ángulo (`.impeccable/surfaces/app-page-tsx.md`). */}
        <div className="absolute bottom-0 left-0 w-[38%] max-w-[12rem] rounded-[1.6rem] border-[5px] border-tinta bg-tinta sm:border-[6px]">
          <div className="relative overflow-hidden rounded-[1.25rem]">
            <Image
              src={tiendaRosa}
              alt="La tienda online de Rosa Deportes, con sus productos y precios"
              placeholder="blur"
              sizes="(max-width: 1024px) 38vw, 192px"
              quality={90}
              className="block h-auto w-full"
            />
          </div>
        </div>

        <Entra
          demora={160}
          className="absolute right-0 bottom-[9%] w-[60%] max-w-[17rem]"
        >
          <div className="border border-tinta bg-papel px-3.5 py-3">
            <p className="flex items-center gap-2 text-[0.7rem]">
              <Simbolo className="size-4" />
              <span className="font-semibold">Venduo</span>
              <span className="ml-auto opacity-65">ahora</span>
            </p>
            <p className="mt-2 font-titular text-sm leading-tight font-bold tracking-[-0.01em]">
              Nuevo pedido #{PEDIDO.numero}{" "}
              <span className="hidden sm:inline">por WhatsApp</span>
            </p>
            {/* En el celular la tarjeta tapaba media foto: el detalle va desde
                `sm`, y el número y el total alcanzan para leerla. */}
            <p className="mt-1 hidden truncate text-xs opacity-70 sm:block">
              {PEDIDO.lineas}
            </p>
            <p className="tabular mt-1.5 font-titular text-base font-extrabold">
              {formatMoney(PEDIDO.totalCents)}
            </p>
          </div>
        </Entra>

        <Entra className="absolute top-[3%] left-0 w-[44%] max-w-[11rem]">
          <div className="flex items-start gap-2.5 border border-tinta bg-papel px-3.5 py-3">
            <Boxes aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs">Polera básica</p>
              <p className="tabular text-sm font-bold text-senal">Quedan 3</p>
            </div>
          </div>
        </Entra>
      </div>

      <figcaption className="mt-3 text-xs leading-relaxed opacity-65">
        En el celular, Rosa Deportes, una tienda de demostración hecha con
        Venduo. La tienda, el pedido y el stock son ilustrativos.
      </figcaption>
    </figure>
  )
}
