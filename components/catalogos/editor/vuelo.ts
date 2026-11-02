/**
 * La foto de un producto que vuela hasta el catálogo al elegirlo: de la
 * grilla a "Así va quedando". Se dibuja una copia encima de todo y se la mueve
 * con la API de animaciones del navegador, sin dependencias; al llegar, el
 * destino late una vez. Con "Reducir movimiento" no vuela nada.
 */
export function volarAlCatalogo(origen: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const destino = [
    ...document.querySelectorAll<HTMLElement>("[data-destino-del-vuelo]"),
  ].find((el) => {
    const caja = el.getBoundingClientRect()
    return caja.width > 0 && caja.bottom > 0 && caja.top < window.innerHeight
  })
  if (!destino) return

  const desde = origen.getBoundingClientRect()
  const hasta = destino.getBoundingClientRect()
  const copia = origen.cloneNode(true) as HTMLElement
  Object.assign(copia.style, {
    position: "fixed",
    left: `${desde.left}px`,
    top: `${desde.top}px`,
    width: `${desde.width}px`,
    height: `${desde.height}px`,
    margin: "0",
    zIndex: "80",
    pointerEvents: "none",
    overflow: "hidden",
    boxShadow: "0 18px 40px -16px rgb(29 28 26 / 0.55)",
  })
  document.body.appendChild(copia)

  const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2)
  const dy =
    hasta.top + Math.min(hasta.height, 160) / 2 - (desde.top + desde.height / 2)
  const escala = Math.max(0.16, Math.min(0.45, hasta.width / desde.width / 3))
  // Sube un poco antes de bajar: la curva se lee como un objeto que se lanza.
  const arco = Math.min(90, Math.abs(dx) * 0.2 + 40)

  const vuelo = copia.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      {
        offset: 0.45,
        transform: `translate(${dx * 0.45}px, ${dy * 0.45 - arco}px) scale(${(1 + escala) / 1.6}) rotate(-8deg)`,
        opacity: 1,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${escala}) rotate(0deg)`,
        opacity: 0.15,
      },
    ],
    { duration: 640, easing: "cubic-bezier(0.55, 0, 0.25, 1)" }
  )
  vuelo.onfinish = () => {
    copia.remove()
    destino.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.035)" },
        { transform: "scale(1)" },
      ],
      { duration: 280, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
    )
  }
  vuelo.oncancel = () => copia.remove()
}
