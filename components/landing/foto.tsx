import Image from "next/image"

/**
 * Fotografía editorial de la portada, en blanco y negro.
 *
 * El color se saca al entrar: el rojo de señal es el único acento de la
 * página, y una foto a todo color le competiría.
 *
 * Las imágenes son de Unsplash, de uso libre, y son ilustrativas: el pie
 * describe la escena, nunca le pone nombre a la persona que aparece.
 */
export function Foto({
  id,
  alt,
  pie,
  ratio = "aspect-[4/5]",
  prioridad = false,
}: {
  id: string
  alt: string
  pie: string
  ratio?: string
  prioridad?: boolean
}) {
  return (
    <figure>
      <div className={`relative overflow-hidden bg-tinta/10 ${ratio}`}>
        <Image
          /*
           * Se pide el original grande y el redimensionado lo hace Next según
           * `sizes`. Pedirlo ya reducido a Unsplash comprime dos veces y se ve
           * pixelado en pantallas densas.
           */
          src={`https://images.unsplash.com/photo-${id}?w=2000&q=85&auto=format&fit=crop`}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px"
          quality={90}
          priority={prioridad}
          className="object-cover grayscale transition-[filter,transform] duration-500 ease-out hover:scale-[1.02] hover:grayscale-0"
        />
      </div>
      <figcaption className="mt-3 text-xs leading-relaxed opacity-55">
        {pie}
      </figcaption>
    </figure>
  )
}
