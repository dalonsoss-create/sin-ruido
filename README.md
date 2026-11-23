# Sin Ruido — tu periódico, tus reglas

Prototipo personal de agregador RSS (0 €): muestra titulares seleccionados y enlaza directamente al medio de origen. Sin cuentas de lector, anuncios, rastreo ni API de pago.

## Probar la web
Página: https://dalonsoss-create.github.io/sin-ruido/

1. Selecciona tus **temas** y añade **asuntos vetados**.
2. En **Mis fuentes**, activa o desactiva individualmente los RSS consultados. La selección de fuentes es personal: no detiene la recopilación general.
3. Pulsa **⚙ Personalizar → Añadir periódico** y escribe el **nombre** de un medio del catálogo o pega la **web** de uno nuevo (por ejemplo, `elcorreodepozuelo.com`). El lector busca automáticamente un RSS público y, si responde, incorpora esa fuente a su edición personal sin pedirle que busque el RSS ni pasar por GitHub. Si un medio no publica RSS accesible o bloquea la consulta, se explica en la misma pantalla.
4. **Compartir periódico** envía la URL. Elena puede abrirla en otro móvil o navegador y guardar sus propios filtros, totalmente independientes; la configuración se guarda solo en **localStorage** y no se sincroniza.
5. Cualquier titular puede ocultarse con «No me interesa».

## Añadir medios propios sin complicaciones
- Se ha incorporado **El Correo de Pozuelo** (RSS de WordPress `https://elcorreodepozuelo.com/feed/`) y **Diario de Pozuelo** al catálogo común. Cuando hay muchos titulares, `scripts/actualizar.py` reserva hasta cinco noticias recientes por medio antes de rellenar el límite de 900; la página sigue mostrando solo las noticias de hoy.
- En **Personalizar → Añadir periódico**, basta con escribir el nombre de un medio conocido. Si es nuevo, hay que pegar la dirección de su web, **no** la dirección del RSS. En el navegador se prueban rutas comunes `/feed/`, `/rss/`, etc., con el servicio público `rss2json.com`; se valida la respuesta antes de guardar el medio.
- Los medios añadidos de esta forma son **personales de ese navegador**, hasta 15 fuentes, se pueden quitar, se actualizan al entrar y luego periódicamente, y sus titulares se incorporan a la portada normal. No pasan a ser fuentes globales ni se comparten entre móviles, porque todavía no existe una cuenta de usuario ni un servicio central para ello.
- **Limitaciones del prototipo**: no todos los periódicos publican un RSS público; algunos lo bloquean o no responden a `rss2json.com`. La API externa tiene límites de uso y disponibilidad, consulta una dirección pública por petición y puede conocer la IP del lector. Sin un backend propio, **no puede garantizarse el alta de cualquier periódico solamente por su nombre** ni un servicio fiable para millones de lectores. Para producción conviene un backend propio de descubrimiento/cache (por ejemplo, Cloudflare Workers), verificación de dominio y controles de abuso.
- El panel **Personalizar** se abre como cajón sobre el periódico tanto en escritorio como en móvil.

## Diseño e imágenes
La portada utiliza diseño editorial de periódico, destacados, tipografía serif y bloques visuales. El código ya admite fotos RSS por noticia en `image`. **Las fotos de periódicos NO están activadas**: todas las fuentes tienen `images_allowed: false` hasta verificar derechos de reproducción de cada medio. Las ilustraciones degradadas con símbolos son parte del diseño y no copian imágenes de terceros.

## Actualizaciones RSS
- Catálogo de medios y secciones: `docs/fuentes.json` (cada RSS tiene `id`, `name`, `category`, `url` e `images_allowed`).
- Procesador: `scripts/actualizar.py`.
- Resultado actualizado: `docs/noticias.json` incluye titulares, enlaces, fuente concreta, estado de cada RSS y fecha de consulta.
- GitHub Actions: `.github/workflows/actualizar.yml`. Comprueba las fuentes cada media hora (a los minutos 07 y 37 de cada hora, UTC, las 24 horas) y al modificar el catálogo o el procesador (la ejecución puede retrasarse por GitHub). También se puede ejecutar manualmente.
- Un RSS puede fallar temporalmente. No se inventan noticias, y solo se conservan titulares de hasta 72 horas.

## Publicación (GitHub Pages)
Settings → Pages → Deploy from a branch → main → /docs → Save.

