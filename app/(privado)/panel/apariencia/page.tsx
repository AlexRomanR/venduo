import { redirect } from "next/navigation"
import { History, LayoutTemplate } from "lucide-react"

import {
  getAparienciaDeMiTienda,
  type PlantillaElegible,
} from "@/lib/data/apariencia"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { isSupabaseConfigured } from "@/lib/env"
import { formatDate } from "@/lib/format"
import {
  ListaDeVersiones,
  PasarelaDeApariencia,
  type PlantillaDeLaPasarela,
} from "@/components/panel/cambiar-plantilla"
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"
import { RestaurarVersion } from "@/components/panel/restaurar-version"
import { Miniatura } from "@/components/plantillas/miniatura"
import type { DesignOrigin } from "@/types"
import { cambiarPlantilla, restaurarVersion } from "./acciones"

export const metadata = { title: "Apariencia" }

function plantillaDeLaPasarela(
  plantilla: PlantillaElegible
): PlantillaDeLaPasarela {
  return {
    clave: plantilla.clave,
    nombre: plantilla.nombre,
    rubro: plantilla.rubro,
    descripcion: plantilla.descripcion,
    rasgos: plantilla.rasgos,
    recomendada: plantilla.recomendada,
    nueva: plantilla.nueva,
  }
}

const ORIGENES: Record<DesignOrigin, string> = {
  alta: "Al crear la tienda",
  inicial: "Diseño que tenía la tienda",
  antes_de_cambiar_plantilla: "Antes de cambiar de plantilla",
  antes_de_publicar: "Antes de publicar cambios",
  antes_de_restaurar: "Antes de restaurar una versión",
}

/**
 * La apariencia de la tienda, de un vistazo: la plantilla que usa con la
 * puerta al editor, a cuál puede pasarse —una rejilla para comparar, y el
 * detalle de cada una en una hoja al tocarla— y el historial para volver
 * atrás. Antes cada plantilla iba desplegada y la pantalla medía 5.700 px en
 * el celular.
 *
 * El editor vive aparte, en `/editor`, a pantalla completa: acá se entra.
 */
export default async function AparienciaPage() {
  const [datos, funciones] = await Promise.all([
    getAparienciaDeMiTienda(),
    funcionesDeMiTienda(),
  ])
  if (!datos) {
    if (isSupabaseConfigured) redirect("/crear")
    return null
  }

  const {
    tienda,
    actual,
    disponibles,
    versiones,
    muestra,
    muestraDeEjemplo,
    aparienciaActual,
    esDemo,
  } = datos

  // Si Venduo ocultó el cambio de plantilla, la pasarela muestra solo la tuya.
  const otras = funciones.cambiar_plantilla === "oculta" ? [] : disponibles

  // Lo que se aclara debajo del dibujo de las otras.
  const notas = [
    ...(muestraDeEjemplo
      ? ["Con productos de ejemplo hasta que subas los tuyos."]
      : []),
    ...(actual.personalizada
      ? [
          "Con los colores de {plantilla}. Los tuyos quedan guardados en el historial.",
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Cómo se ve tu tienda."
        resaltar="tu tienda"
        bajada="La plantilla decide la letra, los colores y cómo se ven tus productos."
        demo={esDemo && "Estás en modo demo: los cambios no se guardan."}
      />

      <Seccion
        id="plantilla"
        icono={LayoutTemplate}
        titulo="Tu plantilla"
        bajada="Pasa con las flechas para ver tu tienda con otra. Tus productos, categorías y pedidos no se tocan."
        relleno
      >
        <PasarelaDeApariencia
          actual={{
            ...plantillaDeLaPasarela(actual),
            nombre: actual.retirada ? "Plantilla anterior" : actual.nombre,
            descripcion: actual.retirada
              ? "Ya no se ofrece, pero tu tienda se ve igual. Puedes pasarte a otra cuando quieras."
              : actual.descripcion,
          }}
          otras={otras.map(plantillaDeLaPasarela)}
          // La tuya con tus colores; las otras con los de su base, porque al
          // cambiar la personalización no viaja a la plantilla nueva.
          miniaturas={[
            <Miniatura
              key={actual.clave}
              clave={actual.clave}
              apariencia={actual.retirada ? null : aparienciaActual}
              datos={actual.retirada ? null : muestra}
            />,
            ...otras.map((plantilla) => (
              <Miniatura
                key={plantilla.clave}
                clave={plantilla.clave}
                datos={muestra}
              />
            )),
          ]}
          notas={notas}
          urlDeTienda={tienda.url}
          editor={funciones.editor}
          cambio={funciones.cambiar_plantilla}
          cambiar={cambiarPlantilla}
        />
      </Seccion>

      <Seccion
        id="historial"
        icono={History}
        titulo="Historial de diseño"
        bajada="Antes de cada cambio guardamos cómo estaba. Puedes volver a cualquiera."
      >
        {versiones.length === 0 ? (
          <SinDatos
            icono={History}
            titulo="Todavía no hay versiones"
            texto="La primera se guarda sola cuando publiques un cambio o cambies de plantilla."
          />
        ) : (
          <ListaDeVersiones
            filas={versiones.map((version) => (
              <li
                key={version.id}
                className="flex items-center gap-4 border-t border-tinta/12 px-4 py-3 first:border-t-0 sm:px-5"
              >
                <span className="tabular w-7 shrink-0 font-titular text-lg font-bold">
                  {String(version.numero).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {ORIGENES[version.origen]}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-tinta/70">
                    {version.nota ?? version.plantilla} ·{" "}
                    {formatDate(version.fecha)}
                  </span>
                </span>
                <RestaurarVersion
                  version={version.id}
                  numero={version.numero}
                  descripcion={`${ORIGENES[version.origen]} · ${formatDate(version.fecha)}`}
                  restaurar={restaurarVersion}
                  className="shrink-0"
                />
              </li>
            ))}
          />
        )}
      </Seccion>
    </div>
  )
}
