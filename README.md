# Sin Ruido — tu periódico, tus reglas

Prototipo personal de agregador RSS (0 €): muestra titulares seleccionados y enlaza directamente al medio de origen. Sin cuentas de lector, anuncios, rastreo ni API de pago.

## Probar la web
Página: https://dalonsoss-create.github.io/sin-ruido/

1. Selecciona tus **temas** y añade **asuntos vetados**.
2. En **Mis fuentes**, activa o desactiva individualmente los RSS consultados. La selección de fuentes es personal: no detiene la recopilación general.
3. En **Añadir una fuente** pega su dirección **RSS**. Se guarda como **propuesta**, no comienza a recopilar de inmediato. Pulsa **Solicitar activación** para abrir una solicitud en GitHub; hay que comprobar el feed y sus condiciones antes de sumarlo a `docs/fuentes.json`.
4. **Compartir periódico** envía la URL. Elena puede abrirla en otro móvil o navegador y guardar sus propios filtros, totalmente independientes; la configuración se guarda solo en **localStorage** y no se sincroniza.
5. Cualquier titular puede ocultarse con «No me interesa».

## Diseño e imágenes
La portada utiliza diseño editorial de periódico, destacados, tipografía serif y bloques visuales. El código ya admite fotos RSS por noticia en `image`. **Las fotos de periódicos NO están activadas**: todas las fuentes tienen `images_allowed: false` hasta verificar derechos de reproducción de cada medio. Las ilustraciones degradadas con símbolos son parte del diseño y no copian imágenes de terceros.

## Actualizaciones RSS
- Catálogo de medios y secciones: `docs/fuentes.json` (cada RSS tiene `id`, `name`, `category`, `url` e `images_allowed`).
- Procesador: `scripts/actualizar.py`.
- Resultado actualizado: `docs/noticias.json` incluye titulares, enlaces, fuente concreta, estado de cada RSS y fecha de consulta.
- GitHub Actions: `.github/workflows/actualizar.yml`. Actualiza cuatro veces al día (UTC) y al modificar el catálogo o el procesador. También se puede ejecutar manualmente.
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
- **Todos los lectores nuevos** ven los siete temas disponibles en el formulario de bienvenida y los cuatro medios conectados en este momento: **EL PAÍS, Cinco Días, Xataka y El Mundo**; sus selecciones son personales. No se copian los filtros de otro lector.
- El formulario y la barra lateral agrupan los RSS por nombre de medio: **EL PAÍS aparece una sola vez aunque agregue 6 secciones**. Al marcar/desmarcar un medio se activan/desactivan sus RSS. En **«Ver secciones RSS»** es posible consultar las secciones, enlaces RSS y estado y afinar por cada sección si se desea.
- El enlace de invitación sigue siendo https://dalonsoss-create.github.io/sin-ruido/?bienvenida=1 .
- **Noticias:** en cada carga de la web se consulta `noticias.json`; además, se comprueba si hay una edición más reciente en GitHub al volver a la pestaña o a la app, recuperar una página desde caché y cada 5 minutos mientras está abierta. Esto **no descarga RSS en cada clic**: el RSS se actualiza mediante GitHub Actions según su programación de cuatro turnos al día (sujeta a retrasos de GitHub y fallos de feed).
- **Código y diseño:** las versiones del sitio se actualizan al completarse el despliegue de GitHub Pages. Si una app instalada permanece abierta en segundo plano, puede ser necesario cerrarla y volver a abrirla para aplicar una versión nueva de la interfaz.