## Legal y comercial
Este repositorio es una prueba personal, no un negocio en producción. Reproducir titulares e imágenes en un agregador público puede requerir autorización según la Ley de Propiedad Intelectual española y las condiciones de cada feed. Antes de ampliar y comercializar: revisar licencias, privacidad y acuerdos con medios. GitHub Pages tampoco debe utilizarse como alojamiento de un servicio comercial completo.

## ¿No puedes leer un artículo por un muro de pago?
Los titulares abren el periódico en una pestaña nueva. Sin Ruido **no puede detectar desde otra web** si cada artículo individual está bloqueado ni modificar su página. Para los medios con tarifas verificadas, Sin Ruido muestra debajo del titular el botón **«¿Te pide suscripción? Ver precio»**: al pulsarlo aparece un panel con el precio público consultado, las condiciones relevantes, la fecha de comprobación y enlaces oficiales para contratar y revisar la tarifa. Los datos están en `docs/suscripciones.json`; hay que actualizarlos si cambian los precios. Ningún botón cobra por usar Sin Ruido.

## Importancia y enfoque positivo
La ordenación por defecto **«Importancia + optimismo»** tiene en cuenta las prioridades de temas del usuario, palabras indicativas de impacto, actualidad y un bonus moderado a noticias constructivas. Las noticias graves siguen apareciendo si son relevantes; no se altera el contenido del titular.

El control **☀️ Solo positivas**, visible incluso en móvil, muestra exclusivamente titulares que las reglas automáticas identifican como probablemente positivos. Se guarda en el navegador y funciona de forma independiente para cada usuario. Si hay cero coincidencias, la portada lo indica. **Advertencia:** es un filtro heurístico y puede equivocarse o dejar fuera alguna noticia buena; no hace lectura semántica completa de los artículos ni requiere API de pago. El orden «Más recientes» sigue disponible para quien lo prefiera.

## Portada breve y aprendizaje de intereses (v2)
- La portada muestra **20 noticias** por defecto (1 destacada y hasta 19 adicionales); el botón **Cargar 20 noticias más** añade otro bloque de 20. Cambiar de categoría, filtro, fuente u orden reinicia la vista a 20.
- Se guarda un **perfil de lectura solo en el navegador** (`localStorage: sinruido-learning-v1`), independiente de las preferencias manuales. Cada clic en el titular o el enlace «Leer» suma una muestra de intereses por categoría, fuente y palabras relevantes del titular, con un historial máximo de 100 clics. No se registran tiempos de lectura ni datos identificativos, ni se envían estos clics a GitHub.
- El algoritmo prioriza temas y expresiones similares, pero el aumento está limitado para no ocultar noticias importantes ni anular el criterio positivo. La ordenación «Más recientes» mantiene estrictamente la fecha.
- En **Tu perfil de lectura** se muestran los temas abiertos con más frecuencia; **Borrar lo aprendido** elimina ese historial sin borrar filtros ni fuentes. Las preferencias no se comparten entre Safari, navegadores distintos o un acceso directo que tenga almacenamiento separado.


## Bienvenida para Elena, amigos y nuevos lectores
- Enlace normal, para lectores que ya han configurado el periódico: https://dalonsoss-create.github.io/sin-ruido/
- Enlace de invitación: https://dalonsoss-create.github.io/sin-ruido/?bienvenida=1
- Un lector nuevo recibe una presentación y elige sus **temas, fuentes RSS disponibles, personajes/asuntos vetados** y si quiere **solo noticias positivas**. No necesita cuenta ni registros de pago.
- El inicio es deliberadamente **neutral**: ya no aplicamos por defecto los vetos personales del creador a los nuevos lectores. Quien ya tenía preferencias guardadas las mantiene. La bienvenida también se puede volver a abrir desde **«Configurar mi periódico paso a paso»**.
- El botón «Compartir periódico» genera el enlace de bienvenida para nuevos lectores.

## Portada equilibrada y estado de lectura
- En la portada general, **el primer bloque de 20 noticias intenta reservar al menos un titular de cada tema activado**, siempre que exista alguno reciente que no esté excluido por las fuentes, vetos y opciones del lector. Los restantes se ordenan por relevancia, optimismo e intereses aprendidos. Las pestañas por tema permiten abrir una sección directamente.
- Al abrir el título o pulsar «Leer», se guarda ese enlace en el navegador (`sinruido-seen-v1`, limitado a 800 URL) y aparece **✓ YA ABIERTO** con un cambio de color. Esta marca indica que se abrió el enlace, no que se terminó de leer el artículo.
- El historial de clics del algoritmo se cuenta una sola vez por URL para evitar reforzar artificialmente un único titular. No se transmiten datos personales ni historiales a GitHub.


