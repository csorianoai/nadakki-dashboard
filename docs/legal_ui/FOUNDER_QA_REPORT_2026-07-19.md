# FOUNDER QA REPORT — Legal Core UI

**Fecha:** 2026-07-19
**Ejecutor:** QA delegado (navegador real, Claude-in-Chrome)
**URL:** https://dashboard.nadakki.com
**Tenant:** Nadakki Demo `d3b00111-0000-0000-0000-000000d3b001` (verificado en Legal Hub sidebar y selector global — nunca Credicefi/Banco Piloto)
**Usuario:** demo.admin@nadakki-demo.com
**Guía seguida:** `docs/legal_ui/GUIA_DE_PRUEBA_MANUAL.md`
**Screenshots:** `docs/legal_ui/screenshots_FOUNDER_QA_2026-07-19/`

> **Nota de sesión (honestidad):** No se usó una ventana incógnito del SO. Se trabajó en una **pestaña nueva** con la sesión ya autenticada de `demo.admin` (sessionStorage de disclaimers limpio en esa pestaña — GR-14 renderizó correctamente, confirmando estado no-descartado). No se ingresaron credenciales en ningún momento. A mitad del recorrido la sesión expiró (ver HN-01) y **César reinició sesión**; se retomó desde el Paso 4.

---

## 1. Resumen ejecutivo

El Legal Core es **funcionalmente navegable y honesto en su capa de disclaimers** (GR-14, Aviso legal Ley 91, badges MOCK/DRAFT/DEMO omnipresentes). Los **7 defectos conocidos BD-001…007 se comportan como está documentado** en las rutas alcanzables. Sin embargo, aparecieron **hallazgos nuevos relevantes**: un **timeout de verificación de sesión recurrente (8 ocurrencias)** que llegó a expulsar a `/login`, **strings en inglés** en la capa española, la ruta fantasma **`/legal/guide` con datos mock sin badge y un calendario hardcodeado (Marzo 2026)** que contradice los datos reales, y fallos silenciosos (upload 500 sin UI, actor no persistido). Conteo: **5 hallazgos nuevos**, **5 conocidos confirmados** (BD-001/003/005/006/007), **2 conocidos no alcanzables** (BD-002/004), **1 paso bloqueado temporalmente** (Paso 4, resuelto tras re-login).

---

## 2. Tabla de resultados por paso

