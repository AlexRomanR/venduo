"use client"

import * as React from "react"
import {
  ExternalLink,
  Loader2,
  MessageCircle,
  Send,
  Undo2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import {
  problemasDeContraste,
  combinarApariencia,
} from "@/lib/plantillas/apariencia"
import { cambiosEntre, problemasParaPublicar } from "@/lib/plantillas/borrador"
import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"
import {
  Aviso,
  EncabezadoDePaso,
  Grupo,
  Opciones,
} from "@/components/editor/piezas"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Paso 6: revisar lo que cambió y publicarlo.
 *
 * Lo que cambió se cuenta en palabras y se puede mirar antes y después en la
 * vista previa. Si algo impide publicar —un color que no se lee—, se dice qué
 * y dónde se arregla, en vez de apagar el botón sin explicación.
 */
export function PasoPublicar() {
  const {
    borrador,
    base,
    contexto,
    tienda,
    esDemo,
    comparar,
    setComparar,
    irAPaso,
    acciones,
  } = useEditor()
  const [publicando, setPublicando] = React.useState(false)
  const [recien, setRecien] = React.useState(false)
  const [problemasDelServidor, setProblemasDelServidor] = React.useState<
    string[]
  >([])

  // Al salir de este paso, la vista previa vuelve a mostrar el borrador.
  React.useEffect(() => () => setComparar("despues"), [setComparar])

  const cambios = cambiosEntre(borrador.publicado, borrador.presente, base)
  const { problemas } = problemasParaPublicar(borrador.presente, contexto)

  async function publicar() {
    setPublicando(true)
    setProblemasDelServidor([])
    const resultado = await acciones.publicar(borrador.presente)
    setPublicando(false)

    if (!resultado.ok) {
      toast.error(resultado.error)
      setProblemasDelServidor(resultado.problemas ?? [])
      return
    }

    borrador.marcarPublicado(resultado.publicado)
    setComparar("despues")
    setRecien(true)
  }

  if (recien) {
    return <Publicado alSeguir={() => irAPaso("marca")} />
  }

  if (cambios.length === 0) {
    return (
      <>
        <EncabezadoDePaso
          numero={6}
          titulo="Todo al día"
          bajada="Tu tienda ya se ve así para tus clientes. Cuando cambies algo, lo vas a ver acá para publicarlo."
        />
        <div className="px-5 pb-6">
          <button
            type="button"
            onClick={() => irAPaso("marca")}
            className={cn(BOTON_SECUNDARIO, "w-full")}
          >
            Empezar a editar
          </button>
          <a
            href={tienda.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
          >
            Ver mi tienda
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>
      </>
    )
  }

  const todos = [...new Set([...problemas, ...problemasDelServidor])]
  // Lo que no se lee se arregla en la marca; lo demás, en la portada.
  const deColor = problemasDeContraste(
    combinarApariencia(base, borrador.presente.personalizacion).colores
  ).map((problema) => problema.mensaje)
  const dondeSeArregla = todos.some((problema) => deColor.includes(problema))
    ? { paso: "marca" as const, nombre: "Tu marca" }
    : { paso: "portada" as const, nombre: "Portada" }

  return (
    <>
      <EncabezadoDePaso
        numero={6}
        titulo="Revisa y publica"
        bajada="Esto es lo que va a cambiar en tu tienda. Antes de publicar guardamos cómo estaba, por si quieres volver."
      />

      <Grupo titulo="Compara">
        <Opciones
          etiqueta="Qué muestra la vista previa"
          valor={comparar}
          opciones={[
            { valor: "antes" as const, etiqueta: "Antes" },
            { valor: "despues" as const, etiqueta: "Después" },
          ]}
          alCambiar={setComparar}
        />
      </Grupo>

      <Grupo
        titulo={`${cambios.length} ${cambios.length === 1 ? "cambio" : "cambios"}`}
      >
        <ul className="border-t border-tinta/15">
          {cambios.map((cambio) => (
            <li
              key={cambio.texto}
              className="flex items-center gap-3 border-b border-tinta/15 py-2.5 text-sm"
            >
              {cambio.color ? (
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 border border-tinta/25"
                  style={{ background: cambio.color }}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-tinta/50"
                />
              )}
              <span className="min-w-0 flex-1">{cambio.texto}</span>
            </li>
          ))}
        </ul>
      </Grupo>

      {todos.length > 0 ? (
        <div className="px-5 pb-2">
          <Aviso tono="problema">
            <p className="font-semibold">Antes de publicar, arregla esto:</p>
            <ul className="mt-1 opacity-80">
              {todos.map((problema) => (
                <li key={problema}>{problema}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => irAPaso(dondeSeArregla.paso)}
              className="mt-1 min-h-11 font-semibold text-senal underline underline-offset-4"
            >
              Ir a {dondeSeArregla.nombre}
            </button>
          </Aviso>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 p-5">
        {esDemo ? (
          <Aviso>Estás en modo demo: los cambios no se publican.</Aviso>
        ) : null}
        <button
          type="button"
          onClick={publicar}
          disabled={publicando || todos.length > 0 || esDemo}
          className={cn(BOTON_PRIMARIO, "w-full")}
        >
          {publicando ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="size-4" />
          )}
          {publicando ? "Publicando…" : "Publicar cambios"}
        </button>
        <DescartarCambios />
      </div>
    </>
  )
}

function DescartarCambios() {
  const { borrador } = useEditor()
  const [abierto, setAbierto] = React.useState(false)

  function descartar() {
    borrador.poner(borrador.publicado)
    setAbierto(false)
    toast("Volviste a lo que está publicado.", {
      action: { label: "Deshacer", onClick: () => borrador.deshacer() },
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
        >
          <Undo2 aria-hidden="true" className="size-4" />
          Descartar los cambios
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="gap-0 rounded-none border-2 border-tinta bg-papel p-0 text-tinta shadow-none sm:max-w-md"
      >
        <div className="flex items-start gap-4 border-b border-tinta/15 p-5">
          <DialogTitle className="flex-1 font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
            ¿Descartar lo que cambiaste?
          </DialogTitle>
          <DialogClose
            aria-label="Cerrar"
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal"
          >
            <X aria-hidden="true" className="size-5" />
          </DialogClose>
        </div>
        <DialogDescription className="p-5 text-sm leading-relaxed text-tinta/70">
          El editor vuelve a lo que ven hoy tus clientes. Si te arrepientes, lo
          recuperas con Deshacer.
        </DialogDescription>
        <div className="flex flex-col-reverse gap-3 border-t border-tinta/15 p-5 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <button type="button" className={BOTON_SECUNDARIO}>
              Seguir editando
            </button>
          </DialogClose>
          <button type="button" onClick={descartar} className={BOTON_PRIMARIO}>
            Descartar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * El momento de publicar. Un sello, y a la mano lo que se hace después: ver la
 * tienda y mandarla por WhatsApp, que es por donde van a llegar los clientes.
 */
function Publicado({ alSeguir }: { alSeguir: () => void }) {
  const { tienda } = useEditor()
  const mensaje = `Mira cómo quedó mi tienda: ${tienda.url}`

  return (
    <div className="px-5 py-8">
      <p
        className="inline-block -rotate-3 border-[3px] border-senal px-3 py-1 font-titular text-2xl font-extrabold tracking-[0.04em] text-senal uppercase motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:zoom-in-150"
        style={{ animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        Publicado
      </p>
      <h2 className="mt-6 font-titular text-[1.75rem] leading-none font-extrabold tracking-[-0.03em]">
        Tu tienda ya se ve así.
      </h2>
      <p className="mt-3 max-w-[40ch] text-sm leading-relaxed opacity-70">
        Cada cliente que abra tu enlace ve los cambios desde ahora. Lo que
        tenías antes quedó guardado en el historial de Apariencia.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        <a
          href={tienda.url}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(BOTON_PRIMARIO, "w-full")}
        >
          Ver mi tienda
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(BOTON_SECUNDARIO, "w-full")}
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          Compartir por WhatsApp
        </a>
        <button
          type="button"
          onClick={alSeguir}
          className="flex min-h-11 items-center justify-center text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
        >
          Seguir editando
        </button>
      </div>
    </div>
  )
}
