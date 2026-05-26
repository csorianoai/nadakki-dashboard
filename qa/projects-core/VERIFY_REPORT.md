# Projects Core Verification Report

Fecha: 2026-05-25  
Branch local QA: `qa/verify-flows`  
Base: `fix/globals-css-parse-error` (`6c0b0cd`) + merge local de `origin/feat/projects-analisis-demo-ready` (`2c70d7d`)  
Merge: sin conflictos

## Resumen ejecutivo

El dev server de Next/Turbopack queda arreglado: arranca limpio, compila las rutas de Projects Core y no vuelve a emitir `Parsing CSS failed` ni `@import rules must precede`. `npm run build` pasa con exit 0. El golden path de navegación frontend de Projects Core compila y responde 200 en todas las rutas solicitadas, pero la validación directa de agentes contra Render encontró un bloqueador runtime: los tres POST de análisis responden HTTP 200 con envelope `success=false`, `accion=error` y `TimeoutError`; en esta corrida no se observó el RAG esperado (`rag_context_count=2`) ni las fuentes Miches-Nisibón.

## Dev + Build + Lint

`.env.local` apunta a backend local, no a Render:

- `NEXT_PUBLIC_NADAKKI_API_BASE=http://127.0.0.1:8000`
- `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

Implicación: la UI local no verá fuentes RAG reales de producción salvo que se ejecute contra Render o un backend local con ese RAG cargado.

Resultados:

| Verificación | Resultado | Observaciones |
| --- | ---: | --- |
| `Get-Process node \| Stop-Process -Force` + borrar `.next` | OK tras reintento | Primer borrado tuvo un archivo Turbopack bloqueado; segundo intento limpió `.next`. |
| `npm run dev` | OK | Next.js 16.2.4 Turbopack listo en `localhost:3000`; solo warning conocido de `middleware` deprecated. |
| Dev CSS parser | OK | Sin `Parsing CSS failed`; sin `@import rules must precede`. |
| `GET /` | No ejecutado en esta corrida de rutas | La verificación de rutas se enfocó en Projects Core. |
| `GET /proyectos` | 200 | Compiló sin errores. |
| `npm run build` | OK, exit 0 | Warning conocido: `middleware` deprecated. Build compiló, TypeScript terminó y generó páginas. |
| `npm run lint` | FAIL por warnings preexistentes | 0 errors, 5 warnings, todos en bank y fuera del scope de Projects. |

Warnings de lint:

| Archivo | Línea | Warning |
| --- | ---: | --- |
| `app/(bank)/bank/applications/[id]/components/DocumentChecklist.tsx` | 25 | `rows` conditional puede cambiar dependencias de `useMemo`. |
| `app/(bank)/bank/applications/[id]/stipulations/StipulationsAdminClient.tsx` | 57 | `list` logical expression afecta dependencias de `useMemo`. |
| `app/(bank)/bank/applications/[id]/stipulations/StipulationsAdminClient.tsx` | 57 | `list` logical expression afecta dependencias de `useEffect`. |
| `app/(bank)/bank/applications/[id]/stipulations/StipulationsAdminClient.tsx` | 57 | `list` logical expression afecta dependencias de `useCallback` línea 66. |
| `app/(bank)/bank/applications/[id]/stipulations/StipulationsAdminClient.tsx` | 57 | `list` logical expression afecta dependencias de `useCallback` línea 75. |

## Tabla de rutas

Dev server: `http://localhost:3000`  
Proyecto usado: `41039223-f78e-4226-8c94-1cdea1c04823`

| Ruta | Status | Compiló sin error Turbopack | Observaciones |
| --- | ---: | --- | --- |
| `/proyectos` | 200 | Sí | Sin errores CSS/dev. |
| `/proyectos/new` | 200 | Sí | Wizard compila. |
| `/proyectos/41039223-f78e-4226-8c94-1cdea1c04823` | 200 | Sí | Detalle compila. |
| `/proyectos/41039223-f78e-4226-8c94-1cdea1c04823/analisis` | 200 | Sí | UI de análisis compila con MarketSourcesCard/RecommendationBadge. |
| `/proyectos/41039223-f78e-4226-8c94-1cdea1c04823/wbs` | 200 | Sí | WBS compila. |
| `/proyectos/41039223-f78e-4226-8c94-1cdea1c04823/riesgos` | 200 | Sí | Riesgos compila. |
| `/proyectos/41039223-f78e-4226-8c94-1cdea1c04823/documentos` | 200 | Sí | Documentos compila. |
| `/proyectos/41039223-f78e-4226-8c94-1cdea1c04823/escenarios` | 200 | Sí | Escenarios compila. |
| `/proyectos/41039223-f78e-4226-8c94-1cdea1c04823/master-plan` | 200 | Sí | Master plan compila. |
| `/proyectos/41039223-f78e-4226-8c94-1cdea1c04823/audit` | 200 | Sí | Audit compila. |
| `/proyectos/dashboards/ceo` | 200 | Sí | Dashboard CEO compila. |
| `/proyectos/dashboards/pm` | 200 | Sí | Dashboard PM compila. |
| `/proyectos/dashboards/inversionista` | 200 | Sí | Dashboard inversionista compila. |
| `/proyectos/portafolio` | 200 | Sí | Portafolio compila. |

