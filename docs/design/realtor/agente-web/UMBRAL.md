# Fidelidad visual: /realtor/agente-web (O2-F-WEB)

- Referencia: `docs/design/realtor/DL10A/ref/agente-web.png`, copia byte a byte de `alta.png` («Mi oficina», NAV[11]); DL10A no tiene pantalla de web pública del agente y no hay referencia de píxeles del contenido propio del sitio.
- Método: igual que `e2e/realtor/visual/shell.spec.ts` (canvas 144x90, escala de grises, diferencia media absoluta normalizada a 0-1).
- Umbral: THRESHOLD = 0.12 (12 %), el fijado por RE-SHELL.
- Captura: 1440x900, DEMO, sesión simulada del spec (`e2e/realtor/visual/agente-web.spec.ts`).
- DIFF_MEDIA medido: sin medir en el constructor; la mide la evidencia (no hay dependencias instaladas ni navegador en este entorno).
