import type { RutaDeAjuste } from "@/lib/plantillas/apariencia"

/**
 * Qué cambia cada ajuste en la tienda, para quien lo está eligiendo.
 *
 * Hay ajustes que solo cambian en una pantalla: las columnas del catálogo
 * son de la computadora —en el celular siempre van dos— y la barra fija de
 * compra es del celular. El editor lo dice antes de que alguien toque una
 * opción y no vea pasar nada, y la vista previa se pasa sola a esa pantalla.
 *
 * Las partes de la tienda que cambia cada ajuste llevan `data-ajuste` con su
 * ruta; la vista previa las busca para señalarlas. `sinSenal` es lo que se
 * dice cuando no está en la pantalla: casi siempre porque falta algo.
 *
 * Sin dependencias: la usan el editor de la web y la API de la app.
 */

export type Pantalla = "ambas" | "celular" | "computadora"

export interface GuiaDeAjuste {
  pantalla: Pantalla
  /** Una línea: qué ve tu cliente. */
  ayuda: string
  /** Por qué puede no verse, aunque esté activo. */
  sinSenal?: string
}

export const GUIA_DE_AJUSTES: Partial<Record<RutaDeAjuste, GuiaDeAjuste>> = {
  "tipografia.pesoTitular": {
    pantalla: "ambas",
    ayuda: "Qué tan gruesa es la letra de los títulos.",
  },
  "tipografia.espaciadoTitular": {
    pantalla: "ambas",
    ayuda: "El espacio entre las letras de los títulos.",
  },
  "forma.radio": {
    pantalla: "ambas",
    ayuda: "Las esquinas de los botones, los filtros y el buscador.",
  },
  "disposicion.tarjeta": {
    pantalla: "ambas",
    ayuda: "La forma de cada foto en las listas de productos.",
  },
  "disposicion.columnas": {
    pantalla: "computadora",
    ayuda:
      "Solo cambia en computadora. En el celular siempre se ven dos productos por fila.",
  },
  "ficha.diseno": {
    pantalla: "ambas",
    ayuda: "Cómo se ordenan la foto y el texto del producto.",
  },
  "ficha.barraFija": {
    pantalla: "celular",
    ayuda:
      "Solo cambia en celular. Una barra con el precio y el botón «Agregar» que acompaña a tu cliente mientras baja por la página.",
    sinSenal:
      "Aparece cuando tu cliente baja y el botón «Agregar» queda atrás.",
  },
  "ficha.consulta": {
    pantalla: "ambas",
    ayuda:
      "Un botón para que tu cliente te escriba por WhatsApp sobre ese producto, con el mensaje ya escrito.",
    sinSenal: "Necesita el WhatsApp de tu tienda. Agrégalo en tu cuenta.",
  },
  "ficha.relacionados": {
    pantalla: "ambas",
    ayuda:
      "«También te puede gustar», debajo del producto: más productos de tu catálogo.",
    sinSenal: "Aparecen cuando tienes más productos en tu catálogo.",
  },
  "carrito.diseno": {
    pantalla: "ambas",
    ayuda:
      "Cómo se ordenan el pedido y el botón para enviarlo por WhatsApp. «Dos columnas» solo cambia en computadora.",
  },
  "carrito.sugerencias": {
    pantalla: "ambas",
    ayuda: "«Suma a tu pedido»: hasta tres productos más, debajo del carrito.",
    sinSenal: "Aparecen cuando hay productos que no están en el carrito.",
  },
}