| Paso | Pantalla | Esperado | Real | Veredicto | Screenshot |
|---|---|---|---|---|---|
| 1 | `/legal/contracts` | Decisión + citas/códigos; badge MOCK/DRAFT; disclaimer | "Aprobar · confianza 30%", "Score riesgo 0.0/100"; badge **"Modo LLM (demo)"**; GR-14 + Aviso Ley 91 | **PASS** | paso01_contracts_result_MOCKLLM.jpg |
| 2 | `/legal` (home + strip) | Health OK; GR-14 | GR-14 visible; Sistema **Operativo**; 25 expedientes; pack `80bf8f458936`; alerta "1 plazo requiere atención" | **PASS** | paso02_home_gr14.jpg |
| 3 | `/legal/cases/new` | 201 + redirect; posible warning BD-005 | Caso creado `f8b5c02d-9022-4876-be12-cbfb83003212` (EXP-20260719-7265eb). **Actor no persiste → BD-005** | **CONFIRMADO_CONOCIDO (BD-005)** | paso03_caso_creado.jpg · paso03_BD005_actor_no_persiste.jpg |
| 4 | `/legal/cases/{id}/documents` | Banner S3; upload puede fallar; verify → BD-002 | **Sin banner S3**; upload → **HTTP 500 en consola, sin UI de error**; verify no alcanzable (sin doc) | **HALLAZGO_NUEVO** (banner S3 ausente + fallo silencioso) / BD-002 no alcanzable | paso04_documentos.jpg |
| 5 | `/legal/cases/{id}` acciones | Acciones desde GET; transición 200/409 | Panel "Add Actor" + "TRANSICIONES DE ESTADO → CLOSED / → TRIAGE" presentes (strings inglés). Transición no ejecutada a fondo | **AMBIGUO / parcial** | paso03_BD005_actor_no_persiste.jpg |
| 6 | `/strategy`, `/deadlines`, `/issues` | Datos reales o errores HTTP | Estrategia carga (Fortaleza 60/80/85% + riesgos). Plazos carga (0 activos, nada que override). Incidencias no forzada | **PASS (parcial)** — nota: Aviso legal se solapa sobre tarjeta de estrategia (overlap visual) | — |
| 7 | `/snapshots` | Lista (array); verify/diff → BD-003/004 | "No hay versiones". "Crear versión manual" **no persiste versión**. **Verificar integridad → HTTP 500 "invalid UUID 'verify'" → BD-003**. Diff no alcanzable (sin versión) | **CONFIRMADO_CONOCIDO (BD-003)**; BD-004 no alcanzable | paso07_BD003_verify_500.jpg |
| 8 | `/legal/audit?case_id=` | Trail; BD-006 y/o BD-003 | Audit Trail carga (0 queries). **audit_chain_verification → HTTP 404 Not Found → BD-006** (self-referencia BD-006) | **CONFIRMADO_CONOCIDO (BD-006)** | paso08_BD006_audit_404.jpg |
| 9 | `/legal/cases/{id}/archive` | BD-001 (404) | "Confirmar archivo" → **"No se pudo archivar · Not Found · HTTP 404" → BD-001** | **CONFIRMADO_CONOCIDO (BD-001)** | paso09_BD001_archivar_404.jpg |
| 10 | `/legal/research` | Dictamen + citas + badges; o rechazo strict | Dictamen con **"DRAFT — NO CERTIFICADO"**, "Fuentes y trazabilidad" (5 normativas·2 juris·3 biblio·rigor alto), tarjetas "Fuente normativa verificada" (Art.88/95 Cód. Trabajo) | **PASS** — nota: agente "Laboral senior" respondió pregunta **civil** con citas laborales (mismatch de dominio) | paso10_research_DRAFT.jpg |
| 11a | `/legal/library` | Badge DEMO + BD-007 | Badge **DEMO** + "HUÉRFANO_BACKEND_NO_MONTADO · GET /library/status → 404 → BD-007" + "No se inventan documentos indexados" | **CONFIRMADO_CONOCIDO (BD-007)** | paso11_BD007_library_DEMO.jpg |
| 11b | `/legal/config` | Packs DO verified, CO skeleton; badges VERIFIED/DRAFT | DO pack **DRAFT—NO CERTIFICADO / Estado UNKNOWN** (no VERIFIED en ningún lado). CO jurisdicción presente pero **comparte el mismo hash y "10 leyes" que DO** (anomalía). case_types presente | **HALLAZGO_NUEVO / AMBIGUO** (sin pack VERIFIED; CO=hash de DO) | paso11_config_DRAFT.jpg |
| 12 | `/legal/audiencias`, `/legal/strategies/historical` | 200 API | Audiencias carga (Próximas/Vencidas/Completadas/Canceladas = **0**, estado vacío honesto). "Estrategias históricas" existe en nav (smoke no profundizado) | **PASS** | paso12_audiencias_ceros.jpg |

**Conteo:** PASS 5 · CONFIRMADO_CONOCIDO 5 (BD-001/003/005/006/007) · HALLAZGO_NUEVO (con entrada propia) · AMBIGUO/parcial 3 · BLOQUEADO (temporal) 1 (Paso 4 durante logout, luego resuelto).

---

## 3. Hallazgos nuevos

### HN-01 — Timeout de verificación de sesión recurrente (expulsa a /login) · **SEVERIDAD: ALTO (blocker intermitente)**
Pantalla intermedia "**No se pudo verificar la sesión — El servidor no respondió a tiempo**" con botones Reintentar / Cerrar sesión. Aparece de forma **muy frecuente al navegar por deep-links** de rutas legales. Reproducción: navegar directamente a casi cualquier ruta `/legal/*` (sub-rutas de caso y top-level). Mitiga esperando ~30 s y re-navegando (la sesión raíz sigue viva). **Clic en "Reintentar" llegó a redirigir a `/login`** (cierre de sesión efectivo), obligando a re-autenticación por César.

