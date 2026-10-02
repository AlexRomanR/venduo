# La marca

El símbolo de Venduo es **la feria en el celular**: el toldo a rayas de un puesto de feria
dentro de la pantalla de un celular. El puesto de siempre, ahora en el teléfono. Se
eligió entre diez propuestas porque se entiende al instante, también para quien nunca
tuvo una tienda online, y porque se lee a 16 px.

## Dónde vive

| Qué                                       | Dónde                                                   |
| ----------------------------------------- | ------------------------------------------------------- |
| La geometría y los colores: **la fuente** | `lib/marca.ts`                                          |
| `Logo` y `Simbolo` para la interfaz       | `components/marca/logo.tsx`                             |
| Favicon, ícono SVG e ícono del celular    | `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png` |
| Íconos del manifiesto y la tarjeta        | `public/marca/`, `app/manifest.ts`                      |

**Nadie dibuja el logo a mano.** Ni un `<img>` con el SVG, ni el nombre en Archivo con
un ícono al lado: `<Logo />` o `<Simbolo />`. Si cambia la geometría, se cambia
`lib/marca.ts` y se corre `npm run marca`, que vuelve a generar los archivos de `app/` y
`public/marca/`; con `-- --paquete <carpeta>` arma además el paquete completo para
diseño y redes. Los archivos generados se commitean.

## Los colores

Tinta `#16171a`, señal `#d62d12` y papel `#f1f0ee`, los de `DESIGN.md`. Cuatro trajes y
ningún otro:

| Traje        | Fondo              | Cuerpo | Rayas del toldo                     |
| ------------ | ------------------ | ------ | ----------------------------------- |
| Color        | Papel o claro      | Tinta  | Rojo y tinta                        |
| Sobre oscuro | Tinta u oscuro     | Papel  | Rojo y papel                        |
| Un color     | Claro, para sellos | Tinta  | Las de tinta se calan, no se pintan |
| Blanco       | Oscuro, un color   | Papel  | Las de tinta se calan               |

En un solo color las rayas de tinta se calan: pintadas, el toldo sería una mancha.

## Lo que no se negocia

- **Solo en el mundo de Venduo.** `Simbolo` pinta las rayas con la señal, y dentro de
  una tienda la señal es la de su plantilla: el toldo saldría azul en Pasarela y oro en
  Esencia. En la tienda pública, "Hecho con Venduo" va como texto.
- **La tarjeta de compartir va solo en la portada**, en su `metadata`. En la raíz la
  heredaría una tienda sin logo, y su enlace por WhatsApp mostraría a Venduo.
- **Margen libre**: alrededor del símbolo, el ancho de una raya del toldo; del logo
  horizontal, la mitad de la altura de su V. **Tamaño mínimo**: 16 px el símbolo, 20 px
  de alto el logo con el nombre.
- No se rota, no se estira, no lleva sombra ni contorno, no se le cambia el orden de las
  rayas —el rojo va en los extremos— y no va sobre una foto sin un recuadro de papel.
- El nombre en la interfaz es **texto vivo** en Archivo extrabold; en los archivos, a
  trazos, para que se vea igual en una computadora sin la letra.
