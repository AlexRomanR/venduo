import Link from "next/link"
import { LayoutTemplate, Palette, Plus } from "lucide-react"

import type { ClavePlantilla } from "@/lib/catalogos/constantes"
import type { DatosDelCatalogo } from "@/lib/catalogos/datos"
import type { Catalogo, Estilo } from "@/lib/catalogos/modelo"
import {
  armarCatalogo,
  armarConEstilo,
  consultaDeEleccion,
  PLANTILLAS_DE_CATALOGO,
  type EleccionDePlantilla,
  type EstiloSugerido,
} from "@/lib/catalogos/plantillas"
import { BOTON_PRIMARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { Seccion, SinDatos } from "@/components/panel/piezas"
import { MiniaturaDeCatalogo } from "@/components/catalogos/miniatura"

const NOMBRE_DE_MUESTRA = "Catálogo de temporada"

/**
 * Las plantillas de la lista de catálogos: las de tu tienda y las doce, cada
 * una dibujada con tus productos y tus colores. Tocar una empieza un catálogo
 * nuevo con ella: solo falta elegir los productos.
 *
 * Es la misma pieza en la web y en la app, que la muestra dentro de su lista
 * (`/editor/app/catalogo/plantillas`): cada tarjeta lleva su elección en
 * `data-eleccion`, y allá un toque se le avisa a la app en vez de navegar.
 */
export function PlantillasDeLaLista({
  datos,
  estiloDeTienda,
  sugeridos,
  plantillas,
  ruta = "/panel/catalogos/nuevo",
}: {
  datos: DatosDelCatalogo
  estiloDeTienda: Estilo
  sugeridos: EstiloSugerido[]
  plantillas: readonly ClavePlantilla[]
  /** A dónde lleva una tarjeta, antes de su `?plantilla=` o `?estilo=`. */
  ruta?: string
}) {
  // Las muestras se arman con los primeros productos: alcanzan para ver cómo
  // queda cada plantilla sin dibujar el catálogo entero catorce veces.
  const muestra = Object.values(datos.productos).slice(0, 12)
  const tienda = {
    nombre: datos.tienda.nombre,
    whatsapp: datos.tienda.whatsapp,
  }

  if (muestra.length === 0) {
    return (
      <Seccion
        id="plantillas"
        icono={LayoutTemplate}
        titulo="Plantillas para empezar"
        bajada="Con tus productos y tus colores."
      >
        <SinDatos
          icono={LayoutTemplate}
          titulo="Primero, tus productos"
          texto="Las plantillas se dibujan con lo que vendes. Carga algunos productos y vuelve a verlas."
        >
          <Link
            href="/panel/productos/nuevo"
            className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
          >
            <Plus aria-hidden="true" className="size-4" />
            Cargar un producto
          </Link>
        </SinDatos>
      </Seccion>
    )
  }

  return (
    <>
      {sugeridos.length > 0 ? (
        <Seccion
          id="con-tu-estilo"
          icono={Palette}
          titulo="Plantillas con el estilo de tu tienda"
          bajada="Tus colores, a toda hoja o en oscuro."
        >
          <Rejilla>
            {sugeridos.map((sugerido) => (
              <Tarjeta
                key={sugerido.clave}
                ruta={ruta}
                eleccion={{ tipo: "estilo", clave: sugerido.clave }}
                catalogo={armarConEstilo(sugerido, {
                  nombre: NOMBRE_DE_MUESTRA,
                  productos: muestra,
                  tienda,
                })}
                datos={datos}
                nombre={sugerido.nombre}
                detalle={`Plantilla ${PLANTILLAS_DE_CATALOGO[sugerido.plantilla].nombre}`}
              />
            ))}
          </Rejilla>
        </Seccion>
      ) : null}

      <Seccion
        id="plantillas"
        icono={LayoutTemplate}
        titulo="Plantillas para empezar"
        bajada="Con tus productos y tus colores."
      >
        <Rejilla>
          {plantillas.map((clave) => (
            <Tarjeta
              key={clave}
              ruta={ruta}
              eleccion={{ tipo: "plantilla", clave }}
              catalogo={armarCatalogo({
                plantilla: clave,
                nombre: NOMBRE_DE_MUESTRA,
                productos: muestra,
                tienda,
                estilo: estiloDeTienda,
              })}
              datos={datos}
              nombre={PLANTILLAS_DE_CATALOGO[clave].nombre}
              detalle={PLANTILLAS_DE_CATALOGO[clave].ideal}
            />
          ))}
        </Rejilla>
      </Seccion>
    </>
  )
}

function Rejilla({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid grid-cols-2 gap-px bg-tinta/15 sm:grid-cols-3 xl:grid-cols-4">
      {children}
    </ul>
  )
}

function Tarjeta({
  ruta,
  eleccion,
  catalogo,
  datos,
  nombre,
  detalle,
}: {
  ruta: string
  eleccion: EleccionDePlantilla
  catalogo: Catalogo
  datos: DatosDelCatalogo
  nombre: string
  detalle: string
}) {
  return (
    <li className="bg-papel">
      <Link
        href={`${ruta}?${consultaDeEleccion(eleccion)}`}
        data-eleccion={JSON.stringify(eleccion)}
        className="group flex h-full flex-col gap-3 p-4 transition-colors hover:bg-tinta/[0.04] active:bg-tinta/[0.08]"
      >
        <span className="block transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none">
          <MiniaturaDeCatalogo catalogo={catalogo} datos={datos} ancho={112} />
        </span>
        <span>
          <span className="block font-titular leading-tight font-bold tracking-[-0.01em]">
            {nombre}
          </span>
          <span className="mt-1 block text-xs leading-relaxed opacity-70">
            {detalle}
          </span>
        </span>
      </Link>
    </li>
  )
}
