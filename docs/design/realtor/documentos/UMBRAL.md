# Umbral visual de Documentos (O2-F-DOCUMENTOS)

- Referencia: `docs/design/realtor/DL10A/ref/documentos.png` (sin tocar).
- Método: el de `shell.spec.ts` (canvas 144×90, escala de grises, diferencia media absoluta normalizada a 0–1), captura completa a 1440×900 en DEMO.
- Umbral: `THRESHOLD = 0.12` (12 %), sin cambios.
- DIFF_MEDIA: sin medir en el constructor; la mide la evidencia (el entorno no tiene `node_modules` ni navegador; el spec imprime `DIFF_MEDIA=` en cada ejecución).
- Cambios de fidelidad: título «Documentos y contratos», subtítulo de biblioteca versionada, tarjetas de 12 px de radio, y «Biblioteca de plantillas» como tabla a ancho completo bajo las dos tarjetas, como en DL10A.
