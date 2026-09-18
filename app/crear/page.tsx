import { redirect } from "next/navigation"

import { getMiTienda, getPerfil } from "@/lib/data/panel"
import { FormularioNegocio } from "@/components/onboarding/formulario-negocio"
import { Pasos, PASOS_CREAR } from "@/components/onboarding/pasos"

export const metadata = { title: "Crea tu negocio" }

/**
 * El alta del negocio, en una sola pantalla.
 *
 * Antes eran dos pasos y el primero era elegir una plantilla para su tienda.
 * El canal pasó a ser un solo Marketplace, así que esa decisión ya no existe:
 * lo único que hace falta para empezar es el nombre del negocio y qué vende.
 *
 * Quien ya lo completó no vuelve acá: su negocio existe y lo que corresponde
 * es el panel.
 */
export default async function CrearPage({
  searchParams,
}: {
  searchParams: Promise<{ abrir?: string }>
}) {
  const { abrir } = await searchParams
  const [tienda, perfil] = await Promise.all([getMiTienda(), getPerfil()])

  if (tienda?.template_key) redirect("/panel")

  // Quien se registró como promotor no cae acá por accidente. Pero puede
  // insistir con `?abrir=1`, porque el rol es una intención y no un permiso:
  // una misma persona puede terminar produciendo y promocionando.
  if (perfil?.primary_role === "vendedor" && abrir !== "1" && !tienda) {
    redirect("/vendedor")
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-16">
        <div>
          <h1 className="max-w-[15ch] font-titular text-[clamp(2.25rem,7vw,3.5rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
            Cuéntanos qué vendes.
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed opacity-70">
            Con esto alcanza para empezar. Después cargas tus productos diciendo
            cuánto quieres recibir por cada uno, y nosotros nos encargamos de
            que alguien los venda.
          </p>
        </div>

        <Pasos pasos={PASOS_CREAR} actual={1} />
      </div>

      <div className="mt-14 grid gap-12 border-t border-tinta/15 pt-12 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
        <FormularioNegocio />

        <aside className="lg:pt-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Lo que sigue
          </p>
          <ul className="mt-5 border-t-2 border-tinta">
            {[
              {
                titulo: "Cargas tus productos",
                detalle:
                  "Foto, stock y cuánto quieres recibir. El precio lo calculamos nosotros.",
              },
              {
                titulo: "Los promotores los toman",
                detalle:
                  "Eligen qué promocionar en sus redes. Tú no pagas nada por adelantado.",
              },
              {
                titulo: "Te avisamos de cada venta",
                detalle:
                  "Coordinas la entrega por WhatsApp y cobras cuando el pedido llega.",
              },
            ].map((paso) => (
              <li
                key={paso.titulo}
                className="border-b border-tinta/15 py-4 text-sm"
              >
                <p className="font-titular font-bold tracking-[-0.01em]">
                  {paso.titulo}
                </p>
                <p className="mt-1 leading-relaxed opacity-70">
                  {paso.detalle}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
