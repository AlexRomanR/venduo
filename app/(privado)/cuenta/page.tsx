import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import { getCuenta } from "@/lib/data/cuenta"
import { isSupabaseConfigured } from "@/lib/env"
import {
  FormPersona,
  FormTienda,
  FormVendedor,
} from "@/components/cuenta/formularios"
import { FormCobro } from "@/components/cuenta/cobro"
import { Foto } from "@/components/cuenta/foto"
import { Encabezado } from "@/components/panel/piezas"

export const metadata = { title: "Mi cuenta" }

/**
 * Ajustes de la cuenta.
 *
 * Una sola pantalla para las tres identidades que puede tener una persona: la
 * suya, la de su tienda y la de vendedora. Se muestran las que existen, porque
 * quien tiene tienda y además vende para otras necesita editar las dos sin
 * cambiar de lugar.
 */
export default async function CuentaPage() {
  const cuenta = await getCuenta()

  // Sin sesión no hay cuenta que editar; el modo demo tampoco tiene una.
  if (!cuenta) {
    if (isSupabaseConfigured) redirect("/login")

    return (
      <div className="max-w-[52ch]">
        <h1 className="font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-none font-extrabold tracking-[-0.03em]">
          Mi cuenta
        </h1>
        <p className="mt-4 leading-relaxed opacity-70">
          En modo demo no hay una cuenta real que editar. Configura Supabase en{" "}
          <code className="font-mono">.env.local</code> y vuelve a entrar.
        </p>
      </div>
    )
  }

  const nombre = cuenta.perfil.fullName ?? "tu cuenta"

  return (
    <div className="flex flex-col gap-14">
      <div>
        <h1 className="font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-none font-extrabold tracking-[-0.03em]">
          Mi cuenta
        </h1>
        <p className="mt-3 max-w-[54ch] text-sm leading-relaxed opacity-70">
          Tus datos, y los de las identidades que uses en Venduo. Los cambios se
          guardan por separado en cada bloque.
        </p>
      </div>

      <section className="grid gap-10 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
        <div>
          <Encabezado etiqueta="Tú" titulo="Quién eres en Venduo" />
          <p className="mt-3 max-w-[44ch] text-sm leading-relaxed opacity-70">
            Tu foto se ve en tu perfil de promotor y en el panel. Tu nombre es
            con el que te saluda la plataforma.
          </p>
          <div className="mt-8">
            <Foto
              userId={cuenta.userId}
              urlActual={cuenta.perfil.avatarUrl}
              nombre={nombre}
            />
          </div>
        </div>

        <div className="border-t-2 border-tinta pt-8 lg:border-t-0 lg:border-l lg:border-tinta/15 lg:pt-0 lg:pl-12">
          <FormPersona cuenta={cuenta} />
        </div>
      </section>

      {cuenta.tienda ? (
        <section className="grid gap-10 border-t border-tinta/15 pt-12 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
          <div>
            <Encabezado etiqueta="Tu tienda" titulo={cuenta.tienda.name} />
            <p className="mt-3 max-w-[44ch] text-sm leading-relaxed opacity-70">
              Cómo te ven tus compradores y bajo qué condiciones trabajan tus
              vendedores.
            </p>
            <Link
              href={`/t/${cuenta.tienda.slug}`}
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
            >
              Ver mi tienda
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="border-t-2 border-tinta pt-8 lg:border-t-0 lg:border-l lg:border-tinta/15 lg:pt-0 lg:pl-12">
            <FormTienda cuenta={cuenta} />
          </div>
        </section>
      ) : null}

      {cuenta.tienda ? (
        <section className="grid gap-10 border-t border-tinta/15 pt-12 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
          <div>
            <Encabezado
              etiqueta="Cómo te pagan"
              titulo="El cobro de tus pedidos"
            />
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed opacity-70">
              Venduo no cobra por ti: quien compra transfiere a tu QR y sube su
              comprobante, y tú confirmas. Si no cargas el QR, esa pantalla
              queda con un hueco y el comprador tiene que preguntarte por
              WhatsApp.
            </p>
          </div>

          <div className="border-t-2 border-tinta pt-8 lg:border-t-0 lg:border-l lg:border-tinta/15 lg:pt-0 lg:pl-12">
            <FormCobro cuenta={cuenta} />
          </div>
        </section>
      ) : null}

      {cuenta.vendedor ? (
        <section className="grid gap-10 border-t border-tinta/15 pt-12 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
          <div>
            <Encabezado
              etiqueta="Tu perfil de promotor"
              titulo="Tu historial laboral"
            />
            <p className="mt-3 max-w-[44ch] text-sm leading-relaxed opacity-70">
              Esto es lo que ve quien recibe tu currículum. Las ventas se suman
              solas; acá editas cómo te presentas.
            </p>
            <Link
              href={`/v/${cuenta.vendedor.slug}`}
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
            >
              Ver mi perfil público
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="border-t-2 border-tinta pt-8 lg:border-t-0 lg:border-l lg:border-tinta/15 lg:pt-0 lg:pl-12">
            <FormVendedor cuenta={cuenta} />
          </div>
        </section>
      ) : null}
    </div>
  )
}
