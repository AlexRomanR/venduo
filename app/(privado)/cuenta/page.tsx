import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowUpRight,
  IdCard,
  Paintbrush,
  QrCode,
  Store,
  UserRound,
} from "lucide-react"

import { estaConectado, isCanvaConfigured } from "@/lib/canva"
import { getCuenta } from "@/lib/data/cuenta"
import { isSupabaseConfigured } from "@/lib/env"
import { getMiTienda } from "@/lib/data/panel"
import { ConexionCanva } from "@/components/cuenta/canva"
import {
  FormPersona,
  FormTienda,
  FormVendedor,
} from "@/components/cuenta/formularios"
import { FormCobro } from "@/components/cuenta/cobro"
import { Foto } from "@/components/cuenta/foto"
import { Cabecera, Seccion, SinDatos } from "@/components/panel/piezas"

export const metadata = { title: "Mi cuenta" }

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
 * Ajustes de la cuenta.
 *
 * Una sola pantalla para las tres identidades que puede tener una persona: la
 * suya, la de su tienda y la de vendedora. Se muestran las que existen, porque
 * quien tiene tienda y además vende para otras necesita editar las dos sin
 * cambiar de lugar. Cada una en su panel, y cada panel se guarda por su lado.
 */
export default async function CuentaPage() {
  const [cuenta, conCanva] = await Promise.all([
    getCuenta(),
    getMiTienda().then((tienda) => (tienda ? estaConectado(tienda.id) : false)),
  ])

  // Sin sesión no hay cuenta que editar; el modo demo tampoco tiene una.
  if (!cuenta) {
    if (isSupabaseConfigured) redirect("/login")

    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <Cabecera titulo="Mi cuenta" />
        <Seccion
          id="persona"
          icono={UserRound}
          titulo="Quién eres en Venduo"
          bajada="Tus datos, los de tu tienda y tu perfil de vendedor."
        >
          <SinDatos
            icono={UserRound}
            titulo="En modo demo no hay una cuenta que editar"
            texto="Configura Supabase en .env.local y vuelve a entrar: acá vas a cambiar tu nombre, tu foto, los datos de tu tienda y cómo te pagan."
          />
        </Seccion>
      </div>
    )
  }

  const nombre = cuenta.perfil.fullName ?? "tu cuenta"

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Mi cuenta"
        bajada="Tus datos y los de las identidades que uses en Venduo. Cada panel se guarda por separado."
      />

      <Seccion
        id="persona"
        icono={UserRound}
        titulo="Quién eres en Venduo"
        bajada="Tu foto se ve en tu perfil de vendedor y en el panel; con tu nombre te saluda la plataforma."
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
          bajada="Cómo te ven tus compradores y bajo qué condiciones trabajan tus vendedores."
          extra={<Ver href={`/t/${cuenta.tienda.slug}`}>Ver mi tienda</Ver>}
          relleno
        >
          <FormTienda cuenta={cuenta} />
        </Seccion>
      ) : null}

      {cuenta.tienda ? (
        <Seccion
          id="cobro"
          icono={QrCode}
          titulo="Cómo te pagan"
          bajada="Quien compra transfiere a tu QR y sube su comprobante. Sin el QR, tiene que preguntarte por WhatsApp."
          relleno
        >
          <FormCobro cuenta={cuenta} />
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

      {cuenta.vendedor ? (
        <Seccion
          id="perfil-vendedor"
          icono={IdCard}
          titulo="Tu perfil de vendedor"
          bajada="Lo que ve quien recibe tu historial. Las ventas se suman solas; acá editas cómo te presentas."
          extra={
            <Ver href={`/v/${cuenta.vendedor.slug}`}>Ver mi perfil público</Ver>
          }
          relleno
        >
          <FormVendedor cuenta={cuenta} />
        </Seccion>
      ) : null}
    </div>
  )
}
