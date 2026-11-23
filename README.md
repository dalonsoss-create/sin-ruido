# Sin Ruido — noticias sin ruido

Primera versión personal: titulares con enlaces directos a los periódicos, filtros de intereses y vetos por palabras.

## Publicación gratis
1. Abre **Settings → Pages** en este repositorio.
2. En **Build and deployment**, selecciona **Deploy from a branch**.
3. Elige la rama **main** y la carpeta **/docs**. Pulsa **Save**.
4. Al publicarse, la web estará en https://dalonsoss-create.github.io/sin-ruido/ .

## Noticias reales
El script `scripts/actualizar.py` consulta 10 feeds RSS públicos, sin copiar artículos completos. Para generar titulares reales por primera vez:
- En **Actions**, abre **Actualizar titulares de Sin Ruido**.
- Pulsa **Run workflow**.
- Si aparece un error por permisos de escritura: **Settings → Actions → General → Workflow permissions → Read and write permissions**.
El programa también intenta actualizar cada día en cuatro franjas. Pueden fallar algunos RSS, y GitHub puede suspender tareas por inactividad.

Hasta que haya noticias en `docs/noticias.json`, la web mostrará **ejemplos ficticios claramente etiquetados**.

## Personalización
Las preferencias se almacenan en el navegador del usuario; no se comparten entre dispositivos. La clasificación es básica y los filtros de palabras pueden ocultar noticias útiles o dejar pasar temas vetados: este producto es una prueba para mejorarla con el uso.

## Costes y derechos
El desarrollo de prueba no utiliza servicios de IA de pago, servidor propio ni dominio comprado. GitHub Pages y GitHub Actions pueden utilizarse sin coste dentro de los límites de GitHub Free para este prototipo personal público. Antes de comercializarlo, verificar los derechos de uso de titulares y las condiciones de los feeds. GitHub Pages no está pensado para alojar un negocio comercial completo.
