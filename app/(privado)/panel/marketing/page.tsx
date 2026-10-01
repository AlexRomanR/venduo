import { Megaphone } from "lucide-react"

import { SeccionPendiente } from "@/components/panel/seccion-pendiente"

export const metadata = { title: "Marketing" }

export default function MarketingPage() {
  return (
    <SeccionPendiente
      titulo="Marketing."
      detalle="Textos para tus redes, hechos con tu catálogo."
      loQueVa="Aquí la IA va a escribir publicaciones para Facebook y WhatsApp usando tus productos y tu forma de hablar. Tú revisas y publicas: nada sale sin que lo apruebes."
      icono={Megaphone}
    />
  )
}
