import Link from "next/link"

import { VIGENTE_DESDE } from "@/lib/legal"
import { Apartado, Correo, PaginaLegal } from "@/components/legal/pagina"

export const metadata = {
  title: "Términos de uso · Venduo",
  description:
    "Las reglas para usar Venduo: qué hacemos nosotros, qué haces tú y qué no se puede vender.",
}

/**
 * Los términos de uso. Los pide Canva para su integración, y las tiendas de
 * apps los enlazan desde la ficha.
 *
 * Como la política de privacidad, describen el producto tal como es: que el
 * pago y la entrega se acuerdan por WhatsApp y que Venduo no es parte de la
 * venta. Si eso cambia en `VENDUO.md`, cambia acá.
 */
export default function Terminos() {
  return (
    <PaginaLegal
      titulo="Términos de uso"
      bajada="Las reglas para usar Venduo: qué hacemos nosotros, qué haces tú y qué no se puede vender."
      vigente={VIGENTE_DESDE}
    >
      <Apartado numero={1} titulo="Qué es Venduo">
        <p>
          Venduo te da una tienda online y las herramientas para manejarla: tu
          stock, tus pedidos, tus estadísticas, tus catálogos en PDF y una app
          para el celular. Quien compra arma su carrito en tu tienda y te lo
          manda por WhatsApp; el pago y la entrega los acuerdan entre ustedes.
        </p>
        <p>
          Al crear una cuenta aceptas estos términos y la{" "}
          <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </Apartado>

      <Apartado numero={2} titulo="Tu cuenta">
        <ul>
          <li>Tienes que ser mayor de 18 años.</li>
          <li>
            Una cuenta es de una persona y tiene una tienda. Cuida tu
            contraseña: lo que se haga con tu cuenta es responsabilidad tuya.
          </li>
          <li>
            Los datos que cargues tienen que ser verdaderos, empezando por el
            WhatsApp de tu tienda, que es donde te llegan los pedidos.
          </li>
        </ul>
      </Apartado>

      <Apartado numero={3} titulo="Venduo no es parte de tus ventas">
        <p>
          La venta es entre tú y quien te compra. Venduo no cobra ni recibe
          pagos por ti, no hace envíos y no interviene en lo que acuerdan. Por
          eso eres tú quien responde por:
        </p>
        <ul>
          <li>Lo que vendes, su calidad y que sea lo que mostraste.</li>
          <li>Tus precios, tu stock y cumplir lo que prometes.</li>
          <li>Los cobros, las entregas, los cambios y las devoluciones.</li>
          <li>
            Cumplir las leyes que te toquen por vender, incluidas las
            tributarias.
          </li>
        </ul>
        <p>
          Venduo calcula el total de cada pedido con los precios de tu catálogo,
          pero el precio final lo acuerdas tú en la conversación.
        </p>
      </Apartado>

      <Apartado numero={4} titulo="Lo que no se puede vender ni publicar">
        <ul>
          <li>Lo que sea ilegal en Bolivia, o robado.</li>
          <li>Armas, drogas, medicamentos que necesitan receta.</li>
          <li>Falsificaciones o copias que se hacen pasar por originales.</li>
          <li>Contenido sexual, violento o que discrimine.</li>
          <li>
            Fotos, marcas o textos de otros que no tienes permiso para usar.
          </li>
          <li>Engaños: productos que no existen, precios que no son.</li>
        </ul>
        <p>
          Si un producto incumple estas reglas podemos ocultarlo de tu tienda, y
          si la falta es grave o se repite, pausar tu tienda o dar de baja tu
          cuenta. Cuando podamos, te avisamos el motivo.
        </p>
      </Apartado>

      <Apartado numero={5} titulo="Tu contenido">
        <p>
          Lo que subes —fotos, textos, tu logo— sigue siendo tuyo. Nos das
          permiso para guardarlo, mostrarlo en tu tienda, en tus catálogos y en
          la app, y adaptarlo a cada pantalla, solo para que el servicio
          funcione. Ese permiso termina cuando lo borras o das de baja tu
          cuenta.
        </p>
      </Apartado>

      <Apartado numero={6} titulo="La inteligencia artificial">
        <p>
          Venduo puede proponerte cambios en tu tienda, armar catálogos o
          responder preguntas sobre tus ventas con inteligencia artificial. Lo
          que propone es eso, una propuesta: nada se aplica sin que lo
          confirmes, y te toca revisar que sea correcto antes de usarlo. Puede
          equivocarse.
        </p>
      </Apartado>

      <Apartado numero={7} titulo="Canva, TikTok y otros servicios">
        <p>
          Si conectas tu cuenta de Canva, llevamos a Canva los catálogos que
          elijas. Lo que hagas en Canva se rige por sus propios términos. Puedes
          desconectarla cuando quieras desde «Tus datos».
        </p>
        <p>
          Si conectas tu cuenta de TikTok, publicamos en ella solo lo que tú
          revisas y confirmas, con las opciones que eliges. Lo que publicas en
          TikTok se rige por sus{" "}
          <a href="https://www.tiktok.com/legal/terms-of-service">
            términos de servicio
          </a>{" "}
          y sus{" "}
          <a href="https://www.tiktok.com/community-guidelines">
            normas de la comunidad
          </a>
          , y eres responsable de que cumpla con ellas. Puedes desconectarla
          cuando quieras.
        </p>
      </Apartado>

      <Apartado numero={8} titulo="Prueba, planes y suscripción">
        <p>
          Cada tienda empieza con un período de prueba. Si al terminar hay un
          plan de pago, te decimos su precio antes, y nunca cobramos sin que lo
          aceptes. Si la prueba o la suscripción vence, tu tienda deja de verse
          y tu panel queda en solo lectura, con la opción de descargar tus
          datos.
        </p>
      </Apartado>

      <Apartado numero={9} titulo="Disponibilidad">
        <p>
          Hacemos lo posible para que Venduo funcione siempre, pero puede haber
          cortes, fallas o cambios en las funciones. El servicio se ofrece tal
          como está. No respondemos por ventas perdidas, por lo que pase entre
          tú y quien compra, ni por fallas de servicios de terceros como
          WhatsApp o tu proveedor de internet. Nada de esto limita lo que la ley
          no permite limitar.
        </p>
      </Apartado>

      <Apartado numero={10} titulo="Dar de baja tu cuenta">
        <p>
          Puedes dar de baja tu cuenta cuando quieras, desde en la web o en la
          app. Qué pasa con tus datos está en{" "}
          <Link href="/borrar-cuenta">cómo borrar tu cuenta</Link>.
        </p>
      </Apartado>

      <Apartado numero={11} titulo="Cambios y ley aplicable">
        <p>
          Si cambiamos estos términos publicamos la nueva versión aquí, con su
          fecha, y te avisamos antes si el cambio te afecta. Estos términos se
          rigen por las leyes del Estado Plurinacional de Bolivia.
        </p>
        <p>
          Dudas o reclamos: <Correo />.
        </p>
      </Apartado>
    </PaginaLegal>
  )
}
