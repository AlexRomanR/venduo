---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

Superficie: `/` — la portada pública. Modo Persuade.

Llega alguien que no conoce Venduo, desde un enlace de WhatsApp o de sus redes, casi siempre
en un Android de gama baja con datos móviles. Ya vende por TikTok, Instagram o WhatsApp y
no siente que le falte una página web: le falta orden. Tiene que entender que Venduo es
más que una tienda online —la tienda y el sistema que la maneja— y querer registrarse.
Una sola audiencia: quien vende por redes y no da abasto. Lo que la convence es ver que el
pedido le sigue llegando por WhatsApp, donde ya vende, pero ordenado.

Prueba: el mecanismo funcionando en el primer viewport. Las cifras y los ejemplos son
ilustrativos de la demostración y lo declaran al pie.

Decisión abierta que nadie debe inventar: el slug de la tienda de ejemplo todavía no
existe; hasta entonces queda como constante nula con su pendiente escrito.

## Direction contract

THESIS: La portada nombra las tres cosas que la persona se lleva —la tienda online, el
inventario y las ventas—, promete que se arman en un minuto y nombra lo que viene además:
la plantilla editable, los pedidos por WhatsApp, los catálogos y las estadísticas. A la
derecha lo muestra con algo real y no con un esquema: quien vende, su tienda funcionando
y lo que Venduo le avisa.
Rechaza la portada SaaS con degradado, teléfono flotando en ángulo y tres tarjetas de
características, y rechaza también el color bañado que satura la vista.

OWN-WORLD: Editorial impreso. Papel claro `#f1f0ee` como campo, tinta `#16171a`, y un
rojo de señal `#d62d12` que aparece poco y manda cuando aparece: la acción principal, las
cifras, las etiquetas de sección y el bloque de cierre. Reglas de un píxel separan las
secciones; no hay tarjetas como andamiaje ni sombras difusas. Titulares y cifras en
Archivo extrabold con tracking cerrado; texto en Geist. Fotografía en blanco y negro que
recupera color al pasar el cursor, porque el rojo es el único acento y una foto a color le
competiría.

STORY: Se reconoce en los problemas de vender por redes, entiende que una tienda sola no
los arregla y que lo que hay detrás sí. Cree porque lo ve ocurrir en pantalla, no porque se
lo digan. Elige el camino que lo describe: ordenar su negocio o salir a vender.

FIRST VIEWPORT: Barra fija con las anclas y la acción roja. A la izquierda, el titular a
escala grande —"Tu tienda online, tu inventario y tus ventas. Lista en un minuto."—, una
bajada, los cuatro agregados con su ícono y la acción. A la derecha (`Vitrina`), tres
capas: una foto en blanco y negro de una vendedora fotografiando sus productos; un
celular recto con la captura real de Rosa Deportes; y dos tarjetas de papel con regla,
el aviso de Venduo de un pedido nuevo y el stock que se está acabando en rojo. Sin
scroll para llegar a la acción en la computadora.

La foto es de Pexels (7309930, licencia libre) y la captura sale de la tienda publicada,
a 390 px y doble densidad, desde la sección "Lo nuevo". Las dos viven en
`public/portada/`: si la tienda de Rosa cambia, la captura se vuelve a sacar.

FORM: Editorial impreso, dirección fijada por el usuario sobre una referencia propia que
reemplazó la asignación del dado. Seed key 0c40d65d.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
the verdict, DESIGN.md, and every shipping raster carrying its provenance
