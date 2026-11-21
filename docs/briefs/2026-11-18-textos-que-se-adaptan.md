# Textos de la plantilla que se adaptan a lo que se vende

**Pedido**: "A+B y que inicialmente solo use A de manera predeterminada para todas las
tiendas, pero que desde el panel administrativo pueda activarlo para que sea una
combinación de ambas para x tiendas, y que sea desactivable igual obviamente."

- **A**: textos neutros en las 14 plantillas.
- **B**: la IA reescribe los textos con lo que la persona dijo en "Qué vendes".

**Para quién**: el emprendedor que elige una plantilla pensada para otro producto. Por
ejemplo, una tienda de ropa con Correa, que es de carteras.

**Problema**: los textos de cada plantilla nombran su producto. Una tienda de ropa con
Correa dice en su portada "Carteras para todos los días", "Ver las carteras" y "Por
tamaño", y en "Cómo comprar" dice "Elige tus carteras y su color". Quien compra lee algo
falso, y la tienda parece hecha a medias.

**Sale bien si**:

- **A, para todas y por defecto.** Ninguna plantilla nombra un producto en lo que la
  persona no escribió:
  - las secciones de la portada con las que nace la tienda;
  - las frases fijas del kit ("Cómo comprar" y las demás);
  - la miniatura y los ejemplos.

  Cada plantilla conserva su voz y su personalidad, sin el sustantivo.

- **A llega a las tiendas nuevas y a los textos que siguen tal cual vinieron de la
  plantilla** en las que ya existen. Lo que la persona escribió no se toca, y las
  tiendas de demostración (`@demo.venduo.bo`) quedan como están.
- **B es una función más de `/admin` → Funciones**: "IA: textos a medida". Viene
  desactivada para todas. Se activa en general o por tienda desde su ficha, y se vuelve
  a apagar igual.
- **Con B activa, en una tienda nueva**, la IA escribe al crearla la portada y la frase
  corta, con "Qué vendes". Si la IA falla o tarda, quedan los textos de A y el alta sigue
  sin esperar.
- **Con B activa, en una tienda que ya existe**, le aparece una propuesta: "Adaptamos tus
  textos a lo que vendes". Ve el antes y el después y la aplica o la descarta. Nunca se
  le cambia nada sin que lo vea. Aplicarla guarda una versión del historial, como
  publicar.
- **Lo que reescribe B**: la portada (título, subtítulo, botones y títulos de cada
  sección) y la frase corta de la tienda. Las frases fijas del kit quedan neutras.
- **Apagar B** no deshace lo que ya se aplicó: solo deja de proponer y de escribir.
- **Se impone en el servidor.** Cada llamada a la IA pasa por `permisoDeIa`, y cada
  acción por `exigirFuncion`.

**Dónde**: web primero (alta, editor o Resumen para la propuesta, `/admin`). La app
después de aprobar la web: su alta usa la misma creación de tienda, y la propuesta se le
lleva como en la web.

**No tiene que romper**:

- Lo que la persona ya editó en su portada.
- Las tiendas de demostración.
- El alta, si la IA está caída o apagada.
- El historial de versiones.
- La vista previa del editor.
- La pasarela de plantillas, que dibuja cada una con el nombre de la tienda.

**Fuera de alcance**:

- Que la IA reescriba las frases fijas del kit.
- Elegir una palabra del negocio con fichas (opción C).
- Reescribir los productos o sus descripciones.
- Notificar a la tienda cuando se activa B.

## Decisiones (18/11, después del plan técnico)

- **Qué se neutraliza (A)**: solo el sustantivo de producto —carteras, perfumes, pares,
  prendas, ropa, piezas…— y las frases siempre visibles que dan por hecho el rubro. Se
  quedan las palabras genéricas ("colección", "lo nuevo", "temporada") y los plegables
  que ya salen solo si el producto los usa (el decant, en productos por ml).
- **La frase corta sale de B**: `stores.tagline` no se muestra en ninguna tienda. B
  reescribe solo la portada. Se corrige el texto de Tus datos que dice "Es lo que se lee
  debajo del nombre de tu tienda".
- **La propuesta va en el editor, paso Portada**, donde ya está "Que la IA escriba tu
  portada".
- **B propone solo sobre lo que sigue igual a la semilla**: lo que la persona escribió
  no se le propone cambiar.
- **De fábrica, la función está oculta.** En el alta solo cuenta el estado general: una
  tienda que todavía no existe no se puede activar por su cuenta.
- Las frases fijas del kit son código: cambian también en las tiendas de demostración.
  Las secciones de esas tiendas en la base no se tocan.
