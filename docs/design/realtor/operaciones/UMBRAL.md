# Umbral visual · Operaciones (O2-F-OPERACIONES)

- Referencia: `docs/design/realtor/DL10A/ref/operaciones.png` (sin regenerar).
- Método: el de `e2e/realtor/visual/shell.spec.ts` — captura 1440×900 en DEMO, canvas 144×90, escala de grises, diferencia media absoluta normalizada a 0–1.
- Umbral: `THRESHOLD = 0.12` (el fijado por RE-SHELL en `e2e/realtor/visual/UMBRAL.md`); no se sube ni se recorta la zona.
- DIFF_MEDIA medido: sin medir en el constructor; la mide la evidencia (el spec imprime `DIFF_MEDIA` y falla por encima del umbral).
- Cambio de esta pasada: sección «Finanzas» (comisión bruta, comisión, reparto y cierres) bajo el pipeline; datos SYNTH solo en DEMO.
