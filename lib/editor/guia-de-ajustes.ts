import type { RutaDeAjuste } from "@/lib/plantillas/apariencia"

/**
 * Qué cambia cada ajuste en la tienda, para quien lo está eligiendo.
 *
 * Hay ajustes que solo se notan en una pantalla: las columnas del catálogo
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
    ayuda: "Qué tan gruesa se ve la letra de los títulos.",
  },
  "tipografia.espaciadoTitular": {
    pantalla: "ambas",
    ayuda: "Cuánto aire hay entre las letras de los títulos.",
  },
  "forma.radio": {
    pantalla: "ambas",
    ayuda: "Las esquinas de los botones, los filtros y el buscador.",
  },
  "disposicion.tarjeta": {
    pantalla: "ambas",
    ayuda: "La forma de cada foto en las grillas de productos.",
  },
  "disposicion.columnas": {
    pantalla: "computadora",
    ayuda:
      "Cuántos productos entran por fila en una pantalla ancha. En el celular siempre van dos.",
  },
  "ficha.diseno": {
    pantalla: "computadora",
    ayuda:
      "Cómo se ordenan la foto y el texto de un producto. Se nota sobre todo en la computadora.",
  },
  "ficha.barraFija": {
    pantalla: "celular",
    ayuda:
      "Una barra con el precio y «Agregar» que sigue a tu cliente mientras baja por la foto.",
    sinSenal:
      "Aparece cuando tu cliente baja y el botón de agregar queda atrás.",
  },
  "ficha.consulta": {
    pantalla: "ambas",
    ayuda:
      "Un botón para que te escriban por ese producto, con el mensaje ya escrito.",
    sinSenal: "Necesita el WhatsApp de tu tienda. Agrégalo en tu cuenta.",
  },
  "ficha.relacionados": {
    pantalla: "ambas",
    ayuda:
      "«También te puede gustar» al pie: más productos para seguir mirando.",
    sinSenal: "Aparece cuando tienes más productos en tu catálogo.",
  },
  "carrito.diseno": {
    pantalla: "ambas",
    ayuda:
      "Cómo se ordenan el pedido y el botón de enviarlo por WhatsApp. «Dos columnas» se nota en la computadora.",
  },
  "carrito.sugerencias": {
    pantalla: "ambas",
    ayuda: "«Suma a tu pedido»: hasta tres productos más, debajo del carrito.",
    sinSenal: "Aparece cuando tienes productos que no están en el carrito.",
  },
}
