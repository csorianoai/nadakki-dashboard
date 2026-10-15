# Umbral visual — Career Director

Nota por pantalla (no toca el `e2e/realtor/visual/UMBRAL.md` compartido, para no chocar al mergear).

- **Referencia usada:** `docs/design/realtor/DL10A/ref/career-director.png` = centro «Mi oficina» (NAV[11]) de DL10A, la misma
  imagen que `alta.png` y `career_director.png`. DL10A no tiene pantalla propia de Career Director: **no hay referencia de píxeles
  del contenido propio** (licencia, supervisión, metas); solo se compara el armazón (barra lateral, cabecera, bloque «Career Director · guía»).
- **Método:** `e2e/realtor/visual/career-director.spec.ts` captura `/realtor/career-director` a 1440×900 en DEMO, reduce captura y
  referencia a un canvas 144×90 en escala de grises y calcula la diferencia media absoluta normalizada a 0–1 (igual que `shell.spec.ts`).
- **Umbral:** `THRESHOLD = 0.12` (12 %), el de RE-SHELL; no se sube, no se cambia el método ni se recorta la captura.
- **DIFF_MEDIA medido:** sin medir en el constructor; la mide la evidencia. (El navegador del constructor no arranca: falta `libnspr4.so`
  y no hay permisos para instalarla.) El spec imprime `DIFF_MEDIA=…%` en cada ejecución y falla por encima del umbral.
