import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowUpRight,
  Paintbrush,
  Store,
  TreePalm,
  UserRound,
  UserRoundX,
} from "lucide-react"

import { estaConectado, isCanvaConfigured } from "@/lib/canva"
import { getCuenta } from "@/lib/data/cuenta"
import { isSupabaseConfigured } from "@/lib/env"
import { getMiTienda } from "@/lib/data/panel"
import { deVacaciones } from "@/lib/vacaciones"
import { DarDeBaja } from "@/components/cuenta/baja"
import { ConexionCanva } from "@/components/cuenta/canva"
import { FormPersona, FormTienda } from "@/components/cuenta/formularios"
import { Foto } from "@/components/cuenta/foto"
import { Vacaciones } from "@/components/cuenta/vacaciones"
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"
import { guardarVacaciones } from "./acciones"

export const metadata = { title: "Tus datos" }

/** El enlace que va a la derecha del título de un panel. */
function Ver({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-4" />
    </Link>
  )
}

/**
 * Ajustes de la cuenta: la persona y su tienda, cada una en su panel, y cada
 * panel se guarda por su lado.
 */
export default async function CuentaPage() {
  // `getMiTienda` está en memoria por pedido: llamarla dos veces es un viaje.
  const [cuenta, tienda, conCanva] = await Promise.all([
    getCuenta(),
    getMiTienda(),
    getMiTienda().then((tienda) => (tienda ? estaConectado(tienda.id) : false)),
  ])

  // Sin sesión no hay cuenta que editar; el modo demo tampoco tiene una.
  if (!cuenta) {
    if (isSupabaseConfigured) redirect("/login")

    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <Cabecera titulo="Tus datos." />
        <Seccion
          id="persona"
          icono={UserRound}
          titulo="Quién eres en Venduo"
          bajada="Los tuyos y los de tu tienda."
        >
          <SinDatos
            icono={UserRound}
            titulo="En modo demo no hay una cuenta que editar"
            texto="Configura Supabase en .env.local y vuelve a entrar: aquí vas a cambiar tu nombre, tu foto, los datos de tu tienda y su WhatsApp."
          />
        </Seccion>
      </div>
    )
  }

  const nombre = cuenta.perfil.fullName ?? "tu cuenta"

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tus datos."
        bajada="Los tuyos y los de tu tienda. Cada panel se guarda por separado."
      />

      <Seccion
        id="persona"
        icono={UserRound}
        titulo="Quién eres en Venduo"
        bajada="Tu foto y tu nombre se ven en tu panel."
        relleno
      >
        <div className="grid items-start gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12">
          <Foto
            userId={cuenta.userId}
            urlActual={cuenta.perfil.avatarUrl}
            nombre={nombre}
          />
          <FormPersona cuenta={cuenta} />
        </div>
      </Seccion>

      {cuenta.tienda ? (
        <Seccion
          id="tienda"
          icono={Store}
          titulo={cuenta.tienda.name}
          bajada="Cómo te ven quienes te compran y a qué WhatsApp te llegan los pedidos."
          extra={<Ver href={`/t/${cuenta.tienda.slug}`}>Ver mi tienda</Ver>}
          relleno
        >
          <FormTienda cuenta={cuenta} />
        </Seccion>
      ) : null}

      {/* Con la tienda pausada por Venduo, manda esa pausa: las vacaciones no
          cambiarían nada. */}
      {tienda && !tienda.suspended_at ? (
        <Seccion
          id="vacaciones"
          icono={TreePalm}
          titulo="Vacaciones"
          bajada="Tu tienda se sigue viendo, sin recibir pedidos."
        >
          <Vacaciones
            activa={deVacaciones({
              desde: tienda.vacaciones_desde,
              hasta: tienda.vacaciones_hasta,
            })}
            hasta={tienda.vacaciones_hasta}
            guardar={guardarVacaciones}
          />
        </Seccion>
      ) : null}

      {cuenta.tienda && isCanvaConfigured ? (
        <Seccion
          id="canva"
          icono={Paintbrush}
          titulo="Tu cuenta de Canva"
          bajada="Para abrir tus catálogos en Canva sin aprobar el acceso cada vez."
          relleno
        >
          <ConexionCanva conectado={conCanva} />
        </Seccion>
      ) : null}

      <Seccion
        id="baja"
        icono={UserRoundX}
        titulo="Dar de baja tu cuenta"
        bajada="Para irte de Venduo. Lo que pasa ahora y lo que pasa a los 90 días."
        relleno
      >
        <DarDeBaja conTienda={Boolean(cuenta.tienda)} />
      </Seccion>
    </div>
  )
}
