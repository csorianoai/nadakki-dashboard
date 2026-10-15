# Demand Radar — medida visual frente a DL10A

- Referencia: `docs/design/realtor/DL10A/ref/demand_radar.png` (sin tocar).
- Captura: `/realtor/demand-radar` a 1440×900, DEMO, Alquiler, Intención, con la barra lateral nueva (O2-F-MENU).
- Método (idéntico a `e2e/realtor/visual/shell.spec.ts`): canvas 144×90, escala de grises, diferencia media absoluta normalizada a 0–1.
- Umbral: `THRESHOLD = 0.12` (fijado por RE-SHELL en `e2e/realtor/visual/UMBRAL.md`; no se cambia).
- Medida previa de RE-SHELL en este centro: 8,07 %. Una pasada no puede empeorarla.
- DIFF_MEDIA medido en el constructor: sin medir en el constructor; la mide la evidencia
  (el build de producción del webServer de Playwright fue terminado por falta de memoria, exit 137, en un runner de 3,8 GB).
- El spec `e2e/realtor/visual/demand-radar.spec.ts` imprime `DIFF_MEDIA=` y falla si supera `THRESHOLD`.
