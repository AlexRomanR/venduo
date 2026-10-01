import Image from "next/image"

import type { Apariencia } from "@/lib/plantillas/apariencia"
import { estiloDelTitular } from "@/lib/plantillas/fuentes"
import { cn } from "@/lib/utils"

/**
 * La tienda con su propia cara, dentro de un panel que ya no se tiñe.
 *
 * El panel es una herramienta de Venduo y se ve igual para todos; la identidad
 * de cada tienda vive acá: su papel de fondo, su nombre con su letra y una
 * franja con su color de acción, como una vidriera en miniatura. Antes el
 * panel entero tomaba la plantilla, y una letra o un color pensados para
 * vender —una condensada en mayúsculas, un azul de botón de compra— terminaban
 * en cada rótulo de una herramienta de trabajo.
 *
 * Es decorativo: el nombre de la tienda ya está escrito al lado.
 */
export function SelloDeTienda({
  nombre,
  logoUrl,
  apariencia,
  compacto = false,
  className,
}: {
  nombre: string
  logoUrl: string | null
  apariencia: Apariencia
  /** Solo la inicial, para el celular y la barra lateral. */
  compacto?: boolean
  /** Para cambiar el tamaño del compacto: en la barra va más chico. */
  className?: string
}) {
  const { colores, tipografia } = apariencia

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border border-tinta",
        compacto
          ? "size-14 items-center justify-center"
          : "aspect-[4/3] w-44 justify-between p-3",
        className
      )}
      style={{ background: colores.papel, color: colores.tinta }}
    >
      {compacto ? (
        logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            fill
            unoptimized
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span
            className="pb-1 text-2xl leading-none"
            style={estiloDelTitular(tipografia)}
          >
            {nombre.trim().charAt(0)}
          </span>
        )
      ) : (
        <>
          {logoUrl ? (
            <span className="relative size-9 overflow-hidden">
              <Image
                src={logoUrl}
                alt=""
                fill
                unoptimized
                sizes="36px"
                className="object-contain object-left"
              />
            </span>
          ) : (
            <span />
          )}
          <span
            className="line-clamp-2 pb-2 text-xl leading-[1.05]"
            style={estiloDelTitular(tipografia)}
          >
            {nombre}
          </span>
        </>
      )}

      {/* La franja es su color de acción: el del botón de comprar. */}
      <span
        className={cn("absolute inset-x-0 bottom-0", compacto ? "h-1" : "h-2")}
        style={{ background: colores.senal }}
      />
    </div>
  )
}
