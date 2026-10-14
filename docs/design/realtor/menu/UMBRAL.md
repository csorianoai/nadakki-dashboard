# Umbral visual de la carcasa y de Resultados

## Carcasa (`e2e/realtor/visual/shell.spec.ts`)

Sigue comparando `/realtor/demand-radar` con `ref/demand_radar.png` (canvas 144×90, grises, diferencia media absoluta),
`THRESHOLD = 0.12` (12 %) de RE-SHELL, sin subirlo, sin cambiar el método y sin recortar la captura. El menú nuevo cambia
rótulos y grupos de la barra, no su geometría (288 px, mismos tokens). `DIFF_MEDIA` se imprime en cada ejecución; lo respalda el CI.

## Resultados (`/realtor/resultados`)

DL10A no tiene este centro: se construye con los tokens y componentes del armazón y **no tiene comparación de píxeles**.
Se verifica por estructura (DEMO rotulado «DEMO · datos sintéticos»; sin DEMO, «Sin datos todavía» sin cifras ni gráficos).
