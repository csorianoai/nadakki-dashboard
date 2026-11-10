# Executive Command Center — pantalla patron (Nadakki Analytics, Fase C)

Ruta: `/marketing/command-center/ejecutivo` · Zona: DASH-MARKETING (`app/marketing/command-center/**`) · Estado: **vista previa con datos DEMO** (no hay datos reales todavia).

## Flag (regla exacta)
Se resuelve en el servidor, en `flag.ts`, sin tocar variables de Vercel:

| Entorno | Resultado |
|---|---|
| `VERCEL_ENV === "production"` | **APAGADO** pase lo que pase (404, no se carga ningun dato DEMO), incluso con `NEXT_PUBLIC_ANALYTICS_DEMO=1` |
| `VERCEL_ENV === "preview"` | ENCENDIDO (revision de Cesar en la vista previa) |
| otro entorno (local/tests) | ENCENDIDO solo con `NEXT_PUBLIC_ANALYTICS_DEMO === "1"` y `NODE_ENV !== "production"` |
| build de produccion fuera de Vercel | APAGADO |

`?estado=cargando|error|vacio|desactualizado` solo se honra en demo, para revisar los estados.

## Datos
`demo/datos-demo.ts` (DEMO/PROTOTIPO) solo se carga con `import()` dinamico desde `page.tsx` y despues del flag. Cuando existan T6a, B2-T1 y B2-T2 se sustituye por un adaptador real con el mismo tipo (`tipos.ts`); contrato esperado: `docs/marketing/analytics-contratos/M1_resumen_ejecutivo.md` (rama `claude/relaxed-mccarthy-iaw4fa-contratos-ola1-2` de nadakki-ai-suite).

## Controles: funcionales vs inhabilitados
Todo control inhabilitado es un boton con `aria-disabled="true"`, alcanzable por teclado, con «Disponible cuando …» como descripcion accesible; su clic no hace nada.

| Control | Estado | Motivo / dependencia |
|---|---|---|
| Periodo 7 / 30 / 90 dias / Personalizado | **Funcional** (teclado: flechas, Home, End) | Con datos DEMO solo existe el periodo de 30 dias: los demas muestran «pendiente de integracion» (nunca cifras inventadas). Con datos reales (T6a) cada periodo se consulta a la fuente |
| Comparar: periodo anterior | **Funcional** (`aria-pressed`) | Muestra/oculta la serie del periodo anterior en el grafico |
| Ordenar columnas de Campañas, paginacion | **Funcional** (kit) | El diseno los dejaba inhabilitados; el kit ya los trae operables |
| Ver tabla de datos (grafico) | **Funcional** | Alternativa accesible del grafico |
| Pestañas moviles (< 640 px) | **Funcional** | Resumen / Campañas / Calidad de los datos |
| Reintentar (estado de error) | **Funcional** | Recarga la pagina sin `?estado` |
| Campaign Intelligence | Inhabilitado | Se construye tras el BASELINE_APPROVED de esta pantalla |
| Conversiones e ingresos | Inhabilitado | Idem |
| Aprobaciones | Inhabilitado | Falta el flujo formal de aprobaciones |
| Modelo económico | Inhabilitado | Falta B2-T1 (modelo economico editable) |
| Cambiar supuestos | Inhabilitado | Falta B2-T1 y el flujo de aprobacion |
| Revisar propuestas (negativas) | Inhabilitado | Falta Campaign Intelligence y el flujo de aprobacion de propuestas |

## Pruebas
- Jest: `npx jest app/marketing/command-center/ejecutivo/tests` (flag, semaforo, aislamiento de DEMO, pagina, pantalla y estados).
- Evidencia visual (NO baseline): `OUT=/tmp/cc-harness bash app/marketing/command-center/ejecutivo/tests/build-harness.sh` y luego
  `OUT=/tmp/cc-harness PW_CHROMIUM=/opt/pw-browsers/chromium npx playwright test -c app/marketing/command-center/ejecutivo/tests/playwright.config.ts --trace off`.
  Las capturas no se suben al repo: el baseline solo lo otorga Cesar (BASELINE_APPROVED).
