import Link from "next/link"
import { Bot, Settings2, SlidersHorizontal, Store } from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { funcionesDeAdmin } from "@/lib/data/admin"
import { FUNCIONES, NOMBRES_DE_ESTADO } from "@/lib/funciones"
import {
  Cabecera,
  Insignia,
  Seccion,
  SinDatos,
} from "@/components/panel/piezas"
import { AjustesDeIa, FuncionGeneral } from "@/components/admin/funciones"

export const metadata = { title: "Funciones" }

export default async function FuncionesPage() {
  const { db } = await exigirAdmin()
  const { funciones, excepciones, ajustes } = await funcionesDeAdmin(db)
  const grupos = [...new Set(FUNCIONES.map((f) => f.grupo))]

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Funciones."
        bajada="Qué puede usar cada tienda. Lo de acá vale para todas; desde la ficha de una tienda se cambia solo para ella. Ninguna tienda recibe aviso cuando le apagas algo."
      />

      <Seccion
        id="ia"
        icono={Bot}
        titulo="La IA, de un golpe"
        bajada="Por encima de lo que diga cada función de IA."
        relleno
      >
        <AjustesDeIa apagada={ajustes.iaApagada} tope={ajustes.iaTopeDiario} />
      </Seccion>

      {grupos.map((grupo) => (
        <Seccion
          key={grupo}
          id={`grupo-${grupo.toLowerCase()}`}
          icono={SlidersHorizontal}
          titulo={grupo}
          bajada="Activa, desactivada (se ve pero no responde) u oculta."
        >
          <ul>
            {funciones
              .filter((f) => f.grupo === grupo)
              .map((f) => (
                <FuncionGeneral
                  key={f.clave}
                  clave={f.clave}
                  nombre={f.nombre}
                  descripcion={f.descripcion}
                  estado={f.estado}
                />
              ))}
          </ul>
        </Seccion>
      ))}

      <Seccion
        id="excepciones"
        icono={Store}
        titulo="Tiendas con su propio estado"
        bajada="Las que no siguen lo general en alguna función."
      >
        {excepciones.length === 0 ? (
          <SinDatos
            icono={Settings2}
            titulo="Todas siguen lo general"
            texto="Desde la ficha de una tienda puedes activarle, desactivarle u ocultarle una función solo a ella."
          />
        ) : (
          <ul>
            {excepciones.map((e) => (
              <li
                key={`${e.tienda}-${e.clave}`}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5"
              >
                <Link
                  href={`/admin/tiendas/${e.tienda}`}
                  className="flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
                >
                  {e.nombre}
                </Link>
                <span className="flex items-center gap-2 text-sm">
                  {FUNCIONES.find((f) => f.clave === e.clave)?.nombre}
                  <Insignia tono={e.estado === "activa" ? "tinta" : "senal"}>
                    {NOMBRES_DE_ESTADO[e.estado]}
                  </Insignia>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  )
}
