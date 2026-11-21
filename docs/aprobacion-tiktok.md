# Que TikTok apruebe Venduo

Los pasos para que las tiendas publiquen en TikTok **en público**. El código ya está
hecho y cumple las pautas de TikTok; cómo funciona y qué pauta se cumple dónde, en
`docs/tiktok.md`. Esto es la lista para llegar a la aprobación.

Revisado contra la documentación de TikTok for Developers el 20 de noviembre de 2026.

---

## Lo que hay que saber primero

**Son dos aprobaciones, una después de la otra:**

1. **La revisión de la app** (_App review_): TikTok aprueba la app y el permiso
   `video.publish`. Con eso se puede publicar, pero **solo en privado** ("Solo yo"), y
   como mucho **5 cuentas por día**, que además tienen que ser privadas al publicar.
2. **La auditoría de la Content Posting API**: un formulario aparte, en
   [developers.tiktok.com/application/content-posting-api](https://developers.tiktok.com/application/content-posting-api)
   (se ve con la sesión iniciada). Es lo que habilita publicar en público y fija cuántas
   cuentas por día pueden publicar, según lo que estimes en el formulario.

Aunque esté todo aprobado, TikTok limita a unas **15 publicaciones por día por cuenta**,
sumando todas las apps. No es de Venduo.

## Antes de empezar

- [ ] **Una cuenta de TikTok de Venduo** para el portal de desarrolladores, y **una
      cuenta de TikTok de prueba**, privada, para publicar en el sandbox y grabar el
      video.
- [ ] **Una tienda de prueba en producción** con algunos productos con foto.
- [ ] **La portada pública lista.** TikTok rechaza si el sitio es solo una página de
      ingreso o "todavía en desarrollo": tiene que explicar qué es Venduo. La portada de
      `venduo.vercel.app` ya lo hace. Los enlaces a **Términos** y **Privacidad** tienen
      que verse en la página sin abrir ningún menú: comprobarlo en el celular y en la
      computadora.
- [ ] **Producción despierta** durante la revisión: si Supabase gratuito se pausa, el
      revisor encuentra el sitio caído.
- [ ] **El ícono a 1024 × 1024 px** (PNG o JPG, hasta 5 MB). Hoy `public/marca` tiene
      hasta 512 px: hay que exportar uno de 1024 desde `simbolo.svg`.

## 1. Crear la app

En [developers.tiktok.com](https://developers.tiktok.com) → **Manage apps → Connect an
app**:

| Campo                | Qué poner                                                  |
| -------------------- | ---------------------------------------------------------- |
| App name             | `Venduo` (no puede nombrar a TikTok ni a otra red)         |
| App icon             | El de 1024 × 1024                                          |
| Category             | _Business_ o _Productivity_                                |
| Description          | La de abajo. Se ve en la pantalla donde la persona aprueba |
| Terms of Service URL | `https://venduo.vercel.app/terminos`                       |
| Privacy Policy URL   | `https://venduo.vercel.app/privacidad`                     |
| Platforms            | **Web**, con `https://venduo.vercel.app`                   |

**Description:**

> Venduo es el sistema para quien vende por redes sociales en Bolivia: tienda online,
> stock, pedidos por WhatsApp y estadísticas. Con TikTok, la persona publica la imagen
> de un producto de su tienda en su propia cuenta, después de revisarla y elegir quién
> puede verla.

## 2. Productos y permisos

- [ ] **Products → Add products**: _Login Kit_ y _Content Posting API_.
- [ ] **Login Kit → Redirect URI (Web)**:
      `https://venduo.vercel.app/panel/marketing/tiktok/vuelta` (exacta, con `https`).
- [ ] **Content Posting API**: activar **Direct Post**.
- [ ] **Scopes**: solo `user.info.basic` y `video.publish`. Un permiso que no se use
      demora o hace rechazar la revisión.

## 3. Verificar las direcciones (URL properties)

TikTok exige verificar, **en Production**, la dirección del sitio, la de Términos, la de
Privacidad y de dónde baja las fotos. En la app → **URL properties → Add URL**.

Con `venduo.vercel.app` no se puede usar **Domain** (pide un registro DNS, y el dominio
es de Vercel): va por **URL prefix**, que da un archivo `tiktokXXXX.txt` para poner en
esa dirección.

| Prefijo                                      | Para qué                       | Dónde va el archivo                                                                                                                                      |
| -------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://venduo.vercel.app/api/tiktok/foto/` | De donde TikTok baja las fotos | Lo sirve ya la ruta, con `TIKTOK_VERIFICACION` (abajo)                                                                                                   |
| `https://venduo.vercel.app/`                 | Sitio, Términos y Privacidad   | **Falta**: hoy el archivo solo se sirve bajo `/api/tiktok/foto/`. Hay que servirlo también en la raíz (un `rewrite` en `next.config.ts` a la misma ruta) |

> El prefijo de la raíz cubre también el de las fotos. Con ese verificado, alcanza con
> uno solo.

Si más adelante Venduo tiene un dominio propio, conviene verificarlo por **Domain** con
DNS, que cubre todo de una vez.

## 4. Las claves en Vercel

En Vercel → **Settings → Environment Variables**, para _Production_:

| Variable               | Valor                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `TIKTOK_CLIENT_KEY`    | El _Client key_ de la app                                    |
| `TIKTOK_CLIENT_SECRET` | El _Client secret_                                           |
| `TIKTOK_VERIFICACION`  | `nombre-del-archivo.txt=contenido del archivo`, en una línea |

Volver a desplegar, abrir la dirección del archivo para ver que muestra el contenido, y
tocar **Verify** en TikTok.

## 5. Probar en el sandbox

- [ ] Agregar la cuenta de TikTok de prueba como _target user_ del sandbox.
- [ ] Con la tienda de prueba: un producto → **Publicar en redes** → **Publicar directo
      en TikTok** → **Conectar TikTok** → aprobar.
- [ ] Elegir **Solo yo** y **Publicar en TikTok**; esperar "Publicada".
- [ ] Abrir TikTok: la foto está en el perfil, privada, **sin marca de agua, logo de
      Venduo, enlace ni texto promocional** (TikTok lo prohíbe y puede borrar el
      contenido).
- [ ] **Cambiar de cuenta** revoca el permiso.

## 6. Grabar el video de demostración

Uno o más videos (hasta 5, de 50 MB cada uno), grabando la pantalla **en el
navegador con la barra de direcciones a la vista**: el dominio del video tiene que ser
el mismo que el de _Platforms_. Como la app nunca fue aprobada, se graba en el
**sandbox**. Tiene que mostrar **cada producto y cada permiso**; la interfaz puede
quedar en español.

Guion, de unos dos minutos:

1. `venduo.vercel.app` → ingresar con la tienda de prueba.
2. Panel → **Publicar en redes** → elegir un producto, el diseño y el formato.
3. **Publicar directo en TikTok** → **Conectar TikTok** → la pantalla de TikTok con los
   dos permisos → aprobar → vuelve a Venduo.
4. Despacio, cada pauta:
   - "Publicarás como" con el nombre y la foto de la cuenta.
   - La vista previa ("Así se verá").
   - Editar el título.
   - Abrir **Quién puede verlo**: no tiene nada elegido, y el botón no publica sin
     elegir.
   - **Permitir comentarios** sin marcar.
   - Encender **Contenido comercial**: pide elegir; marcar **Contenido de marca**,
     **Solo yo** se deshabilita y cambia el texto de consentimiento. Apagarlo.
   - El texto de consentimiento con el enlace a la confirmación de uso de música.
5. Elegir **Solo yo** → **Publicar en TikTok** → el estado hasta "Publicada".
6. Abrir TikTok y mostrar la foto en el perfil.
7. Volver y mostrar **Cambiar de cuenta**.

## 7. Enviar la revisión de la app

En la app → **App review**:

- [ ] La explicación de cómo se usa cada producto y permiso. En inglés:

> Venduo is a platform for small sellers in Bolivia who sell through social media. Each
> seller has an online store with their products. From "Publish to social media", the
> seller picks a product, and Venduo generates a product image with the store's colors.
>
> - **Login Kit / user.info.basic:** the seller connects their own TikTok account. We
>   show their display name and avatar on the posting screen ("Publishing as") so they
>   know which account will receive the post. We do not store this information.
> - **Content Posting API / video.publish (Direct Post, photo):** the seller reviews a
>   preview of the image, edits the title, chooses the privacy level (no default), the
>   comment setting and the commercial content disclosure. Only when they press
>   "Publicar en TikTok" do we post the photo to their own account. We then show the
>   processing status.
>
> We never post automatically, never add watermarks, logos, links or promotional text
> to the content, and the seller can disconnect their account at any time ("Cambiar de
> cuenta"), which revokes the token. Venduo is open to any seller, not for internal use.

- [ ] Subir el video.
- [ ] **Save** → **Submit for review**.

El estado pasa de _Draft_ a _In review_ (no se puede cambiar nada; **Recall** la
retira) y después a _Live_ o _Not approved_. Los comentarios del revisor aparecen en la
página de la app y en _History_. No hay plazo publicado.

## 8. Pedir la auditoría

Con la app en _Live_, abrir
[el formulario de la auditoría](https://developers.tiktok.com/application/content-posting-api)
con la sesión iniciada. Pide, entre otras cosas, una estimación de uso: cuántas cuentas
publicarían por día. Una estimación honesta y modesta para empezar (por ejemplo, la
cantidad de tiendas activas de hoy con un margen); de ahí sale el tope diario.

Cuando la aprueben, el aviso de "Mientras TikTok revisa Venduo, solo se puede publicar
como «Solo yo»" de la pantalla de publicar deja de corresponder: hay que quitarlo.

## Por qué rechaza TikTok, y cómo está Venduo

| Motivo de rechazo                                        | Venduo                                      |
| -------------------------------------------------------- | ------------------------------------------- |
| Sitio en desarrollo, de uso interno o solo de ingreso    | Portada pública que explica el producto     |
| Términos y Privacidad que no se ven sin abrir un menú    | **Comprobar** en la portada                 |
| Direcciones sin verificar                                | **Falta** servir el archivo en la raíz (§3) |
| El video no muestra el dominio, un producto o un permiso | El guion de §6 los recorre todos            |
| Permisos de más                                          | Solo los dos que se usan                    |
| Privacidad con valor por defecto, no mostrar la cuenta   | Cumplido (`docs/tiktok.md`)                 |
| Marca de agua, logo o texto agregado al contenido        | La imagen sale sin enlace, sin QR ni Venduo |
| Ícono que no es de 1024 × 1024                           | **Falta** exportarlo                        |

---

Fuentes: [Content Posting API — Get started](https://developers.tiktok.com/doc/content-posting-api-get-started),
[Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines),
[App review guidelines](https://developers.tiktok.com/doc/app-review-guidelines),
[Create an app](https://developers.tiktok.com/doc/getting-started-create-an-app),
[Direct Post reference](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post).
