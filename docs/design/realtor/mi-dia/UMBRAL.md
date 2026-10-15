# Umbral visual de Mi día (O2-F-MIDIA)

- Referencia: `docs/design/realtor/DL10A/ref/mi-dia.png` (centro «Mi día», NAV[0] de DL10A; no se ha regenerado).
- Método: el de `e2e/realtor/visual/shell.spec.ts` — captura a 1440×900 en DEMO, canvas 144×90, escala de grises,
  diferencia media absoluta normalizada a 0–1. Sin recorte de la zona comparada.
- Umbral: `THRESHOLD = 0.12` (12 %), el fijado en `e2e/realtor/visual/UMBRAL.md`; no se ha modificado.
- DIFF_MEDIA medido: sin medir en el constructor; la mide la evidencia (el spec lo imprime como `DIFF_MEDIA=…%`).

## Cambios de fidelidad
Solo en DEMO: fila de cuatro indicadores (`mi-dia-kpi-*`, equivalentes a kpi-pending / kpi-plan / kpi-progress) y tarjeta
oscura de siguiente acción (`mi-dia-next`, equivalente a next-card) bajo el encabezado, como en el prototipo. Sin DEMO
no se pinta ninguna cifra y se mantiene «Sin datos todavía». Conflictos de hoy y tareas vinculadas (today-conflict,
linked-tasks) dependen de Smart Calendar y del Career Director: no se inventan aquí.
