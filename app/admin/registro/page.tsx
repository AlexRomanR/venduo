import { DoorOpen, Ticket } from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { registroDeAdmin } from "@/lib/data/admin"
import { Cabecera, Seccion } from "@/components/panel/piezas"
import { EstadoDelRegistro, Invitaciones } from "@/components/admin/registro"

export const metadata = { title: "Registro" }

export default async function RegistroPage() {
  const { db } = await exigirAdmin()
  const { invitaciones, ajustes } = await registroDeAdmin(db)
  const ahora = new Date().getTime()

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Registro."
        bajada="Quién puede crear una cuenta nueva. Lo impone la base al registrarse: no alcanza con esconder el formulario."
      />

      <Seccion
        id="estado"
        icono={DoorOpen}
        titulo="La puerta"
        bajada="Cambia al instante, sin desplegar nada."
      >
        <EstadoDelRegistro estado={ajustes.registro} />
      </Seccion>

      <Seccion
        id="invitaciones"
        icono={Ticket}
        titulo="Invitaciones"
        bajada="Un código por persona: se usa una sola vez. Se pide solo con el registro con invitación."
      >
        <Invitaciones invitaciones={invitaciones} ahora={ahora} />
      </Seccion>
    </div>
  )
}
