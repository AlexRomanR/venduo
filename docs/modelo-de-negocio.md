# Modelo de negocio

El modelo vigente de Venduo, decidido el 17 de septiembre de 2026. **Reemplaza al
anterior**, donde el negocio fijaba el precio final, cada negocio tenía su tienda online y
el ingreso de la plataforma era una suscripción.

Quien vende para un negocio sin ser parte de él se llama **promotor**. En la base de datos
sigue diciendo `seller` y `vendedor` —el enum del rol, las columnas, las rutas—, pero en
pantalla y en los documentos se dice promotor.

Este documento manda sobre cualquier otro cuando se trate de quién cobra qué. Las reglas
para escribir código salen de acá y están en `.agents/rules/domain-venduo.md`.

---

## 1. Qué cambió, en una tabla

| Tema                     | Modelo anterior                                  | Modelo vigente                                                          |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------- |
| Precio                   | Lo fijaba el negocio                             | El negocio declara un **costo base**; la plataforma construye el precio |
| Comisión del vendedor    | Un porcentaje por tienda, elegido por el negocio | **Escalonada por rango de precio**, igual para todos                    |
| Ingreso de la plataforma | Suscripción mensual del emprendedor              | **Take-rate** sumado al precio. Sin suscripción                         |
| Canal                    | Una tienda online por negocio, con su plantilla  | **Un solo Marketplace**                                                 |
| Alta del vendedor        | Se sumaba a una tienda, a veces con aprobación   | Elige cualquier producto del catálogo, sin aprobación                   |
| Comprador referido       | La atribución valía para esa compra              | El comprador **queda asociado al promotor** por una ventana de tiempo   |
| Custodia del pago        | PagoFácil retiene hasta la entrega               | Igual, y ahora el reparto es a **tres** partes                          |

---

## 2. Los dos segmentos

**Jóvenes de 16 a 28 años** —estudiantes, técnicos, buscadores de primer empleo— con Bs 0
de capital, tiempo disponible y redes sociales activas, pero ningún producto propio que
vender.

**Microempresas y productores locales** con capacidad de producción ociosa y sin canal
digital efectivo, que no pueden pagar publicidad por adelantado.

Son interdependientes: cada problema es la solución del otro.

---

## 3. Qué recibe cada uno

### El joven

- Una **comisión calculada automáticamente** sobre el costo base que declaró el negocio. El
  porcentaje varía según el rango de precio del producto, para que la ganancia sea
  proporcional y factible tanto en un producto de Bs 40 como en uno de Bs 2.000.
- **Sin invertir capital ni cargar inventario.**
- Cuando lleva **por primera vez** a un comprador a la plataforma con su enlace, ese
  comprador **queda asociado a él**. Si más adelante ese comprador compra por su cuenta en
  el Marketplace, el joven cobra una **comisión indirecta**.
- Y lo de siempre: un historial de ventas verificable, que es su primer antecedente
  laboral.

### El negocio

- **Declara solo su costo base.** No calcula márgenes, no fija precio final, no negocia
  porcentajes: el sistema arma el precio sumando la comisión del vendedor y el take-rate,
  los dos escalados por rango.
- **Costo 100% variable**, condicionado a venta cerrada. Sin publicidad por adelantado.
- Las ventas del Marketplace a compradores **sin promotor asociado** le devuelven el
  componente de comisión: paga comisión solo cuando alguien le trajo la venta.

---

## 4. El precio se construye, no se fija

```
precio final  =  costo base  +  comisión del vendedor  +  take-rate
                 └ del negocio    └ % por rango            └ % por rango
```

Es un modelo **aditivo**: los porcentajes se suman sobre el costo base, no se descuentan de
un precio ya puesto. El negocio recibe su costo base completo, sin importar quién vendió.

Tres consecuencias que el código tiene que respetar:

1. **El negocio nunca escribe un precio final.** Declara `costo base`; el precio lo calcula
   el servidor con la tabla vigente.
2. **Los tres componentes se congelan al crear el pedido**: el costo base, los dos
   porcentajes y los tres montos. Cambiar la tabla mañana no reescribe una venta de hoy.
3. **La suma de las partes es exactamente el total.** Cada componente se redondea al
   centavo y el precio final es su suma, nunca un redondeo aparte: si no, el reparto no
   cierra.

### La tabla de rangos

Los rangos se miden sobre el **costo base**, que es el único valor que existe antes de
calcular. **Están sembrados en `pricing_tiers`** con estos valores: son los que usa el
sistema hoy, y cambiarlos es escribir una migración, no editar este documento.

| Costo base (Bs) | Comisión del vendedor | Take-rate | Comisión indirecta |
| --------------- | --------------------- | --------- | ------------------ |
| Hasta 50        | 25%                   | 10%       | 10%                |
| 51 – 200        | 20%                   | 8%        | 8%                 |
| 201 – 600       | 15%                   | 6%        | 6%                 |
| 601 – 1.500     | 12%                   | 5%        | 5%                 |
| Más de 1.500    | 8%                    | 4%        | 3%                 |

Ejemplo con costo base Bs 100: comisión Bs 20, take-rate Bs 8, **precio final Bs 128**. Si
la trae un joven, cobra Bs 20; el negocio recibe Bs 100; Venduo, Bs 8.

Por qué baja el porcentaje cuando sube el precio: un 25% sobre Bs 40 son Bs 10, que vale el
esfuerzo de una venta; el mismo 25% sobre Bs 2.000 son Bs 500, que ningún negocio acepta y
que dejaría el producto fuera de precio.

**La comisión indirecta nunca supera a la del vendedor**, y la diferencia vuelve al
negocio.

