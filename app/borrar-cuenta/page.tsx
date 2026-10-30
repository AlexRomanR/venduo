import Link from "next/link"
import { CircleCheck } from "lucide-react"

import { DIAS_HASTA_EL_BORRADO } from "@/lib/cuenta"
import { Apartado, Correo, PaginaLegal } from "@/components/legal/pagina"

export const metadata = {
  title: "Borrar tu cuenta · Venduo",
  description:
    "Cómo dar de baja tu cuenta de Venduo y qué pasa con tu tienda y tus datos.",
}

/**
 * Cómo dar de baja la cuenta. Google Play pide una página así, que se pueda
 * abrir sin la app y sin sesión. Después de la baja, `/cuenta` trae acá con
 * `?hecho=1`, que muestra la confirmación arriba.
 */
export default async function BorrarCuenta({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { hecho } = await searchParams

  return (
    <PaginaLegal
      titulo="Borrar tu cuenta"
      bajada="Cómo dar de baja tu cuenta de Venduo, y qué pasa con tu tienda y tus datos."
    >
      {hecho === "1" ? (
        <div
          role="status"
          className="flex items-start gap-3 border-2 border-tinta p-5"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="leading-relaxed">
            <strong className="font-semibold">
              Tu cuenta quedó dada de baja.
            </strong>{" "}
            Tu tienda ya no se ve y cerramos tu sesión. Gracias por haber
            vendido con Venduo.
          </p>
        </div>
      ) : null}

      <Apartado numero={1} titulo="Cómo hacerlo">
        <ul>
          <li>
            <strong>En la app:</strong> el menú → Tus datos → «Dar de baja mi
            cuenta».
          </li>
          <li>
            <strong>En la web:</strong> entra a{" "}
            <Link href="/cuenta">Tus datos</Link> y, al final, «Dar de baja mi
            cuenta».
          </li>
          <li>
            <strong>Si ya no puedes entrar:</strong> escríbenos a <Correo />{" "}
            desde el correo de tu cuenta, con el asunto «Borrar mi cuenta». La
            damos de baja en un plazo máximo de 15 días.
          </li>
        </ul>
      </Apartado>

      <Apartado numero={2} titulo="Qué pasa en el acto">
        <ul>
          <li>Tu tienda deja de verse y de recibir pedidos.</li>
          <li>Tu sesión se cierra y ya no puedes volver a entrar.</li>
          <li>Tu teléfono deja de recibir los avisos de Venduo.</li>
        </ul>
        <p>La baja no se puede deshacer.</p>
      </Apartado>

      <Apartado
        numero={3}
        titulo={`Qué pasa a los ${DIAS_HASTA_EL_BORRADO} días`}
      >
        <p>
          Borramos tu tienda, sus productos, sus categorías, sus catálogos y su
          diseño, y vaciamos tu nombre, tu foto y el WhatsApp de tu tienda. Lo
          borrado queda marcado como tal: nadie lo ve ni se usa para nada.
        </p>
        <p>
          Los pedidos que recibiste no llevan datos de quien compró, y se quedan
          con tu tienda borrada.
        </p>
      </Apartado>

      <Apartado numero={4} titulo="Si solo quieres dejar de vender un tiempo">
        <p>
          No hace falta borrar nada: despublica tu tienda desde{" "}
          <Link href="/cuenta">Tus datos</Link> y vuelve a publicarla cuando
          quieras, con todo como lo dejaste.
        </p>
      </Apartado>
    </PaginaLegal>
  )
}
