# Umbral visual de Smart Calendar (O2-F-SMART-CALENDAR)

- **Referencia usada:** `docs/design/realtor/DL10A/ref/smart-calendar.png` (copia de `mi_dia.png`, centro «Mi día», NAV[0]). DL10A no tiene pantalla propia para Smart Calendar: el área del calendario **no tiene referencia de píxeles**; solo la estructura general (barra lateral oscura de 288 px, cabecera, márgenes, tipografía FONT_DISPLAY/FONT_BODY) es comparable.
- **Método:** el de `shell.spec.ts` — captura a 1440×900 en DEMO, canvas 144×90, escala de grises, diferencia media absoluta normalizada a 0–1.
- **Umbral:** `THRESHOLD = 0.12` (12 %), sin cambios; el spec imprime `DIFF_MEDIA` y falla por encima.
- **DIFF_MEDIA medido:** sin medir en el constructor; la mide la evidencia.
- **Ajustes de esta pasada:** título a 34 px, introducción a 14 px y margen lateral de 28 px, como la cabecera de Mi día en DL10A. Sin cambios de datos, contratos ni tests.