---

## 5. Quién cobra la comisión en cada venta

El componente de comisión **siempre está dentro del precio**. Lo que cambia es quién lo
recibe:

| Cómo llegó la venta                                            | Comisión del vendedor        | Vuelve al negocio  |
| -------------------------------------------------------------- | ---------------------------- | ------------------ |
| Por el enlace de un joven                                      | Completa, al joven           | —                  |
| Compra directa, comprador asociado a un promotor y vigente     | **Comisión indirecta**, a él | La diferencia      |
| Compra directa, sin promotor asociado o con la ventana vencida | —                            | Todo el componente |

**El comprador paga lo mismo en los tres casos.** Es lo que hace que el precio del
Marketplace sea uno solo y no dependa de por dónde entró cada quien.

### La atribución del comprador

- Se crea cuando un comprador **llega por primera vez** con el enlace de un joven y compra.
- **Vence por tiempo.** Propuesta pendiente de confirmar: **90 días** desde que se creó.
  Vencida, la comisión vuelve al negocio.
- **El primero que lo trajo manda.** Si otro joven comparte el mismo producto después, no
  reemplaza la atribución vigente.
- **Se reconoce al comprador por su teléfono**, normalizado, mientras no tenga cuenta. Ya
  es obligatorio para coordinar la entrega, no se comparte entre personas como sí pasa con
  un correo familiar, y es el dato que alguien vuelve a escribir igual en la segunda
  compra. Si más adelante hay cuentas de comprador, mandan ellas.

---

## 6. El cobro: custodia y reparto a tres

Se mantiene lo ya decidido, con un destinatario más.

El comprador le paga a **PagoFácil**, que **retiene** el dinero. Cuando el negocio marca el
pedido enviado y el comprador confirma que lo recibió —o vence el plazo—, Venduo ordena la
liberación y PagoFácil **dispersa en un solo reparto**:

| Quién      | Cuánto                           |
| ---------- | -------------------------------- |
| El negocio | El costo base                    |
| El joven   | Su comisión, directa o indirecta |
| Venduo     | El take-rate                     |

**Venduo no retiene fondos de terceros**: recibe su take-rate como un beneficiario más del
reparto y nunca es titular de la plata del negocio ni del joven. Eso es lo que lo mantiene
fuera de la figura regulada de intermediación de pagos (`VENDUO.md` §5).

El costo de PagoFácil sale de la parte del negocio, nunca de la del joven.

Si el comprador reclama antes de la liberación, el pedido queda `en_disputa` y el pago
congelado hasta que Venduo resuelva.

---

## 7. Cómo se sostiene cada pieza

**Canal:** uno solo, la plataforma. El negocio se registra y publica su costo base; el
joven descubre el catálogo, elige un producto y lo vende con su enlace; el comprador
también puede comprar directo en el Marketplace.

**Relación:** autoservicio de los dos lados. El joven no espera aprobación de nadie y el
negocio no fija precios ni administra vendedores.

**Ingreso:** el take-rate, y nada más. **La comisión del vendedor no es ingreso de la
plataforma**: es un costo que pasa del negocio al joven a través del sistema. Contabilizarla
como ingreso sería inflar la facturación con plata ajena.

**Actividades clave:**

1. Registrar negocios y verificar la información básica del producto y su costo base.
2. Mantener el catálogo disponible para que los jóvenes elijan.
3. Calcular comisión y take-rate según el rango.
4. Registrar y mantener la atribución de compradores.
5. Resolver, en cada compra directa, si corresponde comisión indirecta o retorno al negocio.
6. Cobrar y repartir entre los tres.

**Asociación indispensable:** el procesador de pagos. Sin dispersión automática no hay
forma de calcular y entregar la comisión sin trabajo manual, y ese trabajo manual rompe la
propuesta de valor de los dos lados. No es reemplazable.

---

## 8. Decisiones abiertas

Ninguna bloquea empezar a construir; todas bloquean operar con dinero real.

| #   | Decisión                                                                                                    | Estado                                                          |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | **La tabla de rangos**: los cortes y los tres porcentajes                                                   | **Sembrada** con la propuesta de §4; cambiarla es una migración |
| 2   | **La ventana de atribución**: cuántos días                                                                  | Se propone 90                                                   |
| 3   | ~~Cómo se reconoce a un comprador~~                                                                         | **Decidido: su teléfono, normalizado**                          |
| 4   | **El plazo de liberación automática** si el comprador no confirma                                           | Se propone 7 días                                               |
| 5   | **Qué pasa si el negocio nunca marca el pedido enviado**                                                    | Sin resolver                                                    |
| 6   | Con PagoFácil: si retiene y libera por orden de Venduo, si admite al joven como beneficiario y qué le exige | Sin confirmar                                                   |
| 7   | **Costo base mínimo y máximo**, para que la comisión de un producto de Bs 5 no sea absurda                  | Sin resolver                                                    |

---

## 9. Qué queda fuera del modelo

- **La tienda online por negocio y su sistema de plantillas.** El canal es el Marketplace.
  El código construido (`docs/store-templates.md`) sigue en el repositorio y funciona, pero
  ya no es parte del producto: qué se hace con él es una decisión pendiente.
- **La suscripción.** El único ingreso es el take-rate.
- **Que el negocio fije precios o porcentajes.**
- **La aprobación de vendedores**, los códigos de invitación y el vínculo del joven con una
  tienda en particular.

Y sigue fuera lo que ya estaba: multi-negocio por usuario, gestión de envíos, que Venduo
reciba o guarde el dinero de una venta, notificaciones por correo, app móvil nativa y tests
automatizados.
