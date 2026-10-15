# Umbral visual — Propietarios

Nota por pantalla (evita que cada pantalla apende al fichero compartido `e2e/realtor/visual/UMBRAL.md` y choque al mergear).

## Propietarios (`propietarios.spec.ts`)

Referencia `ref/propietarios.png` (centro "Propietarios" de DL10A). Mismo umbral (12 %). `DIFF_MEDIA` aún sin medir en este
entorno (sin navegador del constructor): se imprime en cada ejecución; medirlo en CI antes de dar el umbral por bueno.

### Pasada de fidelidad (O2-F-PROPIETARIOS)

Referencia `docs/design/realtor/DL10A/ref/propietarios.png`; método de `shell.spec.ts` (canvas 144×90, escala de grises,
diferencia media absoluta 0–1); umbral `THRESHOLD = 0.12`, sin cambios. Cambios: barra oscura con el propietario en foco
(jerarquía del prototipo), título de tarjeta a 24 px y altura mínima de la tarjeta principal.
DIFF_MEDIA: sin medir en el constructor; la mide la evidencia (Chromium no arranca aquí: falta libnspr4.so).