Nota: estas pruebas son GET HTTP locales de compilación/render inicial. No sustituyen una prueba browser autenticada de interacción con `AppGate`.

## Tabla de endpoints del backend

Backend verificado directamente: `https://nadakki-ai-suite.onrender.com`  
Header: `X-Tenant-ID: d3b00111-0000-0000-0000-000000d3b001`  
Proyecto: `41039223-f78e-4226-8c94-1cdea1c04823`

| Endpoint | Status | Resumen |
| --- | ---: | --- |
| `GET /api/v1/proyectos` | 200 | Devolvió 4 proyectos para el tenant. Primero observado: `Torre QA Test - Manus Audit 2026-05-25`. |
| `GET /api/v1/proyectos/{id}` | 200 | Devolvió `Torre Residencial Piantini`; campos incluyen `id`, `nombre`, `project_type`, `state`, presupuestos, fechas, `counts`. |
| `POST /api/v1/proyectos/{id}/estudio-mercado` body `{"zona":"Las Zanjas","tipo_producto":"apartamentos"}` | 200 | **RAG NO confirmado en esta corrida.** Envelope: `success=false`, `agent=estudio_mercado_inmobiliario`, `result.status=error`, `decision_block.accion=error`, `confidence=0`, `reason_codes=[ERROR_EJECUCION, TimeoutError]`, `metadata={}`, `datos_faltantes=[]`. |
| `POST /api/v1/proyectos/{id}/valoracion` body `{"zona":"Las Zanjas","horizonte_anios":5}` | 200 | Envelope: `success=false`, `agent=predictor_valorizacion_territorial`, `accion=error`, `confidence=0`, sin `datos_faltantes`; resumen mostró error runtime. |
| `POST /api/v1/proyectos/{id}/absorcion` body `{"unidades":120,"ritmo_historico":"8/mes"}` | 200 | Envelope: `success=false`, `agent=predictor_absorcion_ventas`, `accion=error`, `confidence=0`, sin `datos_faltantes`; resumen mostró error runtime. |
| `GET /api/v1/proyectos/{id}/wbs` | 200 | Devolvió `[]`. |
| `GET /api/v1/proyectos/{id}/riesgos` | 200 | Devolvió `[]`. |

Hallazgo crítico RAG: aunque el contexto indicaba que `Las Zanjas` debía devolver `rag_context_count=2` y fuentes del corredor Miches-Nisibón, la respuesta real durante esta verificación fue `TimeoutError`, con `metadata={}`. La UI demo-ready tiene la tarjeta para mostrar fuentes, pero el backend no entregó fuentes en esta corrida.

## Mapa botones→endpoints