- El plan técnico es el del analista. Lo importante:
  - la función empieza apagada aunque falte su fila (`porDefecto`);
  - la migración de esquema va antes que el código;
  - la de los textos compara campo por campo, con igualdad exacta, sin las tiendas
    `@demo` y guardando una versión antes;
  - la propuesta se guarda en `block_edit_proposals` con `origen = 'textos'`.

## Lo que se construye (18/11, decisiones finales del dueño)

Esto manda sobre lo de arriba donde se contradiga.

- **A**: textos neutros para todas. Los textos están en
  `2026-11-18-textos-que-se-adaptan-textos.md`.
- **B se basa en "Qué vendes"** (`stores.description`). La IA primero lo corrige por
  dentro (ortografía y frases cortadas, sin inventar nada) y con eso escribe la portada:
  título, subtítulo, botones y títulos de sección. **Nunca se aplica sola**: se muestran
  el antes y el después, y la persona elige.
- **Al crear la tienda, B corre una vez, siempre**, aunque la función "IA: textos a
  medida" esté apagada.
  - Respeta el interruptor que apaga toda la IA y el tope diario.
  - Va en el paso 3 (`/crear/listo`), primero preparando y después con la propuesta.
  - "Usar estos textos" publica, porque todavía no hay borrador, y guarda una versión.
  - "Dejar los de la plantilla" la descarta.
  - Si la persona se va sin decidir, la propuesta la espera en el editor, paso Portada.
  - En esa primera vez se propone también **la descripción corregida**, que se ve en
    "Sobre la tienda", como una fila más.
- **Después queda apagada para esa tienda.** Solo vuelve a proponer si el administrador
  la activa, en general o para esa tienda. Esa propuesta va en el editor, paso Portada,
  y se aplica al borrador.
- **Los textos aceptados se guardan aparte** (`stores.textos_a_medida`, jsonb por tipo
  de sección y campo).
  - Al cambiar de plantilla con "Empezar con la de X", la nueva usa esos textos en vez de
    los neutros.
  - Con "Conservar la mía" ya se quedan.
  - Lo descartado no se guarda.
- **La frase corta** sale de Tus datos (web, y de la app cuando toque); la columna queda
  sin uso.
- **La app, después de aprobar la web** (anotado en `docs/plan-app-movil.md`):
  - un endpoint para la propuesta del alta, porque la app crea la tienda sin pasar por la
    web;
  - la propuesta en su paso 3 y en su editor;
  - quitar la frase corta de su pantalla de cuenta.

## Tareas

- [x] 1. (Hecha y probada en local; falta producción.) Migración de esquema (`…_textos_a_medida.sql`): la función `ia_textos` oculta;
      `block_edit_proposals.origen` con su índice parcial; `stores.textos_a_medida jsonb`.
      Se comprueba con un test pgTAP. Va a producción **antes** que el código.
- [x] 2. Funciones en TS: `porDefecto` (ia_textos empieza apagada aunque falte su fila),
      en `/admin` y en `permisoDeIa`. Se comprueba en `/admin/funciones` y en la ficha
      de una tienda.
- [x] 3. A en el código: los 14 kits, la miniatura, las pistas del editor, los plegables
      condicionales y `textos.estado` fuera. Se comprueba con un grep de sustantivos y la
      vista a 375 y 1280 px.
- [x] 4. Volver a capturar `public/plantillas/*.webp` y `public/plantillas/celular/*.webp`.
- [x] 5. (Hecha y probada en local: la tienda de demo intacta, la editada solo en lo que no tocó, versiones creadas, idempotente; falta producción.) Migración de datos (`…_textos_neutros.sql`): las semillas y las tiendas con el
      texto idéntico a la semilla, sin las `@demo` y con una versión antes. Se prueba en
      local con una tienda de demo y otra editada.
- [x] 6. La tarea de IA `escribirTextosATuMedida`, con su esquema, su mock,
      `lib/textos-a-medida.ts` (lista cerrada de campos y antes/después) y tests.
- [x] 7. El alta: generar después de `create_store` sin bloquear; la tarjeta en
      `/crear/listo`; usar (publicar, guardar la versión y `textos_a_medida`) o descartar.
- [x] 8. El editor, paso Portada: la tarjeta (pendiente del alta o activada por el
      administrador), aplicar al borrador y guardar `textos_a_medida` al publicar.
- [x] 9. Cambiar de plantilla con "Empezar con la de X" usa `textos_a_medida`.
- [x] 10. La frase corta fuera de Tus datos.
- [x] 11. Documentos: estado, `domain-venduo.md`, `ai-layer.md`, `store-templates.md` y
      `architecture.md`.
