import { cssDeApariencia, type Apariencia } from "@/lib/plantillas/apariencia"

/**
 * Aplica una apariencia a toda la página mientras esté montado.
 *
 * Redefine las variables en `:root` y no en un contenedor: los diálogos, los
 * cajones y los avisos se dibujan en un portal fuera del árbol, y con las
 * variables en un contenedor esas piezas quedaban con los colores de Venduo.
 *
 * Va sin `precedence`: React no retira del documento una hoja con precedencia
 * cuando se desmonta, y al salir de la tienda hacia la portada de Venduo el
 * tema se quedaría pegado.
 *
 * `dangerouslySetInnerHTML` es seguro solo porque `cssDeApariencia` arma el
 * texto con tokens validados —colores `#rrggbb`, claves cerradas—. Nunca pasarle
 * texto libre.
 */
export function EstiloDePlantilla({ apariencia }: { apariencia: Apariencia }) {
  return (
    <style
      data-plantilla=""
      dangerouslySetInnerHTML={{ __html: cssDeApariencia(apariencia) }}
    />
  )
}