| Archivo / acción | ¿Conectado? | Endpoint / función | Observaciones |
| --- | --- | --- | --- |
| `components/proyectos/ProyectoIntakeWizard.tsx` / `Crear proyecto` | Sí | `createProyecto(tid, apiBody)` en `app/hooks/useProyectos.ts` → `POST /api/v1/proyectos` | Payload usa `nombre`, `project_type`, opcionales whitelisteados; no envía fechas. |
| `app/proyectos/[id]/analisis/AnalisisClient.tsx` / Ejecutar estudio de mercado | Sí | `projectsCorePost(tid, /{id}/estudio-mercado, payload)` | UI tiene inputs `zona`, `tipo_producto`, MarketSourcesCard y RecommendationBadge. |
| `app/proyectos/[id]/analisis/AnalisisClient.tsx` / Ejecutar valoración | Sí | `projectsCorePost(tid, /{id}/valoracion, payload)` | Inputs `zona`, `horizonte_anios`. |
| `app/proyectos/[id]/analisis/AnalisisClient.tsx` / Ejecutar absorción | Sí | `projectsCorePost(tid, /{id}/absorcion, payload)` | Inputs `unidades`, `ritmo_historico`. |
| `app/proyectos/[id]/wbs/WbsClient.tsx` / `Añadir tarea` | Sí | `createWbsItem` → `POST /api/v1/proyectos/{id}/wbs` | Form modal crea tarea. No hay botón “generar WBS con IA” en este archivo. |
| `app/proyectos/[id]/wbs/WbsClient.tsx` / `Editar · próximamente` | Placeholder | Ninguno | Botón deshabilitado; edición espera contrato PATCH/PUT. |
| `app/proyectos/[id]/riesgos/RiesgosClient.tsx` / `Añadir riesgo` | Sí | `createProyectoRiesgo` → `POST /api/v1/proyectos/{id}/riesgos` | Form modal crea riesgo. No hay botón “analizar riesgos con IA” en este archivo. |
| `app/proyectos/[id]/riesgos/RiesgosClient.tsx` / `Editar · próximamente` | Placeholder | Ninguno | Botón deshabilitado; edición espera contrato PATCH/PUT. |
| `app/proyectos/[id]/escenarios/EscenariosClient.tsx` / `Próximamente` | Placeholder | Ninguno | UI menciona POST `/escenarios`, pero está deshabilitado por contrato no versionado. |
| `components/proyectos/ProyectoCommandCenterView.tsx` / detalle | Parcial | `useProyecto` → `GET /api/v1/proyectos/{id}` vía `lib/projects/projectsClient.ts` | Muestra resumen/timeline/documentos/audit. |
| `components/proyectos/ProyectoCommandCenterView.tsx` / audit tab interna | Sí | `useProyectoAuditTrail` → `GET /api/v1/proyectos/{id}/audit-trail` vía `lib/projects/projectsClient.ts` | No hay endpoint “command-center” agregado. |
| `app/proyectos/[id]/master-plan/MasterPlanClient.tsx` | Sí | `GET /api/v1/proyectos/{id}/master-plan` | Viewer técnico. |
| `app/proyectos/[id]/documentos/DocumentosClient.tsx` | Sí | `GET /api/v1/proyectos/{id}/documentos` | Viewer técnico. |
| `app/proyectos/[id]/audit/AuditProjectClient.tsx` | Sí | `GET /api/v1/proyectos/{id}/audit-trail`; verify intenta `/audit/verify` y `/audit-trail/verify` | Viewer técnico + verificación. |

## Bloqueadores reales

1. Los endpoints de análisis en Render devolvieron `TimeoutError` con `success=false` en esta verificación. Bloquea demostrar Market RAG real desde la UI aunque la UI esté preparada para renderizarlo.
2. `.env.local` apunta a `http://127.0.0.1:8000`, por lo que una demo local no consumirá Render ni verá RAG de producción sin cambiar entorno de ejecución o levantar backend local equivalente.
3. WBS y Riesgos tienen create conectado, pero edición está explícitamente en placeholder por falta de contrato PATCH/PUT.
4. Escenarios sigue en placeholder para creación por falta de contrato claro.
5. `npm run lint` falla por warnings preexistentes en bank con `--max-warnings 0`; no bloquea Projects Core directamente, pero bloquea un gate global si se exige lint verde.

## Lo que YA funciona end-to-end

- Dev server Turbopack arranca sin errores CSS después de los fixes de `fix/globals-css-parse-error`.
- Build producción pasa exit 0 con ambos branches combinados localmente.
- Todas las rutas Projects solicitadas responden 200 y compilan sin error en dev.
- Backend Render responde 200 para `GET /api/v1/proyectos`, `GET /api/v1/proyectos/{id}`, `GET /wbs` y `GET /riesgos`.
- UI de análisis está cableada a los tres endpoints reales y tiene presentación demo-ready para fuentes RAG, datos faltantes, reason codes, confidence y recomendación.
- Wizard de creación está cableado a `POST /api/v1/proyectos`.
- WBS y Riesgos permiten POST de creación desde UI.

## Recomendación priorizada

### Ya funciona, solo pulir UI

1. Añadir estado explícito en UI de análisis para `success=false` con `reason_codes` como `TimeoutError`, separándolo visualmente de `datos_insuficientes`.
2. Añadir copy contextual cuando `.env.local` apunte a backend local y no a Render, para evitar confusión en demos RAG.
3. Mejorar estados vacíos de WBS/Riesgos cuando el backend devuelve `[]`.

### Falta cablear endpoint existente o contrato frontend

1. Validar/ajustar payloads de WBS y Riesgos contra contrato real. Hoy usan snake_case español inferido (`nombre`, `descripcion`, `probabilidad`, `impacto`) y los GET devuelven vacío.
2. Si existe endpoint para eventos `AGENT_DECISION`, conectar histórico de análisis en la pestaña de análisis.
3. Si existe PATCH/PUT de WBS/Riesgos, reemplazar `Editar · próximamente` por edición real.

### Falta endpoint o estabilidad backend

1. Resolver timeout runtime de agentes Tier 2 en Render. Es el mayor bloqueo para demostrar Market RAG (`rag_context_count`, `fuentes_mercado`).
2. Versionar contrato POST de `escenarios` o exponer endpoint claro para habilitar creación.
3. Corregir warnings globales de lint en bank si CI exige `npm run lint` con `--max-warnings 0`.