## Medios sin duplicados y actualización al volver a la app
- **Todos los lectores nuevos** ven los 22 temas y los medios del catálogo vigente, incluido **Diario de Pozuelo**. Las selecciones se guardan por navegador y no se copian los filtros de otro lector.
- El formulario y la barra lateral agrupan los RSS por nombre de medio: **EL PAÍS aparece una sola vez aunque agregue 6 secciones**. Al marcar/desmarcar un medio se activan/desactivan sus RSS. En **«Ver secciones RSS»** es posible consultar las secciones, enlaces RSS y estado y afinar por cada sección si se desea.
- El enlace de invitación sigue siendo https://dalonsoss-create.github.io/sin-ruido/?bienvenida=1 .
- **Noticias:** en cada carga de la web se consulta `noticias.json`; además, se comprueba si hay una edición más reciente en GitHub al volver a la pestaña o a la app, recuperar una página desde caché y cada 5 minutos mientras está abierta. Esto **no descarga RSS en cada clic**: el RSS se actualiza mediante GitHub Actions cada 30 minutos, con posibles retrasos (sujeta a retrasos de GitHub y fallos de feed).
- **Código y diseño:** las versiones del sitio se actualizan al completarse el despliegue de GitHub Pages. Si una app instalada permanece abierta en segundo plano, puede ser necesario cerrarla y volver a abrirla para aplicar una versión nueva de la interfaz.


## Intereses en lenguaje natural (versión experimental)
- En **«✨ Dime qué noticias quieres»** se puede escribir una petición en español sin conocer nuestros 22 temas: por ejemplo, `Solo noticias de política catalana`, `Solo noticias de sucesos en Madrid`, `Me interesan los avances sobre inteligencia artificial`, `Solo noticias del Real Madrid` o un nombre concreto. Se admite **una petición por línea**.
- Una frase con **«solo», «solamente» o «exclusivamente»** filtra los titulares de manera estricta; varias frases exclusivas separadas por salto de línea funcionan como alternativas. **«Me interesa...»** concede prioridad a esas noticias y puede activar la categoría implicada sin ocultar todas las demás.
- La interpretación relaciona texto con **categorías, regiones (Cataluña, Madrid, Andalucía, etc.), clubes, personas y palabras del titular/enlace**, sin llamadas a IA de pago ni servicios externos. Cuando un canal RSS trae una **ubicación declarada**, también se usa para reconocer noticias locales aunque el municipio no aparezca en el titular.
- El campo se ofrece **en la bienvenida** y en el panel permanente; se guarda únicamente en las preferencias locales de ese navegador. No modifica filtros de otros usuarios.
- Limitación: **NO es comprensión universal del lenguaje natural**. Las reglas se ampliarán a partir de las pruebas; algunas frases ambiguas o complejas pueden fallar. Si no hay noticias recientes que coincidan, se informa y no se rellena con noticias irrelevantes.
- Para mejorar la cobertura local, se han añadido los canales oficiales de **Sucesos en Madrid** de El Diario de Madrid y Madridiario, pendientes de confirmar que entreguen titulares mediante el actualizador.


## Noticias de HOY, actualización y guardados (nueva versión)
- La portada general muestra **solo noticias publicadas durante el día actual en horario de Madrid**, aunque el recopilador conserve material anterior para recuperar fallos temporales de RSS. No se usan noticias de ayer para rellenar huecos. A medianoche se recalcula la vista.
- El recopilador está programado para comprobar los RSS **cada 30 minutos, las 24 horas del día** (48 intentos diarios). GitHub Actions puede iniciar tareas con retraso, y algún RSS puede fallar; no hay promesa de actualización instantánea.
- El botón **↻ Actualizar noticias**, y el gesto de tirar hacia abajo desde la parte superior en móvil, descargan **la edición más reciente publicada** (no ejecutan en vivo la recolección de los medios). Se informa si hay cambios o si seguimos con la misma edición.
- Bajo cada titular hay un enlace **↗ WhatsApp** para compartir el título, la cabecera y el enlace original; no se envían imágenes de terceros.
- **☆ Guardar** almacena un máximo de 150 enlaces con titular, cabecera, tema y fecha en el navegador (`localStorage: sinruido-bookmarks-v1`). La pestaña **🔖 Guardadas** permite revisarlos otro día, también cuando ya no estén en la portada. El mismo botón permite quitar el guardado. No se sincronizan entre navegadores, móviles, instalaciones PWA o cuentas; no existe servidor de cuentas.
- El texto libre de intereses acepta varias frases por línea y expresiones de preferencia, exclusión y «solo». Su intérprete gratuito es **heurístico**, no inteligencia semántica universal: para comprender *cualquier* petición con fiabilidad sería necesario un modelo de lenguaje o servicio adicional, sujeto a estudio de coste y privacidad.


