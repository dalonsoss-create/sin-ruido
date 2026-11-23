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
