# Umbral de la comparación visual del armazón de Realtor OS

`shell.spec.ts` reduce en el navegador la captura a 1440×900 de `/realtor/demand-radar` y la referencia
`docs/design/realtor/DL10A/ref/demand_radar.png` (canvas a 144×90, escala de grises) y exige que la diferencia
media absoluta, normalizada a 0–1, sea **≤ 12 %** (`THRESHOLD` en el spec).

## Por qué 12 %

- La referencia es el prototipo con sus datos sintéticos; el panel real pinta otro contenido (tarjetas de
  señales, no el gráfico de barras) y otra tipografía de detalle. Esa zona (el 80 % derecho) es la que más
  difiere y cabe en el margen. Medida en la construcción: **8,07 %**.
- El antialiasing y el redimensionado a 144×90 promedian el texto, por lo que no suman diferencia relevante.
- Falla si falta la estructura: la barra lateral oscura ocupa 288/1440 = 20 % del ancho. Sin ella, ese 20 % pasa
  de luma ≈ 0,13 a ≈ 0,95 (diferencia ≈ 0,8 × 20 % ≈ 16 %), por encima del umbral aunque el resto coincidiera.
- Tampoco se aprueba un armazón con la barra clara o desplazada: la cabecera y el bloque oscuro cambian de sitio
  y la diferencia sube del mismo orden.

El umbral es un punto de partida: si el diseño cambia, regenerar la referencia con `tests/realtor/visual/ref.sh`
y volver a medir `DIFF_MEDIA` (se imprime en cada ejecución) antes de tocar `THRESHOLD`.

## Asistente de alta (`alta.spec.ts`)

DL10A no tiene una pantalla de alta; la referencia es `ref/alta.png` = centro "Mi oficina" (NAV[11]), la más
cercana (cuenta y oficina del agente). Mismo umbral (12 %). La referencia se genera con `ref.sh`; el `DIFF_MEDIA`
de esta pantalla aún no se ha medido (no hay ZIP ni navegador en el entorno del constructor): medirlo en CI antes
de dar el umbral por bueno.

## Clientes (`clientes.spec.ts`)

Referencia `ref/clientes.png` (centro "Clientes" de DL10A). Mismo umbral (12 %). `DIFF_MEDIA` aún sin medir en este
entorno (sin navegador del constructor): se imprime en cada ejecución; medirlo en CI antes de dar el umbral por bueno.

## Marketing AI (`marketing-ai.spec.ts`)

Referencia `ref/marketing-ai.png` (centro "Marketing AI" de DL10A, nav-4). Mismo umbral (12 %). `DIFF_MEDIA` aún sin medir en este
entorno (sin navegador del constructor): se imprime en cada ejecución; medirlo en CI antes de dar el umbral por bueno.

## Career Director (`career-director.spec.ts`)

DL10A no tiene pantalla propia de Career Director (solo el bloque de la barra); la referencia es
`ref/career-director.png` = centro "Mi oficina" (NAV[11]), la misma imagen que `career_director.png` de O2-REGISTRO. Mismo umbral
(12 %). `DIFF_MEDIA` aún sin medir: no hay navegador utilizable en el entorno del constructor (faltan librerías del sistema para
Chromium); medirlo en CI antes de dar el umbral por bueno.
