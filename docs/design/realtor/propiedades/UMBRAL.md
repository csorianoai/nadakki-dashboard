# Umbral visual — Propiedades (O2-F-PROPIEDADES)

Referencia: `docs/design/realtor/DL10A/ref/propiedades.png` (centro «Propiedades», NAV[3]). Método: el de `shell.spec.ts`
(canvas 144×90, escala de grises, diferencia media absoluta normalizada 0–1), captura a 1440×900 en DEMO.
Umbral: `THRESHOLD = 0.12` (12 %), sin cambios.

DIFF_MEDIA: sin medir en el constructor; la mide la evidencia (el spec imprime `DIFF_MEDIA` y falla por encima del umbral).

Cambios de la pasada: el listado pasa de filas a tarjetas con banda de foto, nombre, precio en FONT_DISPLAY y estado (como el Listing
Director de DL10A); filtros y conteos se agrupan en una tarjeta de barra. Sin cambios de datos, contratos ni tests.
