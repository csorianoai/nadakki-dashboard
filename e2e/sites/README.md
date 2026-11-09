# E2E y accesibilidad de «Mi web» (ST4-08)

Ejecutar: `npx playwright test --config e2e/sites/playwright.config.ts` (y `npx jest tests/sites`).
La prueba de hecho es `tests/sites/RESULT_ST4_08.sh` (última línea `RESULT_ST4_08=PASS|FAIL`).

## Qué hace
- Dos builds de producción: con `NEXT_PUBLIC_SITES_PANEL=1` y `NEXT_PUBLIC_SITES_ALLOW_DEMO=1` (puerto 3120) y otro **sin DEMO**
  (`NEXT_DIST_DIR=.next-sites-nodemo`, puerto 3121). Backend `http://backend.invalid`; todo `/api/**` se intercepta con `page.route`.
- `a11y.spec.ts`: axe-core (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) en `/mi-web`, `/paginas`, `/propiedades`, `/medios`,
  `/desarrollos`, `/publicar` y `/vista-previa`, a 1280 y 390 px, en ES y EN: **0 violaciones de cualquier impacto**. Los
  *incompletos* de `color-contrast` se imprimen en el log (`INCOMPLETO color-contrast …`) para revisión manual; no se ocultan.
- `comportamiento.spec.ts`: badge DEMO con DEMO; sin DEMO y API caída, estado UNAVAILABLE sin datos mock; tenant ajeno
  (404 `NOT_FOUND`) como «no encontrado»; teclado (skip-link, idioma, navegación, sin trampa de foco); Medios no se envía con
  los campos de permiso vacíos (y no hace ninguna llamada a `/media`).

## Alcance del análisis
axe analiza la raíz de Mi web (`data-testid="mi-web-raiz"`). **No** analiza el marco común de la plataforma que la envuelve
(barra de módulo y botón flotante), que es de otras zonas. Con la página completa axe reporta dos fallos que NO son de Mi web:
`button-name` (botón fijo sin nombre accesible en `body > button`) y `color-contrast` (títulos de grupo `text-zinc-500` 4,11:1 en
el `aside` del menú de módulo). Están reportados como bloqueantes para sus dueños.

## Lo que axe NO cubre (no equivale a conformidad WCAG)
axe detecta automáticamente solo una parte de los criterios. Queda sin cubrir, y por tanto manual:
- Calidad del texto alternativo, claridad del lenguaje llano y de los mensajes de error, y coherencia del orden de lectura.
- Contraste en estados que axe marca como *incompletos* (fondos con imagen, estados hover/focus); se listan en el log.
- Uso real con teclado más allá del recorrido automático (atajos, modales, retorno del foco tras acciones).
- Zoom al 200 %/400 %, reflujo, espaciado de texto, movimiento reducido, alto contraste forzado.
- La vista previa es una aproximación del borrador: no valida la accesibilidad de la web publicada.

## PENDIENTE (como en PROD_ACCESSIBILITY_GATE de Realtor)
- Prueba con lector de pantalla (NVDA/JAWS en Windows, VoiceOver en macOS e iOS, TalkBack).
- Safari/iOS real (el E2E corre solo en Chromium).
