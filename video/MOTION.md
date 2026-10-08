# MOTION.md

Cómo se mueve la marca de Venduo **en video**: el lanzamiento y las piezas cortas para
redes. No rige la app. El movimiento de la interfaz —un solo gesto, entrar, y animar de
menos— sigue en `DESIGN.md` y `ui-styling.md`, y ahí manda.

Este documento no inventa un mundo nuevo: traduce el de `DESIGN.md` a una pieza que dura
treinta segundos y compite con el resto de TikTok. Comparte la paleta, las letras, la
curva de entrada y el logo; cambia el ritmo, porque un video sin movimiento no se mira.

---

## 1. La idea que sostiene todo

**"El diario del mercado" se pone a correr.** Papel claro, tinta casi negra, un solo rojo
que manda cuando aparece, reglas de un píxel y titulares enormes con las letras juntas.
Nada flota, nada brilla, nada gira.

Y una estructura que se repite: **una pregunta y su respuesta.** Quien vende por redes
vive contestando "¿precio?", "¿tienes catálogo?", "¿todavía tienes?". El video cuenta
Venduo como la respuesta a cada una.

## 2. Lo que se hereda de DESIGN.md, sin cambios

| Qué              | Valor                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Papel            | `#f1f0ee`. Es el fondo de casi todo el video                             |
| Tinta            | `#16171a`. Texto, marco del celular, reglas                              |
| Señal            | `#d62d12`. La palabra que responde, la cifra, el bloque del enlace final |
| Jerarquía        | Tinta con opacidad (70 % secundario), nunca grises nuevos                |
| Titulares        | Archivo ExtraBold, tracking `-0.03em`, interlínea `1`                    |
| Lectura          | Geist 400 y 600                                                          |
| Curva de entrada | `cubic-bezier(0.16, 1, 0.3, 1)` — en GSAP, `expo.out` es su equivalente  |
| Logo             | La feria en el celular, con las reglas de `.agents/rules/marca.md`       |

**Prohibido, igual que en la app:** sombras, degradados, un segundo color de acento,
contenedores redondeados —el radio es del celular y nada más—, emojis haciendo de ícono
y **el celular en ángulo**: siempre de frente.

## 3. Lo que cambia para el video

| En la app (`DESIGN.md`)           | En el video                                             | Por qué                                           |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Un solo gesto: entrar             | Seis gestos, todos de la sección 4                      | Un video quieto se saltea en el primer segundo    |
| Sube 14 px                        | Sube 40 px en 1080 de ancho                             | Es la misma distancia, a la escala de la pantalla |
| Escalonado de 70–90 ms, tope de 3 | Escalonado de 70–90 ms, sin tope                        | Los mensajes llueven: el caos es el punto         |
| Animar de menos                   | Siempre se mueve algo, pero una sola cosa manda por vez | El ojo sigue a lo que se mueve                    |
| El rojo, poco                     | El rojo, poco: **una palabra por escena**               | Si todo es rojo, nada responde                    |

## 4. Los gestos

Son estos y no otros. Cada uno con su curva y su duración.

| Gesto                   | Qué hace                                                               | Curva y tiempo                           |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| **Entrar**              | Sube 40 px y aparece                                                   | `expo.out`, 0,5 s                        |
| **Salir**               | Sube 24 px y se va, más rápido que lo que entra                        | `power2.in`, 0,25 s                      |
| **Desplegar el toldo**  | Las cinco rayas caen desde arriba, una tras otra                       | `expo.out`, 0,45 s, escalonado 70 ms     |
| **Trazar**              | Una regla se dibuja de izquierda a derecha bajo la palabra que importa | `expo.out`, 0,5 s                        |
| **Cambiar de pantalla** | La pantalla nueva sube desde abajo dentro del celular                  | `expo.out`, 0,5 s                        |
| **Sellar**              | El bloque rojo del enlace cae con un golpe, en el golpe de la música   | `back.out(1.6)`, 0,4 s — el único rebote |

**Desplegar el toldo es la firma.** Presenta el logo, y se usa una vez para abrir y otra
para cerrar. Usarlo como transición cualquiera lo gasta.

No se usan: rebotes elásticos fuera del sello, giros, desenfoque de movimiento,
partículas, glitch, 3D, zoom de cámara que marea.

## 5. El ritmo lo pone la música

La pista es **Upbeat Funk – Commercial Advertising Music**, de SigmaMusicArt, con la
Pixabay Content License. El autor permite usarla en Shorts, Reels y videos largos, y no
distribuirla como música. Va **sin voz**.

| Medida    | Valor                                |
| --------- | ------------------------------------ |
| Tempo     | 112 BPM                              |
| Un tiempo | 0,5357 s                             |
| Un compás | 2,143 s (4 tiempos)                  |
| Una frase | 8,57 s (4 compases)                  |
| Volumen   | Normalizada a −14 LUFS, pico −1,5 dB |

