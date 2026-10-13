# DESIGN_LOOP_10A_FINAL_GATE_REPORT

**DECISION: CONDITIONAL_ACCEPT** · DESIGN_APPROVED: NO · NEW_FEATURES: ninguna · contratos, arquitectura y backend sin cambios · Loop 11 no iniciado.

**Fecha:** 2026-10-11 · Chrome 155
**HTML final:** `Nadakki_Realtor_OS_DL10A_autonomo.html` (archivo único) y `Nadakki Realtor OS DL10A.dc.html` (editable)

## Fundamento de la decisión
- **T29:** está corregido, con una reproducción determinista antes y después de la corrección en los 4 viewports.
- **Regresión:** las 104 pruebas pasan después de la corrección. El único NOT_EXECUTED es T46 a 390 y 768 px, que no aplica a esos anchos.
- **Archivo único:** el autónomo se cargó como Blob, sin acceso a la carpeta del proyecto. Pasó 104/104 sin recursos externos, en dos ejecuciones.
- **La aceptación es condicional** porque quedan sin ejecutar la apertura por `file://` con la red desconectada y Escape con un teclado físico. Hay que completarlas con `PRUEBA_MANUAL_DL10A.md`.

## 1. T29: causa y corrección
El paquete recibido no tenía la corrección: no aparece `_navSeq` en `qa/recibido/`.

**Causa.** Al cambiar de centro, la aplicación programa un `requestAnimationFrame` que mueve el foco al título del centro. Si el navegador lo retrasa (documento oculto o sin pintar), se ejecuta después de abrir y cerrar el diálogo y le quita el foco al botón **Reiniciar DEMO**.

**Corrección.** Solo afecta a la lógica del foco, unos 420 caracteres en `componentDidUpdate` y `ask()`:
1. Cada navegación tiene un número de secuencia. El rAF de la navegación anterior ya no mueve el foco, y abrir un diálogo lo cancela.
2. Al cerrar el diálogo, el foco vuelve al control que lo abrió de forma inmediata, en el siguiente ciclo y en el siguiente frame, comprobando cada vez que el diálogo siga cerrado.
3. Si ese control se volvió a crear en el DOM, se busca por su `data-qa`.

La diferencia entre el editable recibido y el final se limita a ese bloque.

## 2. T29 repetido en 4 viewports (automático, con eventos sintéticos)
Se usó `qa/t29_repro.js`, con 3 repeticiones de 40 ciclos por viewport y versión. Cada ciclo abre el diálogo, pulsa Escape y comprueba el foco; la mitad de los ciclos van justo después de navegar. 20 de los 40 ciclos se ejecutan con el rAF retrasado: los callbacks se acumulan y se ejecutan después de cerrar el diálogo.

| Viewport | Recibido: rAF normal | Recibido: rAF retrasado | Final: rAF normal | Final: rAF retrasado |
|---|---|---|---|---|
| 390×844 | 60/60 | **30/60** (foco en `center-title`) | 60/60 | **60/60** |
| 768×1024 | 60/60 | **30/60** | 60/60 | **60/60** |
| 1024×768 | 60/60 | **30/60** | 60/60 | **60/60** |
| 1440×900 | 60/60 | **30/60** | 60/60 | **60/60** |

Antes de la corrección fallaban 120 de 480 ciclos; después, 0 de 480. A 924×540 (vista directa, sin arnés) el resultado fue el mismo: 10/20 antes y 20/20 después con el rAF retrasado.

**Prueba manual con teclado físico:** NOT_EXECUTED. La automatización solo genera eventos con `isTrusted = false`. El procedimiento está en `PRUEBA_MANUAL_DL10A.md`, sección B.

## 3. Regresión de 104 pruebas tras la corrección
| Ejecución | Viewport | PASS | FAIL | NOT_EXECUTED |
|---|---|---|---|---|
| Autónomo en iframe | 390×844 | 103 | 0 | 1 (T46: sidebar oculto) |
| Autónomo en iframe | 768×1024 | 103 | 0 | 1 (T46) |
| Autónomo en iframe | 1024×768 | 104 | 0 | 0 |
| Autónomo en iframe | 1440×900 | 104 | 0 | 0 |
| Autónomo, vista directa | 924×540 | 104 | 0 | 0 |
| Editable, vista directa | 924×540 | 104 | 0 | 0 |
| Repetición, autónomo en iframe | 1024 y 1440 | 104 en cada uno | 0 | 0 |

## 4. Archivo único y modo sin conexión
**Inspección estática.** El autónomo (1,0 MB) no tiene ningún `src` o `href` que apunte a un archivo externo. React, el runtime, las fuentes y el catálogo geográfico DEMO están incrustados.

**Ejecución aislada.**
- El texto del HTML se cargó como Blob (`blob:`), de modo que una ruta relativa como `vendor/` o `geo/` no se podría resolver.
- Dentro del documento se ejecutaron las 104 pruebas, dos veces: **104/104 PASS** y 0 recursos fuera de `data:` y `blob:`.
- En la primera ejecución aislada, T80 y T67 fallaron por el arnés, que buscaba sus propios scripts por ruta relativa. Corregí el arnés para pasárselos directamente, sin tocar la aplicación, y repetí la prueba.

**Única dependencia de red:** el mapa base de OpenStreetMap, que solo se carga si el usuario lo activa. Por defecto el mapa se dibuja sin red.

**`file://` con la red desconectada: NOT_EXECUTED.** Este entorno no permite abrir rutas `file://` ni cortar la red. El procedimiento está en `PRUEBA_MANUAL_DL10A.md`, sección A.

## 5. Continuidad (las pruebas siguen en PASS)
| Elemento | Pruebas |
|---|---|
| Listing Director, 8 etapas | T81, T83, T97, T98 |
| Buyer Director | T85 |
| AI Workforce Router | T101, T102 |
| Tres equipos de IA | T82, T101 |
| Conversation Intelligence | T86–T89, T103, T104 |
| G1-AUTONOMIA, con A5 bloqueado | T100 |

## 6. Limitaciones pendientes
1. `file://` con la red desconectada: NOT_EXECUTED (manual).
2. T29 con teclado físico: NOT_EXECUTED (manual).
3. Sin ejecutar: Safari en iOS con un teléfono físico, Firefox y Safari de escritorio, y lectores de pantalla.
4. G1-AUTONOMIA y la propuesta de ola 2 no están en el proyecto. Las etapas y la escala A0–A5 vienen del brief.
5. El mapa base de OpenStreetMap necesita red; es opcional.
6. Todo es simulación. Los roles que se ven en la interfaz no conceden permisos.

## 7. Cómo reproducir
- **Arnés:** abrir `qa/harness.html` y ejecutar `(0,eval)(await (await fetch('final_gate.js')).text()); await finalGate();`. El arnés incluye T29 recibido contra final en los 4 viewports, el modo aislado y la regresión.
- **Suite en una sola página:** abrir el HTML y pegar `qa/run_tests.js` en la consola.
- **Capturas:** `qa/capturas/DL10A_CIERRE/`.
