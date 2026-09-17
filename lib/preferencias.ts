/**
 * Preferencias de interfaz que se guardan en cookie.
 *
 * Viven en un módulo sin `"use client"` porque las leen los dos lados: el
 * layout de servidor, para dibujar la página ya con el ancho correcto, y el
 * componente de cliente, para escribirlas. Exportada desde un archivo de
 * cliente, en el servidor esta constante sería una referencia y no el texto.
 */

/** Si la barra lateral de escritorio quedó plegada. */
export const COOKIE_BARRA = "venduo-barra"
