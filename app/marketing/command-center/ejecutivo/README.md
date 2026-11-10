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

`?estado=cargando|error|vacio|desactualizado` solo se honra en demo, para revisar los estados. `?tema=claro` muestra el tema claro (control); **por defecto es OSCURO (azul noche)**, la version que se revisa para BASELINE_APPROVED. El boton «Oscuro/Claro» de la cabecera alterna el tema (no se guarda).

## Tema y formato (decisiones de Cesar, 10-nov-2026)
- **Tema oscuro esencial.** La pantalla usa SOLO los tokens semanticos del kit (`--kit-*`, `components/analytics/kit/tema.css`) en claro y en oscuro: nada de `forgeGray-*`, hex ni colores de Tailwind (lo comprueba `tests/aislamiento.test.ts`). El tema se aplica con `data-theme` en la raiz de la pantalla (el mecanismo de Forge).
- **Formato por tenant.** Locale y moneda salen de la configuracion de cada tenant: `PantallaDemo` lee `useTenantBranding()` y monta `<FormatoProvider formato={formatoDesdeTenant(branding)}>`; sin dato, es-US / USD. La pantalla no fija ningun locale ni moneda (el test de aislamiento lo vigila). La moneda propia de una cifra manda sobre la del tenant.

## Criterios visuales obligatorios (Cesar)
1. **Jerarquia ejecutiva.** En escritorio, el primer viewport (1440x900 y 1920x1080, sin scroll) muestra los tres KPI, el estado preliminar de rendimiento (chip del CPA y semaforo) y el inicio del grafico principal. Para ello los indicadores secundarios van DESPUES del grafico (el diseno los ponia antes). Lo mide `tests/e2e/pantalla.spec.ts` («criterio 1»).
2. **Identidad premium.** Azul noche, tarjetas elevadas de radio 18 px, numero grande en tipografia Display y espaciado del diseno V2; sin barra lateral propia (el dashboard ya tiene su menu) y con la navegacion de secciones en la cabecera.
3. **Semaforo responsable.** «CPA por debajo del objetivo» NO es «rentabilidad confirmada». **Tres estados de muestra** (umbral PROVISIONAL aprobado por Cesar el 10-nov-2026; NO es una prueba de significacion estadistica ni una confirmacion de rentabilidad), segun las conversiones del periodo (constantes `MUESTRA_MUY_LIMITADA_MAX = 4`, `MUESTRA_PRELIMINAR_MAX = 14` y `MUESTRA_SEGUIMIENTO_MIN = 15` en `semaforo.ts`):

   | Conversiones | Chip del CPA | Linea de la tarjeta | Texto de la muestra (exacto) | Barra del semaforo |
   |---|---|---|---|---|
   | 0 a 4 (o dato invalido: null, NaN, negativo) | Datos muy limitados | Sin juicio frente al objetivo | `N conversiones · hacen falta al menos 5` | sin marcador (no hay juicio) |
   | 5 a 14 | Rendimiento preliminar | CPA por debajo del objetivo / entre objetivo y equilibrio / sobre el equilibrio | `N conversiones · muestra pequeña (de 5 a 14)` (movil: sin el parentesis) | con marcador |
   | 15 o mas | Muestra de seguimiento | idem | `N conversiones · con incertidumbre: no es rentabilidad confirmada` | con marcador |

   La rentabilidad queda siempre «sin confirmar» (o «en revision» si hay cierres CRM): la pantalla nunca la confirma ni dice «rentable». Los supuestos financieros (objetivo, equilibrio; comision y tasa de cierre en el detalle) y la ausencia de cierres CRM estan SIEMPRE visibles junto al CPA, en cualquiera de los tres estados. En la tabla de campañas la lectura tambien lleva su estado («Preliminar: bajo objetivo», «Seguimiento: …»; con menos de 5 conversiones, «Datos insuficientes»). Un test recorre los estados (fronteras 4→5 y 14→15, entrada invalida) en escritorio y movil y falla si aparece «rentable», «rentabilidad confirmada» (salvo en «no es rentabilidad confirmada»), «estadisticamente», «significativo/significacion», «concluyente» o «probado».
4. **Movil.** Decision de Cesar (10-nov): en 320x568 y 390x844 Inversion, CPA y Leads (valor y etiqueta), el chip de muestra, la barra del semaforo y el aviso minimo de CRM + supuestos caben en el primer viewport. Para lograrlo: banner DEMO corto; cabecera compacta (logo + tenant + titulo y UN bloque expandible «Periodo y opciones · 30 dias» con la fecha de actualizacion, que reune periodo, comparar, tema y otras secciones); **pestañas compactas propias** (`PestanasMoviles.tsx`: una fila de tres pestañas de 44 px y panel sin marco, patron WAI-ARIA) en lugar de `SeccionesAnaliticas` del kit; tarjeta del CPA con la barra y el aviso dentro; Inversion y Leads debajo, lado a lado y compactos; fuente y fecha de las tres cifras en UNA linea agrupada bajo ellas (`FuentesResumen`); grafico, indicadores secundarios y detalle de supuestos despues, plegados en `<details>` (teclado). Valores >= 24 px (CPA 36 px), etiquetas >= 12 px, objetivos tactiles >= 44 px.

## Datos
`demo/datos-demo.ts` (DEMO/PROTOTIPO) solo se carga con `import()` dinamico desde `page.tsx` y despues del flag. Cuando existan T6a, B2-T1 y B2-T2 se sustituye por un adaptador real con el mismo tipo (`tipos.ts`); contrato esperado: `docs/marketing/analytics-contratos/M1_resumen_ejecutivo.md` (rama `claude/relaxed-mccarthy-iaw4fa-contratos-ola1-2` de nadakki-ai-suite).

## Controles: funcionales vs inhabilitados
Todo control inhabilitado es un boton con `aria-disabled="true"`, alcanzable por teclado, con «Disponible cuando …» como descripcion accesible; su clic no hace nada.

| Control | Estado | Motivo / dependencia |
|---|---|---|
| Periodo 7 / 30 / 90 dias / Personalizado | **Funcional** (teclado: flechas, Home, End; en movil dentro de «Periodo y opciones») | Con datos DEMO solo existe el periodo de 30 dias: los demas muestran «pendiente de integracion» (nunca cifras inventadas). Con datos reales (T6a) cada periodo se consulta a la fuente |
| Comparar: periodo anterior | **Funcional** (`aria-pressed`) | Muestra/oculta la serie del periodo anterior en el grafico |
| Ordenar columnas de Campañas, paginacion | **Funcional** (kit) | El diseno los dejaba inhabilitados; el kit ya los trae operables |
| Ver tabla de datos (grafico) | **Funcional** | Alternativa accesible del grafico |
| Pestañas moviles (< 640 px) | **Funcional** (flechas, Inicio, Fin) | Resumen / Campañas / Calidad |
| Tema Oscuro / Claro | **Funcional** (`aria-pressed`) | Alterna el tema de la pantalla; no se persiste |
| «Más opciones», «Indicadores secundarios», «Supuestos financieros y fuentes» (movil) | **Funcional** (`<details>`) | Detalles plegados por defecto |
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