- **Todo corte cae en un tiempo**, y los cambios de escena en un compás. Se escribe en
  tiempos (`b(24)`), no en segundos.
- La pista sube de energía a los 8,57 s: ahí aparece el logo. El cierre usa la última
  frase de la pista, empalmada en un tiempo fuerte, para que **el golpe final caiga
  sobre el enlace**.
- Las dos ediciones están en `assets/musica/` y salen de `upbeat-funk-original.mp3` con
  FFmpeg (los comandos, en `construir.mjs`, arriba del todo).

## 6. Las dos pantallas

|                | Vertical (TikTok, Reels) | Horizontal (portada, YouTube) |
| -------------- | ------------------------ | ----------------------------- |
| Lienzo         | 1080 × 1920, 30 fps      | 1920 × 1080, 30 fps           |
| Duración       | 30,6 s                   | 47,7 s                        |
| Zona segura    | x 80–940, y 230–1540     | 96 px de cada borde           |
| Titular mínimo | 64 px                    | 80 px                         |
| Texto mínimo   | 40 px                    | 32 px                         |

La zona segura vertical deja libres los botones y el texto de TikTok e Instagram: la
columna derecha y el tercio de abajo.

**La misma historia, recompuesta, no recortada.** En vertical, todo va centrado y el
celular al medio. En horizontal, el celular va a la izquierda y la pregunta y la respuesta
a la derecha. El horizontal suma tres respuestas que el vertical no tiene tiempo de contar:
cómo se arma la tienda, las estadísticas y la IA.

## 7. El texto en pantalla

- Español neutro boliviano, tratando de tú, como en la app.
- Una pregunta: menos de cinco palabras. Una respuesta: dos líneas, una palabra en rojo.
- Ningún texto dura menos de cuatro tiempos (2,1 s) en pantalla.
- No se promete lo que la app no hace. El stock **se ve** en la tienda, pero baja cuando
  la tienda marca el pedido pagado, no solo. No hay talles ni envíos.
- Las redes se nombran con su nombre, en versalitas. **Sin sus logos.**

## 8. Las pantallas de la app

Son reales, de la tienda de demostración **Rosa Deportes** en su versión rosa —paleta
Rosa, botones suaves, ropa deportiva de mujer—, capturadas en producción a 390 px con
densidad 3×:

| Escena                  | De dónde sale                                                         |
| ----------------------- | --------------------------------------------------------------------- |
| ¿Cómo armo mi tienda?   | El alta (`crear/`), con la cuenta de Ana y sin enviar el formulario   |
| ¿Tienes catálogo?       | El editor de catálogos (`catalogo-editor/`) y el PDF "Temporada rosa" |
| ¿Precio?                | La grilla de la tienda (`rosa-tienda.jpg`)                            |
| ¿Todavía tienes?        | La ficha del Top deportivo rosa                                       |
| Ponle colores de verano | La vista previa del editor en Rosa y en Terracota, sin publicar       |

Los toques que se ven sobre las grabaciones —un círculo que aparece y se va— marcan dónde
se tocó. El chat del pedido y el gráfico se dibujan en HTML con los mismos colores,
porque necesitan moverse por dentro.

**Si la tienda de Rosa cambia, las pantallas no se enteran**: son fotos. Para el próximo
video se vuelven a capturar.

## 9. Cómo se trabaja

```bash
cd video
node --no-warnings construir.mjs vertical      # escribe index.html en 9:16
npx hyperframes check                           # lint y auditorías
npx hyperframes preview                         # se mira y se edita en el navegador
npx hyperframes render -o renders/venduo-vertical.mp4

node --no-warnings construir.mjs horizontal    # el mismo index.html, en 16:9
npx hyperframes render -o renders/venduo-horizontal.mp4
```

Los dos formatos escriben `index.html`: HyperFrames admite una sola composición raíz por
proyecto.

**Se edita `construir.mjs`, no `index.html`**: los dos formatos salen de las mismas escenas,
y un cambio hecho a mano en uno no llega al otro. Los colores salen de `lib/marca.ts`.

El enlace del cierre es la constante `ENLACE` de `construir.mjs`: cambiarlo es una línea y
volver a exportar.

Las skills de HyperFrames (`/hyperframes`, `/hyperframes-core`, `/hyperframes-animation`)
explican el formato de una composición; este documento, cómo debe verse. No se versionan
—traen archivos que no siguen el formato del proyecto, y las de terceros no se editan—:
se instalan con `npx skills add heygen-com/hyperframes --agent claude-code`, y el render
necesita FFmpeg (`winget install --id Gyan.FFmpeg -e`).
