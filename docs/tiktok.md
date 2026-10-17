# Publicar en TikTok

Desde **Publicar en redes**, una tienda puede mandar la imagen de un producto directo a
su cuenta de TikTok, sin descargarla. Este documento cuenta cómo está hecho, qué hay que
configurar y cómo pedir la revisión de TikTok.

## Lo que hay que saber primero

- **Sin la revisión de TikTok, todo lo publicado queda privado** ("Solo yo"), y pueden
  publicar como mucho cinco cuentas por día. Es una regla de TikTok para toda app no
  revisada, no algo de Venduo. La revisión es lo que habilita publicar en público.
- **Sin las variables de entorno, la función no existe**: el botón "Publicar directo en
  TikTok" no aparece y la pantalla redirige. Todo lo demás de Publicar en redes sigue
  igual.
- Es la función `tiktok` del sistema de funciones: el administrador la apaga por tienda
  o para todas desde `/admin/funciones`, y se comprueba en el servidor.

## Cómo está hecho

| Pieza                                                       | Qué hace                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| `lib/tiktok.ts`                                             | Autorización, permisos, cuenta, publicar y estado. Servidor |
| `lib/cifrado.ts`                                            | AES-256-GCM para los permisos y la cookie de ida y vuelta   |
| `app/(privado)/panel/marketing/tiktok/page.tsx`             | La pantalla de publicar, o "Conecta tu cuenta"              |
| `…/tiktok/conectar`, `…/tiktok/vuelta`                      | Ir a TikTok a aprobar y volver con el permiso               |
| `…/tiktok/acciones.ts`                                      | Publicar, seguir el estado y desconectar                    |
| `components/publicar/publicar-en-tiktok.tsx`                | El formulario, con las reglas de TikTok                     |
| `app/api/tiktok/foto/[...ruta]`                             | De donde TikTok baja la foto, y su archivo de verificación  |
| `supabase/migrations/20261018100000_publicar_en_tiktok.sql` | `tiktok` en `social_provider` y en `feature_states`         |

El recorrido:

1. "Conectar TikTok" va a `/conectar`, que guarda un `state` al azar en una cookie
   cifrada y manda a la pantalla de TikTok con los permisos `user.info.basic` y
   `video.publish`.
2. TikTok vuelve a `/vuelta`, que comprueba el `state`, cambia el código por los
   permisos y los guarda **cifrados** en `social_connections` (RLS sin políticas, solo
   la clave de servicio). El de acceso dura 24 horas y se renueva solo con el de
   renovación, que dura un año.
3. Cada vez que se abre la pantalla se lee la cuenta (`creator_info`): nombre, foto, qué
   privacidades permite, si tiene los comentarios apagados. Lo exige TikTok.
4. Al publicar, el servidor valida todo de nuevo, arma la imagen **sin enlace ni QR**
   —TikTok no permite que una app agregue enlaces—, la sube como JPEG con un nombre al
   azar y le pide a TikTok que la baje de `/api/tiktok/foto/{tienda}/{archivo}.jpg`.
5. La pantalla pregunta el estado cada 4 segundos. Cuando termina, bien o mal, la foto
   se borra.
6. "Cambiar de cuenta" revoca el permiso en TikTok y borra la fila.

### Lo que pide TikTok y dónde se cumple

