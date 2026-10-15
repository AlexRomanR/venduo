import Link from "next/link"

import { VIGENTE_DESDE } from "@/lib/legal"
import { Apartado, Correo, PaginaLegal } from "@/components/legal/pagina"

export const metadata = {
  title: "Política de privacidad · Venduo",
  description:
    "Qué datos guarda Venduo, para qué, con quién los comparte y cómo borrarlos.",
}

/**
 * La política de privacidad. La piden Google Play, la App Store y Canva.
 *
 * Dice lo que el sistema hace hoy, no lo que podría hacer: si cambia qué se
 * guarda —una tabla nueva con datos de personas, un proveedor nuevo— este
 * texto cambia con él, y también la fecha de `VIGENTE_DESDE`.
 */
export default function Privacidad() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      bajada="Qué datos guardamos, para qué los usamos, con quién los compartimos y cómo puedes borrarlos. Sin letra chica."
      vigente={VIGENTE_DESDE}
    >
      <Apartado numero={1} titulo="Quiénes somos">
        <p>
          Venduo es una plataforma para quienes venden por redes sociales y
          WhatsApp: una tienda online con su stock, sus pedidos, sus
          estadísticas y sus catálogos, en la web y en una app para el celular.
          En esta política, «Venduo» y «nosotros» somos quienes la operamos;
          «tú» eres quien tiene una cuenta para vender, y «quien compra» es
          quien visita una tienda.
        </p>
        <p>
          Para cualquier consulta sobre tus datos escríbenos a <Correo />.
        </p>
      </Apartado>

      <Apartado numero={2} titulo="Lo que guardamos de quien vende">
        <ul>
          <li>
            <strong>Tu cuenta:</strong> tu correo, tu contraseña —guardada
            cifrada, nunca la vemos—, tu nombre y, si la subes, tu foto.
          </li>
          <li>
            <strong>Tu tienda:</strong> su nombre, su descripción, su logo, sus
            colores, el número de WhatsApp donde recibe los pedidos, sus
            productos con sus fotos, precios y stock, sus categorías y sus
            catálogos.
          </li>
          <li>
            <strong>Tus pedidos:</strong> qué se pidió, cuánto, cuándo y en qué
            estado está: pendiente, pagado o cancelado.
          </li>
          <li>
            <strong>Lo que le pides a la inteligencia artificial:</strong> el
            texto de tu pedido y lo que respondió, para que puedas volver atrás
            y para revisar que funcione bien.
          </li>
          <li>
            <strong>Si usas la app:</strong> un identificador de tu teléfono
            para mandarte los avisos que activaste —pedido nuevo, cobros
            pendientes, stock bajo— y su sistema operativo. Las fotos y la
            cámara se usan solo cuando eliges cargar una foto.
          </li>
          <li>
            <strong>Si conectas Canva:</strong> el permiso que Canva nos da para
            llevar tus catálogos a tu cuenta, guardado cifrado.
          </li>
        </ul>
      </Apartado>

      <Apartado numero={3} titulo="Lo que guardamos de quien compra">
        <p>
          <strong>Nada que lo identifique.</strong> Quien compra arma su carrito
          y lo manda al WhatsApp de la tienda; no se registra ni nos deja su
          nombre, su teléfono ni su dirección. El carrito vive en su propio
          navegador. Del pedido guardamos los productos, las cantidades y el
          total, sin datos de la persona.
        </p>
        <p>
          La conversación por WhatsApp es entre quien compra y la tienda: pasa
          por WhatsApp, no por Venduo, y no la vemos.
        </p>
        <p>
          Contamos las visitas a cada tienda sin cookies y sin guardar la
          dirección de red de nadie: con una huella que cambia cada día y no se
          puede cruzar con la del día anterior. Sirve para decirle a la tienda
          cuántas visitas tuvo y de dónde llegaron —WhatsApp, TikTok, Instagram,
          un código QR—. El detalle se guarda 90 días; después, solo el total de
          cada día.
        </p>
        <p>
          Los pedidos anteriores a la compra por WhatsApp pueden tener el nombre
          y el teléfono que quien compró escribió en ese momento.
        </p>
      </Apartado>

      <Apartado numero={4} titulo="Para qué los usamos">
        <ul>
          <li>Para que tu tienda funcione y se vea en internet.</li>
          <li>
            Para que los pedidos lleguen a tu WhatsApp y puedas seguirlos.
          </li>
          <li>Para mostrarte tus ventas, tus visitas y tus estadísticas.</li>
          <li>Para avisarte en el teléfono lo que pediste que te avisemos.</li>
          <li>
            Para cuidar la plataforma: evitar abusos, revisar productos que
            incumplan los <Link href="/terminos">términos</Link> y resolver
            fallas.
          </li>
          <li>Para responderte cuando nos escribes.</li>
        </ul>
        <p>
          <strong>No vendemos tus datos ni los de quien compra</strong>, no
          mostramos publicidad y no usamos herramientas de rastreo o de
          publicidad de terceros.
        </p>
      </Apartado>

      <Apartado numero={5} titulo="Con quién los compartimos">
        <p>
          Solo con los servicios que hacen funcionar Venduo, y solo lo que cada
          uno necesita:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> guarda la base de datos, las cuentas y las
            fotos, en servidores de São Paulo, Brasil.
          </li>
          <li>
            <strong>Vercel</strong> sirve la web y la API, también desde São
            Paulo.
          </li>
          <li>
            <strong>Google (Gemini)</strong> responde lo que le pides a la
            inteligencia artificial: recibe tu pedido y los datos de tu tienda
            que hacen falta para responderlo —por ejemplo, tus ventas por
            producto—. Nunca datos de quien compra.
          </li>
          <li>
            <strong>Expo y Firebase Cloud Messaging</strong> entregan los avisos
            de la app a tu teléfono.
          </li>
          <li>
            <strong>Canva</strong>, solo si tú lo conectas y eliges llevar un
            catálogo: recibe ese catálogo en PDF.
          </li>
        </ul>
        <p>
          Además, lo que publicas en tu tienda —nombre, productos, precios,
          fotos, tu WhatsApp— es público a propósito: es tu vitrina.
        </p>
        <p>
          Podemos entregar datos a una autoridad cuando una orden legal lo
          exija.
        </p>
      </Apartado>

      <Apartado numero={6} titulo="Cookies y lo que se guarda en tu navegador">
        <p>
          Usamos una cookie para mantener tu sesión abierta mientras usas tu
          cuenta. En el navegador de quien compra se guarda su carrito, y en el
          tuyo algunas preferencias del panel, como si la barra lateral está
          plegada. No hay cookies de publicidad ni de analítica.
        </p>
      </Apartado>

      <Apartado numero={7} titulo="Cuánto tiempo los guardamos">
        <p>
          Mientras tu cuenta exista. Si la das de baja —ver{" "}
          <Link href="/borrar-cuenta">cómo borrar tu cuenta</Link>—, tu tienda
          deja de verse en el acto y ya no puedes entrar. A los 90 días borramos
          tu tienda, tus productos, tus categorías y tus catálogos, y vaciamos
          tu nombre, tu foto y el WhatsApp de tu tienda. Lo borrado queda
          marcado como tal: nadie lo ve ni se usa para nada.
        </p>
      </Apartado>

      <Apartado numero={8} titulo="Tus derechos">
        <p>Puedes, en cualquier momento:</p>
        <ul>
          <li>
            <strong>Ver y corregir</strong> tus datos desde tu cuenta, en «Mi
            cuenta».
          </li>
          <li>
            <strong>Llevártelos:</strong> pídenos una copia de tu tienda, tus
            productos y tus pedidos.
          </li>
          <li>
            <strong>Borrarlos</strong>, dando de baja tu cuenta.
          </li>
          <li>
            <strong>Apagar los avisos</strong> del teléfono, uno por uno, desde
            la app.
          </li>
          <li>
            <strong>Desconectar Canva</strong> desde «Mi cuenta».
          </li>
        </ul>
        <p>
          Para lo que no puedas hacer tú desde tu cuenta, escríbenos a{" "}
          <Correo /> desde el correo de tu cuenta. Te respondemos en un plazo
          máximo de 15 días.
        </p>
      </Apartado>

      <Apartado numero={9} titulo="Cómo los cuidamos">
        <p>
          Todo viaja cifrado. Cada tienda solo puede ver lo suyo: lo impone la
          base de datos, no solo la pantalla. Los permisos de Canva se guardan
          cifrados. Ninguna clave de nuestros servidores viaja a la app ni al
          navegador. Ningún sistema es infalible: si alguna vez tus datos se
          vieran expuestos, te avisaremos por correo.
        </p>
      </Apartado>

      <Apartado numero={10} titulo="Menores de edad">
        <p>
          Venduo es para mayores de 18 años. No abrimos cuentas a menores a
          sabiendas; si sabes de una, escríbenos y la damos de baja.
        </p>
      </Apartado>

      <Apartado numero={11} titulo="Si cambiamos esta política">
        <p>
          Publicamos la nueva versión aquí, con su fecha. Si el cambio afecta
          cómo usamos tus datos, te lo decimos antes por correo o en tu panel.
        </p>
      </Apartado>
    </PaginaLegal>
  )
}