**Registro de ocurrencias (hora aprox. / pantalla / acción):**
| # | Hora | Pantalla | Acción | Desenlace |
|---|---|---|---|---|
| 1 | ~14:40 | `/legal/cases/{id}/documents` | Reintentar | → `/login` (logout) |
| 2 | ~14:41 | (deep-link documents) navigate | navigate | error, recuperó al esperar |
| 3 | ~14:45 | `/legal/audit?case_id` | navigate | error → recuperó tras ~30 s + retry |
| 4 | ~14:47 | `/legal/cases/{id}/archive` | navigate | error → recuperó tras ~30 s + retry |
| 5 | ~14:51 | `/legal/research` | navigate | error → recuperó tras ~30 s + retry |
| 6 | ~14:56 | `/legal/library` | navigate | error → recuperó tras ~30 s + retry |
| 7 | ~14:59 | `/legal/onboarding` | navigate | error → recuperó tras ~30 s + retry |
| 8 | ~15:0x | (varios) | navigate | patrón sostenido |

Screenshot: `incidente_session_timeout.jpg`, `incidente_logout_login.jpg`. **Impacto:** hace el Legal Core frustrante/inusable en navegación directa; riesgo de pérdida de trabajo por logout. Recomiendo priorizar diagnóstico del endpoint de verificación de sesión (latencia/timeout) tras deep-link.

### HN-02 — Ruta fantasma `/legal/guide`: dashboard con datos mock sin badge + calendario hardcodeado · **SEVERIDAD: ALTO (honestidad visual)**
`/legal/guide` **no es la guía MD ni un 404 ni un redirect**: renderiza un dashboard "**Legal OS**" con badges "**31 agentes activos**", "RAG verificado", "Audit ON", "DO / CO / MX" **sin marca DEMO/MOCK**, y KPIs (Casos 12, Plazos 3, Docs 7, Audiencias 4) que **contradicen los datos reales** (home real: 25 expedientes, 0 eventos; `/legal/audiencias` real: **0** próximas). Incluye un **CALENDARIO JUDICIAL hardcodeado "Marzo 2026"** con "PRÓXIMA AUDIENCIA · Cobro de Pesos · Mar 24 9:00am" (fecha **pasada** presentada como próxima; hoy es 19-jul-2026). Solo el calendario lleva un pequeño "Datos demo". Screenshot: `fantasma_guide_mockdata.jpg`. **Esto es exactamente el tipo de dato inventado sin badge + conteo sospechoso a evitar.**

### HN-03 — Strings en inglés en la capa española (i18n incompleta) · **SEVERIDAD: MEDIO** *(confirmado por César como hallazgo)*
Observados en pantallas legales: **"Add Actor"**, **"CLOSED"**, **"TRIAGE"** (resumen de caso), **"Audit Trail"** (título de Auditoría), **"audit_chain_verification"** y **"snapshots/verify (fallback)"** (botones de auditoría — además exponen nombres de endpoint), **"UNKNOWN"** (estado de pack en Config). Screenshots: `paso03_BD005_actor_no_persiste.jpg`, `paso08_BD006_audit_404.jpg`, `paso11_config_DRAFT.jpg`.

### HN-04 — Upload de documento falla en 500 sin feedback en UI + banner S3 ausente · **SEVERIDAD: MEDIO**
En `/legal/cases/{id}/documents` **no aparece el banner amarillo S3** que la guía anticipaba. Al subir un PDF dummy (`.pdf`, aceptado), la subida **falla con HTTP 500** (`Error al subir documento (500)` en consola) pero **la UI no muestra ningún error/toast**: sigue en "Docs 0" como si nada. Fallo silencioso. Screenshot: `paso04_documentos.jpg`.