Son las [pautas de experiencia](https://developers.tiktok.com/doc/content-sharing-guidelines)
de la Content Posting API. El revisor las mira una por una en el video.

| Pauta                                                                   | Dónde                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| Mostrar con qué cuenta se publica (nombre y foto)                       | "Publicarás como", leído en el momento                     |
| Vista previa de lo que se publica                                       | "Así se verá", la misma imagen que se manda                |
| Título editable                                                         | "Título", 90 caracteres, con contador                      |
| Privacidad sin valor por defecto, solo las que da la cuenta             | "Quién puede verlo", vacío; el botón no publica sin elegir |
| Comentarios apagados por defecto, deshabilitados si la cuenta los apagó | "Permitir comentarios"                                     |
| Contenido comercial apagado, con "Tu marca" y "Contenido de marca"      | El interruptor, y el servidor exige elegir uno             |
| Contenido de marca no puede ser privado                                 | "Solo yo" se deshabilita, y el servidor lo rechaza         |
| Textos de consentimiento con enlaces a sus políticas                    | Debajo del formulario, cambian según lo elegido            |
| Nada de marcas de agua, enlaces o promociones agregadas                 | La imagen va sin enlace ni QR; el texto se limpia          |
| Avisar que procesar tarda y mostrar el estado                           | El aviso bajo el botón y el estado al publicar             |
| Publicar solo cuando la persona confirma                                | Solo el botón publica; nada se manda solo                  |

## Configurar

### 1. La app en TikTok for Developers

En [developers.tiktok.com](https://developers.tiktok.com), con una cuenta de TikTok de
Venduo:

1. **Manage apps → Connect an app.** Nombre: `Venduo`. Categoría: _Business_ o
   _Productivity_.
2. **App details:**
   - Ícono: `public/marca/icono-512.png`.
   - Descripción: "Venduo es el sistema para quien vende por redes sociales en Bolivia:
     tienda online, stock, pedidos por WhatsApp y estadísticas. Con TikTok, la persona
     publica la imagen de un producto de su tienda en su propia cuenta, después de
     revisarla y elegir quién puede verla."
   - Terms of Service URL: `https://venduo.vercel.app/terminos`
   - Privacy Policy URL: `https://venduo.vercel.app/privacidad`
   - Platforms: **Web**, con `https://venduo.vercel.app`.
3. **Products → Add products:** _Login Kit_ y _Content Posting API_.
4. **Login Kit → Redirect URI (Web):**
   `https://venduo.vercel.app/panel/marketing/tiktok/vuelta`
   Tiene que ser exacta, con `https`. Para probar en una vista previa de Vercel se agrega
   también la de esa rama.
5. **Content Posting API:** activar **Direct Post**.
6. **Scopes:** `user.info.basic` y `video.publish`. Nada más: pedir de más es motivo de
   rechazo.

### 2. Verificar de dónde se bajan las fotos

TikTok solo baja fotos de una dirección verificada. En la app, **URL properties → Add
URL → URL prefix**:

```
https://venduo.vercel.app/api/tiktok/foto/
```

TikTok da un archivo para descargar, por ejemplo `tiktokAbC123.txt`, con una línea de
texto adentro. No se sube a ningún lado: se pone en una variable de entorno y la ruta lo
sirve.

### 3. Las variables en Vercel

En el proyecto de Vercel, **Settings → Environment Variables**, para _Production_ (y
_Preview_ si se prueba en una rama):

| Variable               | Valor                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `TIKTOK_CLIENT_KEY`    | El _Client key_ de la app                                    |
| `TIKTOK_CLIENT_SECRET` | El _Client secret_. Cifra también los permisos guardados     |
| `TIKTOK_VERIFICACION`  | `nombre-del-archivo.txt=contenido del archivo`, en una línea |

Por ejemplo: `TIKTOK_VERIFICACION=tiktokAbC123.txt=tiktok-developers-site-verification=AbC123`.

Después, volver a desplegar, comprobar que
`https://venduo.vercel.app/api/tiktok/foto/tiktokAbC123.txt` muestra el contenido, y
tocar **Verify** en TikTok.

**Cambiar `TIKTOK_CLIENT_SECRET` desconecta a todos**: lo guardado ya no se descifra,
se descarta, y cada tienda vuelve a aprobar una vez.

Para la web local, las mismas tres en `.env.local` (no se commitea). `.env.example` no
las tiene todavía: se suman a mano.

### 4. Probar antes de pedir la revisión

En **Sandbox** (o con la app sin revisar), agregar la cuenta de TikTok de prueba como
_target user_. Con la tienda de prueba:

1. Un producto → **Publicar en redes** → **Publicar directo en TikTok**.
2. **Conectar TikTok** y aprobar.
3. Elegir **Solo yo** —sin revisión es la única que funciona— y **Publicar en TikTok**.
4. Esperar "Publicada" y abrir TikTok: la foto está en el perfil, privada.

## Pedir la revisión

En la app, **Submit for review**. Lo que piden y qué poner:

**Cómo usa la app cada producto y permiso** (en inglés, que es lo que lee el revisor):

> Venduo is a platform for small sellers in Bolivia who sell through social media. Each
> seller has an online store with their products. From "Publish to social media", the
> seller picks a product, and Venduo generates a product image with the store's colors.
>
> - **Login Kit / user.info.basic:** the seller connects their own TikTok account. We
>   show their display name and avatar on the posting screen ("Publishing as") so they
>   know which account will receive the post. We do not store this information.
> - **Content Posting API / video.publish (Direct Post, photo):** the seller reviews a
>   preview of the image, edits the title and caption, chooses the privacy level (no
>   default), comment and music settings, and the commercial content disclosure. Only
>   when they press "Publicar en TikTok" do we post the photo to their account. We then
>   show the processing status.
>
> We never post automatically, never add watermarks, links or promotional text to the
> content, and the seller can disconnect their account at any time ("Cambiar de
> cuenta"), which revokes the token.

**El video de demostración.** Lo piden grabando la pantalla, de punta a punta, en el
dominio real. Hay que mostrar el sitio en el navegador con la dirección a la vista.
Guion, de unos dos minutos:

1. `venduo.vercel.app`, ingresar con la tienda de prueba.
2. Panel → **Publicar en redes** → elegir un producto → elegir diseño y formato.
3. **Publicar directo en TikTok** → **Conectar TikTok** → la pantalla de TikTok con los
   dos permisos → aprobar → vuelve a Venduo.
4. Mostrar despacio cada pauta: "Publicarás como" con el nombre y la foto; la vista
   previa; editar el título; abrir **Quién puede verlo** y mostrar que no tiene nada
   elegido y que el botón no publica; marcar **Permitir comentarios**; encender
   **Contenido comercial**, mostrar que pide elegir, marcar **Contenido de marca** y
   mostrar que **Solo yo** se deshabilita y que cambia el texto de consentimiento;
   apagarlo.
5. Elegir **Solo yo**, **Publicar en TikTok**, mostrar el estado hasta "Publicada".
6. Abrir TikTok y mostrar la foto publicada en el perfil.
7. Volver y mostrar **Cambiar de cuenta**.

El video va en inglés o con subtítulos en inglés si TikTok lo pide; la interfaz puede
quedar en español.

**Si la rechazan**, el correo dice qué pauta falta. Las más comunes: privacidad con
valor por defecto, no mostrar la cuenta, agregar texto o marcas al contenido, o pedir
permisos que no se usan. Todas están cubiertas arriba; si piden otra cosa, se ajusta la
pantalla y se vuelve a enviar.
