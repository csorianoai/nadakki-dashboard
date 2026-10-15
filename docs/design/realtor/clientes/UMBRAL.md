# Umbral visual — Clientes / Contactos (O2-F-CLIENTES)

Nota por pantalla (no toca el `e2e/realtor/visual/UMBRAL.md` compartido).

- Referencia: `docs/design/realtor/DL10A/ref/clientes.png` (centro «Clientes», NAV[1]); no se ha regenerado ni editado.
- Método: el de `shell.spec.ts` (captura a 1440×900, canvas 144×90, escala de grises, diferencia media absoluta normalizada a 0–1).
- Umbral: `THRESHOLD = 0.12` (12 %), sin cambios; el spec imprime `DIFF_MEDIA` y falla por encima.
- DIFF_MEDIA medido: sin medir en el constructor; la mide la evidencia. (El navegador del constructor no arranca: falta `libnspr4.so`;
  `npm run build` de los dos builds sí compila.)
