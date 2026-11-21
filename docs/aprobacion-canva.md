# Que Canva apruebe Venduo

Los pasos para que cualquier tienda pueda abrir su catálogo en Canva con un toque. El
código ya está hecho (`lib/canva.ts`, y cómo funciona en `docs/catalogos-pdf.md` §10):
lo que falta es la integración del lado de Canva y su revisión.

Mientras Canva no la apruebe, "Editar en Canva" funciona igual por el camino a mano:
se baja el PDF y se abre el editor de PDF de Canva. Con la integración creada pero sin
aprobar, solo la puede usar la cuenta de Canva que la creó.

Revisado contra la documentación de Canva el 20 de noviembre de 2026. Canva está
pasando sus "Connect APIs" al **Canva Developers SDK**: los nombres del portal pueden
cambiar un poco; la sustancia es la misma.

---

## Antes de empezar

- [ ] **Una cuenta de Canva de Venduo**, con el mismo correo con el que tienes una
      cuenta en Venduo. Canva pide que el correo con el que entras a Canva tenga cuenta
      en la plataforma que se integra.
- [ ] **Producción despierta.** Canva pide hosting confiable y no gratuito: los
      servicios gratis "se duermen" y dan errores, y Canva puede apagar una integración
      con muchos errores. Supabase gratuito se pausa solo; si el revisor entra con la
      base pausada, la rechazan. Lo ideal es pasar Supabase a Pro antes de enviar; como
      mínimo, revisar que esté activa el día del envío y durante la revisión
      (`npx supabase projects list` no tiene que decir INACTIVE).
- [ ] **Una cuenta de Venduo para el revisor**, en producción, con una tienda y un
      catálogo ya armado llamado "Catálogo de prueba". Nueva, no una tienda de
      demostración. La contraseña se la das a Canva en su formulario: no se escribe en el
      repositorio.

## 1. Crear la integración

En [canva.com/developers](https://www.canva.com/developers) → **Your apps** → crear:

- **App name**: `Venduo`.
- **Who can use your app?**: **Anyone on Canva** (pública). "Restricted to your Canva
  team" solo sirve con plan Enterprise.
- Aceptar los **Canva Developer Terms**.

## 2. Configurarla

En **Outside Canva → Start integrating**, y después:

| Dónde                                 | Qué poner                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Configuration → Integration methods   | Activar **Canva REST APIs**                                                                       |
| Configuration → Scopes                | Solo **design:content → Write**. Nada más: cada permiso hay que justificarlo                      |
| Redirect URLs → URL 1                 | `https://venduo.vercel.app/panel/catalogos/canva`                                                 |
| Redirect URLs → URL 2 (solo mientras) | `http://127.0.0.1:3000/panel/catalogos/canva`, para probar en local. **Quitarla antes de enviar** |
| Configuration → Return navigation     | Apagado                                                                                           |
| Configuration → Credentials           | Copiar el **Client ID** y tocar **Generate secret** (se muestra una sola vez)                     |

## 3. Las claves en Vercel

En Vercel → **Settings → Environment Variables**, para _Production_:

| Variable              | Valor        |
| --------------------- | ------------ |
| `CANVA_CLIENT_ID`     | El Client ID |
| `CANVA_CLIENT_SECRET` | El secreto   |

Son de servidor: nunca con `NEXT_PUBLIC_`. Las mismas en `.env.local` para probar en
local, entrando por `http://127.0.0.1:3000` y no por `localhost`. Después, volver a
desplegar en Vercel.

Cambiar el secreto más adelante desconecta a todas las tiendas: cada una vuelve a
aprobar una vez.

## 4. Probar antes de enviar

Con tu cuenta de Canva (sin aprobación, es la única que puede autorizar). Canva pide que
funcione en todos estos casos:

- [ ] Abrir un catálogo → **Editar en Canva** → aprobar en Canva → queda en su editor con
      el catálogo.
- [ ] Repetirlo: abre directo, sin volver a pedir la aprobación.
- [ ] Con la sesión de Canva abierta y con la sesión cerrada.
- [ ] Con una cuenta de Canva que ya existía y con una recién creada.
- [ ] Desde la app: **Enviar → Más opciones → Canva**.
- [ ] **Desconectar Canva** en `/cuenta`, y que la próxima vez pida aprobar de nuevo.
- [ ] Negar el permiso en Canva: vuelve al catálogo con el aviso y "Llevarlo a mano".

## 5. El listado (Release → App listing details)

Sin enlaces externos en los textos, y revisados de ortografía: Canva lo mira.

**Descripción:**

> Venduo es el sistema para quien vende por WhatsApp, TikTok e Instagram: tienda online,
> stock, pedidos y catálogos en PDF. Con Canva, cada catálogo armado en Venduo se abre en
> tu cuenta de Canva como un diseño editable —textos, fotos y colores— con un solo toque,
> para darle tu toque final y compartirlo.

**Imágenes**: capturas reales del recorrido (el catálogo en Venduo, el botón "Editar en
Canva", el diseño abierto en Canva). Donde se nombre a Canva, seguir su
[guía de marca](https://public.canva.site/our-brand): el nombre escrito "Canva", sin
modificar su logo.

## 6. Instrucciones para el revisor (Release → Testing instructions)

En **Login details**, el correo y la contraseña de la cuenta de prueba. En la
explicación, en inglés:

> Venduo generates a product catalog PDF from the merchant's store (products, prices,
> photos). We use design:content:write only to import that PDF into the user's Canva
> account via the Imports API, then redirect the user to the resulting design's edit
> URL. We do not read, list or modify any other designs.
>
> 1. Log in at https://venduo.vercel.app/login with the test account.
> 2. Go to Panel → Catálogos and open "Catálogo de prueba".
> 3. Click "Editar en Canva" (desktop: menu in the top bar; mobile: Enviar → Más
>    opciones → Canva).
> 4. The first time, authorize Venduo in Canva. The catalog is imported and opens in the
>    Canva editor.
> 5. Repeat step 3: it opens directly, without asking again.
> 6. To disconnect: Cuenta → "Desconectar Canva" (revokes the token in Canva).
>
> Prices in the imported design are a snapshot from the moment it was sent. Venduo is
> free to try for 30 days; no payment is needed to test.

## 7. Enviar

- [ ] Quitar la dirección `127.0.0.1` de Redirect URLs.
- [ ] **Release → App status → Submit app for review**, aceptando los términos.

Lo que pasa después:

- Mientras está en revisión no se puede editar nada. Para cambiar algo, **Cancel
  submission** y volver a enviar (hasta 5 envíos por día).
- Canva abre un ticket y toda la conversación va por ahí. No hay plazo fijo: depende de
  cuánto tengan que pedir.
- Si la aprueban, cualquier tienda puede usar "Editar en Canva" directo. Si piden
  cambios, el ticket dice cuáles.

## Lo que falta en el repositorio

- `.env.example` no tiene `CANVA_CLIENT_ID` ni `CANVA_CLIENT_SECRET`.

---

Fuentes: [Submission checklist](https://www.canva.dev/docs/connect/submission-checklist/),
[Submitting apps](https://www.canva.dev/docs/connect/submitting-integrations/),
[Creating integrations](https://www.canva.dev/docs/connect/creating-integrations/).
