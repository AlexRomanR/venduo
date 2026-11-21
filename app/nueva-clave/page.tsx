import Link from "next/link"

import { BOTON_PRIMARIO } from "@/lib/estilos"
import { getUsuario } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { NuevaClave } from "@/components/auth/nueva-clave"
import { Marco } from "@/components/onboarding/marco"

export const metadata = {
  title: "Tu contraseña nueva",
  robots: { index: false, follow: false },
}

/**
 * A donde llega el enlace del correo para elegir otra contraseña. El enlace ya
 * abrió la sesión (`/auth/callback` o `/auth/confirmar`): acá solo se elige la
 * contraseña nueva.
 *
 * Sin sesión, el enlace venció, ya se usó o se abrió en otro navegador: se dice
 * y se ofrece pedir otro, sin mandar a un ingreso que no va a funcionar.
 */
export default async function NuevaClavePage() {
  const usuario = await getUsuario()

  return (
    <Marco publico>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-4 pb-12 sm:px-5 lg:grid-cols-[1fr_28rem] lg:items-center lg:gap-16 lg:py-16">
        <div>
          <h1 className="pieza-titular font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
            {usuario ? (
              <>
                Elige tu <span className="pieza-resaltado">contraseña</span>{" "}
                nueva.
              </>
            ) : (
              <>
                Este enlace ya <span className="pieza-resaltado">no sirve</span>
                .
              </>
            )}
          </h1>
          <p className="mt-3 max-w-[40ch] text-sm leading-relaxed opacity-70 sm:text-base">
            {usuario
              ? "Con ella vuelves a entrar a tu tienda desde ahora."
              : "Venció, ya lo usaste o lo abriste en otro navegador. Pide otro y ábrelo apenas te llegue."}
          </p>
        </div>

        <div className="pieza-tarjeta flex flex-col gap-6 border border-tinta px-4 py-5 sm:px-6 sm:py-6">
          {usuario ? (
            <NuevaClave correo={usuario.email} />
          ) : (
            <Link
              href="/login?modo=recuperar"
              className={cn(BOTON_PRIMARIO, "w-full")}
            >
              Pedir otro enlace
            </Link>
          )}
        </div>
      </div>
    </Marco>
  )
}