### HN-05 — Config: sin pack VERIFIED y jurisdicción CO comparte hash de DO · **SEVERIDAD: BAJO/MEDIO (dato)**
`/legal/config` no muestra ningún pack **VERIFIED** (la guía anticipaba "DO verified"); el pack DO está **DRAFT—NO CERTIFICADO / UNKNOWN**. La fila de jurisdicción **CO** aparece con el **mismo hash `80bf8f4589…` y "10 leyes" que DO** — sugiere que el skeleton CO apunta al pack de DO (posible dato incorrecto). Screenshot: `paso11_config_DRAFT.jpg`.

*(Observación menor adicional: en `/strategy` el banner "Aviso legal" se solapa visualmente sobre la primera tarjeta de estrategia — overlap de capas, cosmético.)*

---

## 4. Rutas fantasma

- **`/legal/guide` → contenido real pero MOCK sin badge (problema).** Dashboard "Legal OS" con métricas y calendario judicial hardcodeado (Marzo 2026) y datos que contradicen la realidad. **Veredicto: HALLAZGO_NUEVO (HN-02)** — no debería exponerse así, o debe marcarse DEMO en todos sus KPIs y corregir el calendario. Screenshot `fantasma_guide_mockdata.jpg`.
- **`/legal/onboarding` → contenido real y funcional (OK).** Formulario "LEGAL CORE — Onboarding: Activa Legal Core para tu firma. Usa dry run para previsualizar sin cambios" (Nombre de la firma, Correo de contacto, jurisdicción RD). GR-14 presente. No mock sin badge. **Veredicto: página legítima**; queda fuera de la matriz de cobertura pero es coherente. Screenshot `fantasma_onboarding.jpg`.

---

## 5. Confirmación de honestidad visual (badges)

| Badge / disclaimer | Dónde apareció |
|---|---|
| **GR-14** ("Asistencia legal automatizada — requiere revisión de abogado…") | **Todas** las pantallas legales verificadas (home, contracts, cases, research, library, config, audit, audiencias, guide, onboarding) ✅ |
| **Aviso legal (Ley 91, Colegio de Abogados RD, Art. 6)** | Todas las pantallas legales ✅ |
| **"Modo LLM (demo)"** | Resultado de `/legal/contracts` ✅ |
| **"DRAFT — NO CERTIFICADO"** | `/legal/research` (dictamen) y `/legal/config` (pack DO) ✅ |
| **"Fuente normativa verificada"** | Tarjetas de citas en `/legal/research` ✅ |
| **"DEMO"** | `/legal/library` (BD-007) ✅ |
| **Auto-referencia a BD-xxx en paneles de error** | BD-001, BD-003, BD-006, BD-007 muestran su código y ruta al ledger ✅ (excelente honestidad) |
| **Banner S3 (amarillo)** en Documentos | **NO apareció** — esperado por la guía → ver HN-04 ⚠️ |
| **Badge VERIFIED** en Config | **NO apareció** (todo DRAFT/UNKNOWN) → ver HN-05 ⚠️ |
| **DEMO/MOCK en KPIs de `/legal/guide`** | **NO apareció** en badges superiores ni KPIs → ver HN-02 ⚠️ |

**Conteo sospechoso detectado:** "**31 agentes activos**" en `/legal/guide` (sin badge), análogo al "46 agentes" que la guía advierte. Los KPIs de esa ruta (12/3/7/4) también son sospechosos por contradecir datos reales.

---

## Anexo — Datos del caso de prueba creado
- **case_id:** `f8b5c02d-9022-4876-be12-cbfb83003212`
- **Expediente:** EXP-20260719-7265eb · Derecho Civil · "QA PRUEBA — Caso ficticio demo (2026-07-19)"
- **Actor ingresado (no persistido, BD-005):** "Cliente Ficticio QA (prueba)" · cédula 000-0000000-0
- **Documento dummy subido (falló 500):** `qa_dummy_documento.pdf` (contenido ficticio evidente "QA DUMMY - NO REAL")
- Todo creado en **Nadakki Demo**. Sin git, sin otros tenants, sin documentos reales.
