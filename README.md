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
