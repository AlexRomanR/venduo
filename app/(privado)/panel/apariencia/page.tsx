import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  ArrowUpRight,
  History,
  LayoutTemplate,
  Palette,
  Shapes,
  WandSparkles,
} from "lucide-react"

import {
  getAparienciaDeMiTienda,
  type PlantillaElegible,
} from "@/lib/data/apariencia"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_PRIMARIO } from "@/lib/estilos"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CambiarPlantilla } from "@/components/panel/cambiar-plantilla"
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"
import { RestaurarVersion } from "@/components/panel/restaurar-version"
import { Miniatura } from "@/components/plantillas/miniatura"
import type { DesignOrigin } from "@/types"
import { cambiarPlantilla, restaurarVersion } from "./acciones"

export const metadata = { title: "Apariencia" }

const ORIGENES: Record<DesignOrigin, string> = {
  alta: "Al crear la tienda",
  inicial: "Diseño que tenía la tienda",
  antes_de_cambiar_plantilla: "Antes de cambiar de plantilla",
  antes_de_publicar: "Antes de publicar cambios",
  antes_de_restaurar: "Antes de restaurar una versión",
}

/**
 * La apariencia de la tienda: la puerta al editor, la plantilla que usa y a
 * cuál puede pasarse, y el historial para volver atrás.
 *
 * El editor vive aparte, en `/editor`, a pantalla completa: acá se entra.
 */
export default async function AparienciaPage() {
  const datos = await getAparienciaDeMiTienda()
  if (!datos) {
    if (isSupabaseConfigured) redirect("/crear")
    return null
  }

  const { tienda, actual, disponibles, versiones, esDemo } = datos

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Cómo se ve tu tienda."
        bajada="La plantilla decide la letra, los colores y cómo se muestran tus productos. Cambiarla no toca tus productos, categorías ni pedidos."
        demo={esDemo && "Estás en modo demo: los cambios no se guardan."}
      />

      <Seccion
        id="editor"
        icono={Palette}
        titulo="Edita tu tienda"
        bajada="Tu logo, tus colores, tu portada y tus textos."
        relleno
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex max-w-[52ch] items-start gap-2 text-sm leading-relaxed">
            <WandSparkles
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-senal"
            />
            Con tu tienda de verdad al lado, deshacer cuando quieras y la IA
            para pedirle cambios en tus palabras.
          </p>
          <Link
            href="/editor"
            className={cn(BOTON_PRIMARIO, "shrink-0 px-6 text-sm")}
          >
            Abrir el editor
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </Seccion>

      <Seccion
        id="plantilla"
        icono={LayoutTemplate}
        titulo="Tu plantilla"
        bajada={
          actual.personalizada
            ? "La base de tu tienda, con tus cambios encima."
            : "La base de tu tienda, tal como viene."
        }
      >
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          <div className="border-b border-tinta/15 p-4 sm:p-5 lg:border-r lg:border-b-0">
            <Miniatura clave={actual.clave} className="border border-tinta" />
          </div>

          <div className="flex flex-col p-4 sm:p-5">
            <h3 className="font-titular text-[clamp(1.75rem,4vw,2.5rem)] leading-none font-extrabold tracking-[-0.03em]">
              {actual.retirada ? "Plantilla anterior" : actual.nombre}
            </h3>
            {actual.rubro ? (
              <p className="mt-2 text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                {actual.rubro}
              </p>
            ) : null}

            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed opacity-80">
              {actual.retirada
                ? "Tu tienda usa una plantilla que ya no se ofrece. Sigue funcionando igual, con el diseño editorial de Venduo, y puedes pasarte a una de las nuevas cuando quieras."
                : actual.descripcion}
            </p>

            <Rasgos plantilla={actual} />

            <a
              href={tienda.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
            >
              Ver {tienda.nombre}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>
      </Seccion>

      <Seccion
        id="otras"
        icono={Shapes}
        titulo="Cambia de plantilla"
        bajada="Cambia la cara, no el negocio: antes de cambiar guardamos cómo estaba."
      >
        {disponibles.length === 0 ? (
          <SinDatos
            icono={Shapes}
            titulo="Por ahora no hay otras plantillas"
            texto="Cuando sumemos una nueva para tu rubro, aparece acá para que la pruebes."
          />
        ) : (
          // Una plantilla por fila, con su miniatura al lado: en una grilla de
          // dos, la única que hay hoy quedaba a todo el ancho y gigante.
          <ul>
            {disponibles.map((plantilla) => (
              <li
                key={plantilla.clave}
                className="grid border-t border-tinta/15 first:border-t-0 lg:grid-cols-[1.15fr_1fr]"
              >
                <div className="border-b border-tinta/15 p-4 sm:p-5 lg:border-r lg:border-b-0">
                  <Miniatura
                    clave={plantilla.clave}
                    className="border border-tinta/25"
                  />
                </div>

                <div className="flex flex-col p-4 sm:p-5">
                  <h3 className="font-titular text-xl font-bold tracking-[-0.02em]">
                    {plantilla.nombre}
                  </h3>
                  {plantilla.rubro ? (
                    <p className="mt-1 text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                      {plantilla.rubro}
                    </p>
                  ) : null}
                  {plantilla.descripcion ? (
                    <p className="mt-3 text-sm leading-relaxed opacity-80">
                      {plantilla.descripcion}
                    </p>
                  ) : null}
                  <Rasgos plantilla={plantilla} />
                  <div className="mt-6 pt-1 lg:mt-auto">
                    <CambiarPlantilla
                      clave={plantilla.clave}
                      nombre={plantilla.nombre}
                      plantillaActual={
                        actual.retirada
                          ? "tu plantilla anterior"
                          : actual.nombre
                      }
                      cambiar={cambiarPlantilla}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <Seccion
        id="historial"
        icono={History}
        titulo="Historial de diseño"
        bajada="Antes de cada cambio guardamos cómo estaba tu tienda. Puedes volver a cualquiera, y lo de ahora también queda guardado."
      >
        {versiones.length === 0 ? (
          <SinDatos
            icono={History}
            titulo="Todavía no hay versiones"
            texto="La primera se guarda sola la próxima vez que publiques un cambio o cambies de plantilla."
          />
        ) : (
          <ol>
            {versiones.map((version) => (
              <li
                key={version.id}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center sm:px-5"
              >
                <span className="tabular font-titular text-lg font-bold">
                  {String(version.numero).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {ORIGENES[version.origen]}
                  </span>
                  <span className="mt-0.5 block text-sm opacity-70">
                    {version.nota ?? version.plantilla}
                  </span>
                </span>
                <span className="tabular col-start-2 text-xs opacity-70 sm:col-start-auto">
                  {formatDate(version.fecha)}
                </span>
                <RestaurarVersion
                  version={version.id}
                  numero={version.numero}
                  descripcion={`${ORIGENES[version.origen]} · ${formatDate(version.fecha)}`}
                  restaurar={restaurarVersion}
                  className="col-start-2 -my-1 sm:col-start-auto sm:ml-4"
                />
              </li>
            ))}
          </ol>
        )}
      </Seccion>
    </div>
  )
}

function Rasgos({ plantilla }: { plantilla: PlantillaElegible }) {
  return (
    <ul className="mt-5 border-t border-tinta/15">
      {plantilla.rasgos.map((rasgo) => (
        <li
          key={rasgo}
          className="border-b border-tinta/15 py-2.5 text-sm opacity-80"
        >
          {rasgo}
        </li>
      ))}
    </ul>
  )
}
