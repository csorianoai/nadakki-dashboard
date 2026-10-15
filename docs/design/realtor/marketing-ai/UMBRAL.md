# Umbral visual de Marketing AI (O2-F-MARKETING-AI)

- **Referencia usada:** `../DL10A/ref/marketing-ai.png` (copia de `marketing_ai.png`, centro «Marketing AI», NAV[4]). No se ha regenerado ni editado.
- **Método:** el de `e2e/realtor/visual/shell.spec.ts`: captura de `/realtor/marketing-ai` a 1440×900 en DEMO, canvas 144×90, escala de grises, diferencia media absoluta normalizada a 0–1. El spec imprime `DIFF_MEDIA`.
- **Umbral:** `THRESHOLD = 0.12` (12 %), la constante de `e2e/realtor/visual/UMBRAL.md`. No se ha subido, ni cambiado el método, ni recortado la captura.
- **DIFF_MEDIA medido:** sin medir en el constructor; la mide la evidencia. El Chromium del constructor no arranca
  (`error while loading shared libraries: libnspr4.so`), por lo que no se da ningún número.
- **Cambios en la pantalla:** ninguno en esta pasada: sin una medida no hay base para retocar jerarquía ni espaciado,
  y la barra lateral nueva (de RE-SHELL) ya ocupa el 20 % izquierdo que domina la medida.