## Ilustraciones exclusivas y lectura con «Ya vista» (noviembre 2026)

- La portada vuelve a usar **exclusivamente ilustraciones SVG propias**. La función que consultaba fotografías externas está desactivada y el interruptor de fotos se ha retirado. El antiguo fichero `docs/fotos.js` se conserva sin cargar para archivo, pero no se ejecuta. Los dibujos se generan en `docs/ilustraciones.js` con nuevos símbolos (18 motivos añadidos), seis composiciones, paletas y variaciones por titular: no se repite exactamente el mismo SVG en 20 titulares distintos.
- Cada tarjeta de portada dispone de un botón **redondo ✓ abajo a la derecha, dentro de la ilustración**. Es una acción voluntaria: pulsarlo marca el titular como **Ya vista** y lo retira de la portada de hoy y de los destacados de ayer. **Abrir el enlace no activa este botón**, no retira nada; el indicador previo «YA ABIERTO» sigue siendo independiente.
- Las noticias retiradas se conservan en una nueva sección **✓ Ya vistas**, desde donde el mismo botón permite **↶ Recuperar** individualmente, o recuperar todas con confirmación. Si la noticia sigue siendo de hoy volverá a la portada; si ya es antigua, permanece disponible en este historial hasta que el usuario la recupere.
- El historial separado se conserva **solo en ese navegador** (`localStorage: sinruido-reviewed-v1`, máximo 700 entradas). No se sincroniza entre dispositivos; **no es lo mismo que «☆ Guardar»**.
- Marcar varias permite avanzar por la edición; el espacio que dejan se rellena con otros titulares de los medios seleccionados si los hay. Si ya no quedan titulares nuevos, la portada muestra un estado de «¡Estás al día!». La lectura no se rastrea ni se comparte con el servidor.

## Últimas noticias y frecuencia de refresco (noviembre 2026)

- El agregador RSS común se ha programado con GitHub Actions **a los minutos 07 y 37 de todas las horas, UTC** (`.github/workflows/actualizar.yml`), es decir, **48 revisiones programadas al día**. Las ejecuciones no son estrictamente puntuales: pueden demorarse, fallar o incluso omitirse por límites/carga de GitHub. Las fuentes individuales también pueden publicar tarde.
- La página comprueba si hay una edición nueva **al entrar, al recuperar el foco y cada cinco minutos mientras está abierta**. Eso **no fuerza** una nueva consulta a los periódicos, que ocurre en el proceso programado. Para consultas más puntuales y garantías reales a gran escala hará falta un backend dedicado con caché y supervisión.
- La franja superior **«Últimas noticias»** muestra **un solo titular real** de los periódicos elegidos por el lector, sin repetir ese titular debajo en la portada. Respeta temas, vetos, fuentes personales, búsqueda y los botones «Ya vista». Solo selecciona noticias publicadas hace **menos de 3 horas**; si no hay candidatas recientes, la franja desaparece en lugar de inventar urgencias.
- La etiqueta **«⚡ Última hora»** está limitada a noticias con señales reforzadas de relevancia editorial y hechos importantes (coincidencia entre medios, presencia en RSS de referencia y verbos de acción). El criterio es **heurístico**: la coincidencia de fuentes es una pista, no una verificación independiente ni la jerarquía real de la portada. En otros casos aparece **«Recién publicado»**. Se muestra fuente, categoría, edad del artículo y hora de la última edición publicada.
- En la franja también aparece **«✓ Ya vista»** para retirarla manualmente, sin perder el historial recuperable del lector. Abrir el enlace no la retira.
