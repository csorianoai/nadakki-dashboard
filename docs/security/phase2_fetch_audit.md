# Phase 2 Fetch Inventory Audit
**Fecha:** 2026-05-30
**Repo:** nadakki-dashboard
**Branch base:** main

## Resumen ejecutivo
- Total fetches encontrados: 313
- A endpoints autenticados: 153
- De los 153, SIN Authorization Bearer: 153 (HALLAZGOS)
- A endpoints publicos: 8 (OK sin Bearer)
- Ambiguos / unknown: 152 (necesitan decision Cesar)

> BLOQUEO: se encontraron mas de 50 hallazgos en endpoints autenticados sin Bearer. Recomiendo convertir Phase 2 en una migracion por dominios con gates por paquete.

## Hallazgos criticos (fetches autenticados sin Bearer)
### app/api/v1/sic/cases/[caseId]/documents/route.ts:24
- URL pattern: `target`
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
22: 
23:     const target = `${BACKEND_URL}/api/v1/sic/cases/${encodeURIComponent(caseId)}/documents`;
24:     const res = await fetch(target, {
25:       method: "POST",
26:       headers,
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### app/api/v1/sic/statements/route.ts:21
- URL pattern: ``/api/v1/sic/statements``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
19:     if (auth) headers["Authorization"] = auth;
20: 
21:     const res = await fetch(`${BACKEND_URL}/api/v1/sic/statements`, {
22:       method: "POST",
23:       headers,
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### app/hooks/useCredit.ts:218
- URL pattern: ``/api/v2/credit/applications``
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
216:   dryRun = true
217: ): Promise<{ application_id: string; state?: string }> {
218:   const res = await fetch(`${BACKEND_URL}/api/v2/credit/applications`, {
219:     method: "POST",
220:     headers: creditHeaders(tenantId),
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### app/hooks/useCredit.ts:244
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
242:   dryRun = true
243: ): Promise<CreditProcessResult> {
244:   const res = await fetch(
245:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/process`,
246:     {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### app/hooks/useCredit.ts:264
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
262: ): Promise<CreditApplicationResponse | null> {
263:   try {
264:     const res = await fetch(
265:       `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}`,
266:       { headers: creditHeaders(tenantId, { jsonBody: false }) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### app/hooks/useCredit.ts:281
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
279:   applicationId: string
280: ): Promise<{ events: CreditEventRow[]; count: number }> {
281:   const res = await fetch(
282:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/events`,
283:     { headers: creditHeaders(tenantId, { jsonBody: false }) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### app/hooks/useCredit.ts:298
- URL pattern: ``/api/v2/credit/applications``
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
296: ): Promise<{ applications?: unknown[]; items?: unknown[] } | null> {
297:   try {
298:     const res = await fetch(
299:       `${BACKEND_URL}/api/v2/credit/applications`,
300:       { headers: creditHeaders(tenantId, { jsonBody: false }) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### components/bank/DocumentPreviewPane.tsx:72
- URL pattern: `resolved`
- Token source actual: unknown
- Endpoint: `/api/bank/*`
- Snippet
```tsx
70:         setViewerError(null);
71:         const resolved = resolvePdfSourceUrl(meta, applicationId, documentId);
72:         const res = await fetch(resolved, {
73:           ...buildPreviewFetchInit(tenantId, authToken, {
74:             headers: { Accept: "application/pdf,*/*" },
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### components/bank/DocumentPreviewPane.tsx:108
- URL pattern: `resolved`
- Token source actual: unknown
- Endpoint: `/api/bank/*`
- Snippet
```tsx
106:       try {
107:         const resolved = resolvePdfSourceUrl(null, applicationId, comparingDocId);
108:         const res = await fetch(
109:           resolved,
110:           buildPreviewFetchInit(tenantId, authToken, {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### components/bank/DocumentPreviewPane.tsx:173
- URL pattern: `resolved`
- Token source actual: unknown
- Endpoint: `/api/bank/*`
- Snippet
```tsx
171:     try {
172:       const resolved = resolvePdfSourceUrl(kind === "primary" ? metadata : null, applicationId, doc);
173:       const res = await fetch(
174:         resolved,
175:         buildPreviewFetchInit(tenantId, authToken, { headers: { Accept: "application/pdf,*/*" } })
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:216
- URL pattern: ``/api/v1/sic/cases``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
214: 
215: export async function fetchExpedientes(tenantId: string): Promise<Expediente[]> {
216:   const res = await fetch(`${API_BASE}/api/v1/sic/cases`, {
217:     headers: headers(tenantId),
218:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:240
- URL pattern: `expUrl`
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
238: export async function fetchExpediente(expedienteId: string, tenantId: string): Promise<Expediente | null> {
239:   const expUrl = `${API_BASE}/api/v1/sic/expedientes/${encodeURIComponent(expedienteId)}`;
240:   const expRes = await fetch(expUrl, { headers: headers(tenantId) });
241:   if (expRes.ok) {
242:     const data = await expRes.json();
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:252
- URL pattern: ``/api/v1/sic/cases/${encodeURIComponent(expedienteId`
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
250:     throw new Error(`Expediente: ${expRes.status}`);
251:   }
252:   const res = await fetch(`${API_BASE}/api/v1/sic/cases/${encodeURIComponent(expedienteId)}`, {
253:     headers: headers(tenantId),
254:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:272
- URL pattern: ``/api/v1/sic/cases``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
270:   opts?: { applicant_id?: string; title?: string }
271: ): Promise<string> {
272:   const res = await fetch(`${API_BASE}/api/v1/sic/cases`, {
273:     method: "POST",
274:     headers: headers(tenantId),
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:292
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/timeline``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
290: 
291: export async function fetchTimeline(expedienteId: string, tenantId: string): Promise<unknown[]> {
292:   const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/timeline`, {
293:     headers: headers(tenantId),
294:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:306
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/notas``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
304: 
305: export async function fetchNotas(expedienteId: string, tenantId: string): Promise<Nota[]> {
306:   const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/notas`, {
307:     headers: headers(tenantId),
308:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:324
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/notas``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
322:   contenido: string
323: ): Promise<Nota | null> {
324:   const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/notas`, {
325:     method: "POST",
326:     headers: headers(tenantId),
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:339
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/versiones``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
337: 
338: export async function fetchVersiones(expedienteId: string, tenantId: string): Promise<VersionAnalisis[]> {
339:   const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/versiones`, {
340:     headers: headers(tenantId),
341:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:351
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/auditoria``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
349: 
350: export async function fetchAuditoria(expedienteId: string, tenantId: string): Promise<EventoAuditoria[]> {
351:   const res = await fetch(`${API_BASE}/api/v1/sic/expedientes/${expedienteId}/auditoria`, {
352:     headers: headers(tenantId),
353:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:367
- URL pattern: ``/api/v1/sic/auditoria${q}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
365: ): Promise<EventoAuditoria[]> {
366:   const q = limit ? `?limit=${limit}` : "";
367:   const res = await fetch(`${API_BASE}/api/v1/sic/auditoria${q}`, {
368:     headers: headers(tenantId),
369:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:390
- URL pattern: ``/api/v1/sic/cases/${encodeURIComponent(expedienteId`
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
388:   tenantId: string
389: ): Promise<{ exportacion_id?: string; url?: string } | null> {
390:   const res = await fetch(
391:     `${API_BASE}/api/v1/sic/cases/${encodeURIComponent(expedienteId)}/report`,
392:     { method: "GET", headers: headersForDownload(tenantId, "application/pdf") }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:409
- URL pattern: ``/api/v1/sic/cases/${encodeURIComponent(expedienteId`
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
407:   tenantId: string
408: ): Promise<{ exportacion_id?: string; url?: string } | null> {
409:   const res = await fetch(
410:     `${API_BASE}/api/v1/sic/cases/${encodeURIComponent(expedienteId)}/package`,
411:     { method: "GET", headers: headersForDownload(tenantId, "application/zip") }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:429
- URL pattern: ``/api/v1/sic/exportaciones${q}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
427: ): Promise<Exportacion[]> {
428:   const q = limit ? `?limit=${limit}` : "";
429:   const res = await fetch(`${API_BASE}/api/v1/sic/exportaciones${q}`, {
430:     headers: headers(tenantId),
431:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:446
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/evidencias/${evidenciaId}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
444: ): Promise<Evidencia | null> {
445:   if (!expedienteId) return null;
446:   const res = await fetch(
447:     `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/evidencias/${evidenciaId}`,
448:     { headers: headers(tenantId) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:524
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/versiones/comparar?${params}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
522: ): Promise<ComparacionVersiones | null> {
523:   const params = new URLSearchParams({ version_a: versionA, version_b: versionB });
524:   const res = await fetch(
525:     `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/versiones/comparar?${params}`,
526:     { headers: headers(tenantId) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:546
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/transiciones``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
544:   motivo?: string
545: ): Promise<{ success?: boolean }> {
546:   const res = await fetch(
547:     `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/transiciones`,
548:     {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:563
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/decision``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
561:   body: OverrideRequest
562: ): Promise<{ success?: boolean }> {
563:   const res = await fetch(
564:     `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/decision`,
565:     {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:614
- URL pattern: ``/api/v1/sic/comite/sesiones${q}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
612: ): Promise<SesionComite[]> {
613:   const q = limit ? `?limit=${limit}` : "";
614:   const res = await fetch(`${API_BASE}/api/v1/sic/comite/sesiones${q}`, {
615:     headers: headers(tenantId),
616:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:630
- URL pattern: ``/api/v1/sic/comite/sesiones/${sesionId}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
628:   tenantId: string
629: ): Promise<SesionComite | null> {
630:   const res = await fetch(
631:     `${API_BASE}/api/v1/sic/comite/sesiones/${sesionId}`,
632:     { headers: headers(tenantId) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:646
- URL pattern: ``/api/v1/sic/comite/sesiones/${sesionId}/expedientes``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
644:   tenantId: string
645: ): Promise<ExpedienteEnSesion[]> {
646:   const res = await fetch(
647:     `${API_BASE}/api/v1/sic/comite/sesiones/${sesionId}/expedientes`,
648:     { headers: headers(tenantId) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:669
- URL pattern: ``/api/v1/sic/comite/sesiones/${sesionId}/votos``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
667:     abstenido: "ABSTINENCIA",
668:   };
669:   const res = await fetch(
670:     `${API_BASE}/api/v1/sic/comite/sesiones/${sesionId}/votos`,
671:     {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:686
- URL pattern: ``/api/v1/sic/comite/sesiones/${sesionId}/cerrar``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
684:   memo?: string
685: ): Promise<{ success?: boolean }> {
686:   const res = await fetch(
687:     `${API_BASE}/api/v1/sic/comite/sesiones/${sesionId}/cerrar`,
688:     {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:718
- URL pattern: ``/api/v1/sic/expedientes/${expedienteId}/replay``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
716:   tenantId: string
717: ): Promise<ReplayData | null> {
718:   const res = await fetch(
719:     `${API_BASE}/api/v1/sic/expedientes/${expedienteId}/replay`,
720:     { headers: headers(tenantId) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:745
- URL pattern: ``/api/v1/sic/portafolio/resumen``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
743:   tenantId: string
744: ): Promise<PortafolioAnalytics | null> {
745:   const res = await fetch(`${API_BASE}/api/v1/sic/portafolio/resumen`, {
746:     headers: headers(tenantId),
747:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:779
- URL pattern: ``/api/v1/sic/metricas/resumen``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
777: 
778: export async function fetchMetricasEjecutivas(tenantId: string): Promise<MetricasEjecutivas | null> {
779:   const res = await fetch(`${API_BASE}/api/v1/sic/metricas/resumen`, { headers: headers(tenantId) });
780:   if (!res.ok) {
781:     if (res.status === 404) return null;
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:798
- URL pattern: ``/api/v1/sic/health``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
796: 
797: export async function fetchEstadoSistema(tenantId: string): Promise<EstadoSistema | null> {
798:   const res = await fetch(`${API_BASE}/api/v1/sic/health`, { headers: headers(tenantId) });
799:   if (res.ok) return res.json();
800:
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:801
- URL pattern: ``/health``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
799:   if (res.ok) return res.json();
800: 
801:   const fallback = await fetch(`${API_BASE}/health`, { headers: headers(tenantId) }).catch(() => null);
802:   if (fallback?.ok) {
803:     return { salud: "ok", conectividad: true };
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:823
- URL pattern: ``/api/v1/sic/configuracion``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
821: 
822: export async function fetchConfigBanco(tenantId: string): Promise<ConfigBanco | null> {
823:   const res = await fetch(`${API_BASE}/api/v1/sic/configuracion`, { headers: headers(tenantId) });
824:   if (!res.ok) {
825:     if (res.status === 404) return null;
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:849
- URL pattern: ``/api/v1/sic/auditoria-acceso${q}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
847: ): Promise<EventoAcceso[]> {
848:   const q = limit ? `?limit=${limit}` : "";
849:   const res = await fetch(`${API_BASE}/api/v1/sic/auditoria-acceso${q}`, { headers: headers(tenantId) });
850:   if (!res.ok) {
851:     if (res.status === 404) return [];
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:982
- URL pattern: ``/api/v1/sic/reportes/ejecutivo/kpis``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
980: 
981: export async function fetchKpisEjecutivo(tenantId: string): Promise<KpisEjecutivo | null> {
982:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/ejecutivo/kpis`, {
983:     headers: headers(tenantId),
984:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:990
- URL pattern: ``/api/v1/sic/reportes/ejecutivo/alertas?limit=${limit}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
988: 
989: export async function fetchAlertasEjecutivo(tenantId: string, limit = 20): Promise<{ total_alertas: number; alertas: AlertaEjecutiva[] } | null> {
990:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/ejecutivo/alertas?limit=${limit}`, {
991:     headers: headers(tenantId),
992:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:998
- URL pattern: ``/api/v1/sic/reportes/portafolio/resumen``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
996: 
997: export async function fetchResumenPortafolio(tenantId: string): Promise<ResumenPortafolio | null> {
998:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/portafolio/resumen`, {
999:     headers: headers(tenantId),
1000:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1006
- URL pattern: ``/api/v1/sic/reportes/individual/${expedienteId}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1004: 
1005: export async function fetchReporteIndividual(expedienteId: string, tenantId: string): Promise<ReporteIndividual | null> {
1006:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/individual/${expedienteId}`, {
1007:     headers: headers(tenantId),
1008:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1017
- URL pattern: ``/api/v1/sic/reportes/comparativos/expediente-vs-portafolio/${expedienteId}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1015:   tenantId: string,
1016: ): Promise<ComparativoExpVsPortafolio | null> {
1017:   const res = await fetch(
1018:     `${API_BASE}/api/v1/sic/reportes/comparativos/expediente-vs-portafolio/${expedienteId}`,
1019:     { headers: headers(tenantId) },
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1033
- URL pattern: ``/api/v1/sic/reportes/comparativos/periodos?${params}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1031: ): Promise<ComparativoPeriodos | null> {
1032:   const params = new URLSearchParams({ start_a: startA, end_a: endA, start_b: startB, end_b: endB });
1033:   const res = await fetch(
1034:     `${API_BASE}/api/v1/sic/reportes/comparativos/periodos?${params}`,
1035:     { headers: headers(tenantId) },
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1042
- URL pattern: ``/api/v1/sic/reportes/exportaciones/status``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1040: 
1041: export async function fetchExportStatus(tenantId: string): Promise<ExportStatus | null> {
1042:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/exportaciones/status`, {
1043:     headers: headers(tenantId),
1044:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1050
- URL pattern: ``/api/v1/sic/reportes/exportaciones/historial?limit=${limit}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1048: 
1049: export async function fetchExportHistorial(tenantId: string, limit = 50): Promise<{ total: number; exportaciones: Exportacion[] } | null> {
1050:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/exportaciones/historial?limit=${limit}`, {
1051:     headers: headers(tenantId),
1052:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1058
- URL pattern: ``/api/v1/sic/reportes/exportaciones/csv``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1056: 
1057: export async function downloadCsvBatch(tenantId: string): Promise<Blob | null> {
1058:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/exportaciones/csv`, {
1059:     headers: headersForDownload(tenantId, "text/csv"),
1060:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1066
- URL pattern: ``/api/v1/sic/reportes/exportaciones/pdf``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1064: 
1065: export async function downloadPdfBatch(tenantId: string): Promise<Blob | null> {
1066:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/exportaciones/pdf`, {
1067:     headers: headersForDownload(tenantId, "application/pdf"),
1068:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1074
- URL pattern: ``/api/v1/sic/reportes/exportaciones/snapshot``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1072: 
1073: export async function downloadSnapshot(tenantId: string): Promise<Record<string, unknown> | null> {
1074:   const res = await fetch(`${API_BASE}/api/v1/sic/reportes/exportaciones/snapshot`, {
1075:     headers: headers(tenantId),
1076:   });
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1094
- URL pattern: ``/api/v1/sic/demo/expedientes?escenario=${escenario}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1092:   escenario: EscenarioDemoBackend
1093: ): Promise<Expediente[]> {
1094:   const res = await fetch(
1095:     `${API_BASE}/api/v1/sic/demo/expedientes?escenario=${escenario}`,
1096:     { headers: headers(tenantId) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1110
- URL pattern: ``/api/v1/sic/demo/sesiones?escenario=${escenario}``
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1108:   escenario: EscenarioDemoBackend
1109: ): Promise<{ sesion_id: string; fecha_sesion?: string; estado_sesion?: string; expedientes_count?: number; creado_por?: string }[]> {
1110:   const res = await fetch(
1111:     `${API_BASE}/api/v1/sic/demo/sesiones?escenario=${escenario}`,
1112:     { headers: headers(tenantId) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1129
- URL pattern: ``/api/v1/sic/cases/${encodeURIComponent(expedienteId`
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1127: ): Promise<Documento[]> {
1128:   try {
1129:     const res = await fetch(
1130:       `${API_BASE}/api/v1/sic/cases/${encodeURIComponent(expedienteId)}/documents`,
1131:       { headers: headers(tenantId) }
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/api/sic.ts:1150
- URL pattern: ``/api/v1/sic/cases/${encodeURIComponent(expedienteId`
- Token source actual: unknown
- Endpoint: `/api/v1/sic/*`
- Snippet
```tsx
1148:   const formData = new FormData();
1149:   formData.append("file", file);
1150:   const res = await fetch(
1151:     `${API_BASE}/api/v1/sic/cases/${encodeURIComponent(expedienteId)}/documents`,
1152:     {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/bank/document-preview-api.ts:86
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/bank/*`
- Snippet
```tsx
84: ): Promise<void> {
85:   const url = bankDocumentThumbnailUrl(applicationId, documentId, options.page ?? 1);
86:   const res = await fetch(
87:     url,
88:     buildPreviewFetchInit(tenantId, options.authToken, {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/credit-api.ts:417
- URL pattern: ``/api/v2/credit/applications``
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
415: ): Promise<CreditApplicationResponse> {
416:   const tid = requireTenant(tenantId);
417:   const res = await fetch(`${BACKEND_URL}/api/v2/credit/applications`, {
418:     method: "POST",
419:     headers: baseHeaders(tid, true),
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:435
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
433: ): Promise<Record<string, unknown>> {
434:   const tid = requireTenant(tenantId);
435:   const res = await fetch(
436:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/applicant`,
437:     {
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:453
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
451: ): Promise<Record<string, unknown>> {
452:   const tid = requireTenant(tenantId);
453:   const res = await fetch(
454:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/vehicle`,
455:     {
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:475
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
473:     dry_run: true,
474:   };
475:   const res = await fetch(
476:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/process`,
477:     {
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:492
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
490: ): Promise<CreditApplicationResponse> {
491:   const tid = requireTenant(tenantId);
492:   const res = await fetch(
493:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}`,
494:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:505
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
503: ): Promise<FullDossier> {
504:   const tid = requireTenant(tenantId);
505:   const res = await fetch(
506:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/full`,
507:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:522
- URL pattern: ``/api/v2/credit/applications${qs ? `?${qs}` : ""}``
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
520:   if (params?.offset != null) q.set("offset", String(params.offset));
521:   const qs = q.toString();
522:   const res = await fetch(
523:     `${BACKEND_URL}/api/v2/credit/applications${qs ? `?${qs}` : ""}`,
524:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:536
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
534: ): Promise<Record<string, unknown>> {
535:   const tid = requireTenant(tenantId);
536:   const res = await fetch(
537:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers`,
538:     {
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:557
- URL pattern: ``/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
555: ): Promise<{ offers: Record<string, unknown>[]; trace_id?: string }> {
556:   const tid = requireTenant(tenantId);
557:   const res = await fetch(
558:     `${BACKEND_URL}/credit/applications/${encodeURIComponent(applicationId)}/offers`,
559:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:570
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
568: ): Promise<ExplanationResponse> {
569:   const tid = requireTenant(tenantId);
570:   const res = await fetch(
571:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/explanation`,
572:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:583
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
581: ): Promise<OptimizationResponse> {
582:   const tid = requireTenant(tenantId);
583:   const res = await fetch(
584:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/optimize`,
585:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:596
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
594: ): Promise<OffersRankResponse> {
595:   const tid = requireTenant(tenantId);
596:   const res = await fetch(
597:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/offers/rank`,
598:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:610
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
608: ): Promise<{ similar_cases: Record<string, unknown>[]; trace_id?: string }> {
609:   const tid = requireTenant(tenantId);
610:   const res = await fetch(
611:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/similar-cases?limit=${limit}`,
612:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:715
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
713: ): Promise<NarrativeResult> {
714:   const tid = requireTenant(tenantId);
715:   const res = await fetch(
716:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/narrative`,
717:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:755
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
753:   form.append("file", file);
754:   form.append("document_type", documentType);
755:   const res = await fetch(
756:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents/upload`,
757:     {
```
- Severidad: P0
- Phase 2 action: ANADIR_BEARER

### lib/credit-api.ts:786
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
784: ): Promise<CreditDocument[]> {
785:   const tid = requireTenant(tenantId);
786:   const res = await fetch(
787:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents`,
788:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:804
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
802: ): Promise<DocumentCompleteness> {
803:   const tid = requireTenant(tenantId);
804:   const res = await fetch(
805:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents/completeness`,
806:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:817
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
815: ): Promise<WizardStatus> {
816:   const tid = requireTenant(tenantId);
817:   const res = await fetch(
818:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/wizard/status`,
819:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:830
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
828: ): Promise<ConsistencyResult> {
829:   const tid = requireTenant(tenantId);
830:   const res = await fetch(
831:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/consistency`,
832:     { headers: baseHeaders(tid, false) }
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/credit-api.ts:844
- URL pattern: ``/api/v2/credit/applications/${encodeURIComponent(applicationId`
- Token source actual: unknown
- Endpoint: `/api/v2/credit/applications/*`
- Snippet
```tsx
842: ): Promise<void> {
843:   const tid = requireTenant(tenantId);
844:   const res = await fetch(
845:     `${BACKEND_URL}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/consents`,
846:     {
```
- Severidad: P0
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/agents/page.tsx:30
- URL pattern: ``/health``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
28:     setError(null);
29:     try {
30:       const healthRes = await fetch(`${API_URL}/health`);
31:       if (healthRes.ok) {
32:         const healthData = await healthRes.json();
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/agents/page.tsx:41
- URL pattern: ``/api/catalog/${core}/agents``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
39:       for (const core of CORES) {
40:         try {
41:           const res = await fetch(`${API_URL}/api/catalog/${core}/agents`);
42:           if (!res.ok) {
43:             continue;
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/api-keys/page.tsx:33
- URL pattern: ``/api/v1/tenants/${tenantId}/api-keys``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
31:     if (!tenantId) return;
32:     setLoading(true);
33:     fetch(`${API_URL}/api/v1/tenants/${tenantId}/api-keys`, {
34:       headers: { "X-Tenant-ID": tenantId },
35:     })
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/admin/api-keys/page.tsx:53
- URL pattern: ``/api/v1/tenants/${tenantId}/api-keys``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
51:     if (!newKeyName.trim()) return;
52:     setGenerating(true);
53:     fetch(`${API_URL}/api/v1/tenants/${tenantId}/api-keys`, {
54:       method: "POST",
55:       headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/admin/api-keys/page.tsx:73
- URL pattern: ``/api/v1/tenants/${tenantId}/api-keys/${keyId}``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
71:   const handleDelete = (keyId: string) => {
72:     setDeleting(keyId);
73:     fetch(`${API_URL}/api/v1/tenants/${tenantId}/api-keys/${keyId}`, {
74:       method: "DELETE",
75:       headers: { "X-Tenant-ID": tenantId },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/admin/billing/page.tsx:46
- URL pattern: ``/api/v1/billing/plans``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
44: 
45:     try {
46:       const plansRes = await fetch(`${API_URL}/api/v1/billing/plans`);
47:       if (!plansRes.ok) {
48:         setPlans([]);
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/billing/page.tsx:75
- URL pattern: ``/api/v1/tenants/${tenantId}/billing``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
73: 
74:       try {
75:         const billRes = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/billing`);
76:         if (!billRes.ok) {
77:           setCurrentPlan(null);
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/admin/billing/page.tsx:109
- URL pattern: ``/api/v1/tenants/${tenantId}/billing``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
107:     setActionError(null);
108:     setUpgrading(planId);
109:     fetch(`${API_URL}/api/v1/tenants/${tenantId}/billing`, {
110:       method: "PATCH",
111:       headers: { "Content-Type": "application/json" },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/admin/config/page.tsx:35
- URL pattern: ``/api/v1/config``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
33:     setLoading(true);
34:     Promise.all([
35:       fetch(`${API_URL}/api/v1/config`)
36:         .then((r) => (r.ok ? r.json() : {}))
37:         .then((d) => setConfig(d))
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/config/page.tsx:39
- URL pattern: ``/api/v1/social/status``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
37:         .then((d) => setConfig(d))
38:         .catch(() => setConfig({})),
39:       fetch(`${API_URL}/api/v1/social/status`)
40:         .then((r) => (r.ok ? r.json() : null))
41:         .then((d) => setSocialStatus(d))
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/config/page.tsx:53
- URL pattern: ``/api/v1/tenants/${tenantId}/config``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
51:     if (!tenantId) return;
52:     setSaving(true);
53:     fetch(`${API_URL}/api/v1/tenants/${tenantId}/config`, {
54:       method: "PATCH",
55:       headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/admin/db/page.tsx:27
- URL pattern: ``/api/v1/db/status``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
25:     setLoading(true);
26:     setError(false);
27:     fetch(`${API_URL}/api/v1/db/status`)
28:       .then((r) => {
29:         if (!r.ok) throw new Error("Not available");
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/gates/page.tsx:51
- URL pattern: ``/api/v1/gates``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
49:     setActionError(null);
50: 
51:     fetch(`${API_URL}/api/v1/gates`)
52:       .then(async (r) => {
53:         if (!r.ok) {
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/gates/page.tsx:99
- URL pattern: ``/api/v1/gates/${gateId}/${path}``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
97:     setActioning(gateId);
98:     const path = action === "approve" ? "approve" : "reject";
99:     fetch(`${API_URL}/api/v1/gates/${gateId}/${path}`, { method: "POST" })
100:       .then((r) => {
101:         if (r.ok) {
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/page.tsx:105
- URL pattern: `"/api/ai-studio/agents"`
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
103: 
104:   useEffect(() => {
105:     fetch("/api/ai-studio/agents")
106:       .then((r) => r.json())
107:       .then((d) => {
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/system/page.tsx:37
- URL pattern: ``/api/v1/system/info``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
35:     setLoading(true);
36:     Promise.all([
37:       fetch(`${API_URL}/api/v1/system/info`)
38:         .then((r) => (r.ok ? r.json() : null))
39:         .then((d) => setInfo(d?.data || d))
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/system/page.tsx:41
- URL pattern: ``/api/v1/db/status``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
39:         .then((d) => setInfo(d?.data || d))
40:         .catch(() => setInfo(null)),
41:       fetch(`${API_URL}/api/v1/db/status`)
42:         .then((r) => (r.ok ? r.json() : null))
43:         .then((d) => setDbStatus(d))
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/admin/usage/page.tsx:38
- URL pattern: ``/api/v1/tenants/${tenantId}/usage``
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
36:     else setLoading(true);
37:     setError(null);
38:     fetch(`${API_URL}/api/v1/tenants/${tenantId}/usage`)
39:       .then(async (r) => {
40:         if (!r.ok) {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/hooks/proyectosFinanzas.ts:125
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
123:   const url = `${PROJECTS_BASE}${path.startsWith("/") ? path : `/${path}`}`;
124:   const { omitJsonContentType, ...rest } = init ?? {};
125:   const res = await fetch(url, {
126:     ...rest,
127:     method,
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/hooks/useProyectos.ts:49
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
47:   const url = `${PROJECTS_BASE}${pathSuffix === "" ? "" : assertResolvedApiPath(pathSuffix)}`;
48:   const { omitContentType: _omit, ...restInit } = init ?? {};
49:   const res = await fetch(url, {
50:     ...restInit,
51:     headers: proyectoHeaders(tenantId, omitJson ? { jsonBody: false } : undefined),
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/hooks/useProyectos.ts:176
- URL pattern: `XMLHttpRequest`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
174: 
175:   return new Promise((resolve, reject) => {
176:     const xhr = new XMLHttpRequest();
177:     xhr.open("POST", url);
178:     const headers = proyectoMultipartHeaders(tenantId);
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/hooks/useProyectos.ts:242
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
240: ): Promise<void> {
241:   const url = `${PROJECTS_BASE}/documentos/${encodeURIComponent(documentoId)}/download`;
242:   const res = await fetch(url, {
243:     method: "GET",
244:     headers: proyectoMultipartHeaders(tenantId),
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/hooks/useProyectos.ts:272
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
270: ): Promise<{ id: string; deleted_at: string }> {
271:   const url = `${PROJECTS_BASE}/documentos/${encodeURIComponent(documentoId)}`;
272:   const res = await fetch(url, {
273:     method: "DELETE",
274:     headers: proyectoMultipartHeaders(tenantId),
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/hooks/useProyectos.ts:470
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
468: export async function deleteProyecto(tenantId: string, proyectoId: string): Promise<void> {
469:   const url = `${PROJECTS_BASE}${proyectoApiSuffix(proyectoId)}`;
470:   const res = await fetch(url, {
471:     method: "DELETE",
472:     headers: proyectoHeaders(tenantId, { jsonBody: false }),
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### app/proyectos/[id]/wbs/WbsClient.tsx:96
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
94: ): Promise<unknown> {
95:   const url = `${PROJECTS_BASE}${proyectoApiSuffix(proyectoId, "wbs", "tareas", tareaId)}`;
96:   const res = await fetch(url, {
97:     method: "PATCH",
98:     headers: {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### components/proyectos/projectsCoreMutationClient.ts:60
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
58: 
59:   const url = `${PROJECTS_BASE}${resolvedPath}`;
60:   const res = await fetch(url, {
61:     method: "POST",
62:     headers: headers(tenantId),
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/admin/observability-api.ts:43
- URL pattern: `"/metrics"`
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
41:   if (!id) return null;
42:   try {
43:     const res = await fetch("/metrics", {
44:       headers: {
45:         Accept: "text/plain;version=0.0.4;q=0.3,*/*;q=0.1",
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/admin/observability-api.ts:64
- URL pattern: ``/api/v1/tenants/${encodeURIComponent(id`
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
62:   if (!id) return null;
63:   try {
64:     const res = await fetch(`/api/v1/tenants/${encodeURIComponent(id)}/observability/dashboard`, {
65:       headers: jsonHeaders(id, dashboardAuthRole),
66:       cache: "no-store",
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/admin/observability-api.ts:83
- URL pattern: ``/api/v1/tenants/${encodeURIComponent(id`
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
81:   if (!id) return null;
82:   try {
83:     const res = await fetch(`/api/v1/tenants/${encodeURIComponent(id)}/observability/audit-trail`, {
84:       headers: jsonHeaders(id, dashboardAuthRole),
85:       cache: "no-store",
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/admin/observability-api.ts:102
- URL pattern: ``/api/v1/tenants/${encodeURIComponent(id`
- Token source actual: unknown
- Endpoint: `/api/v1/admin/*`
- Snippet
```tsx
100:   if (!id) return null;
101:   try {
102:     const res = await fetch(`/api/v1/tenants/${encodeURIComponent(id)}/observability/sla`, {
103:       headers: jsonHeaders(id, dashboardAuthRole),
104:       cache: "no-store",
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/api/legal.ts:41
- URL pattern: ``${path}``
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
39:       }
40: 
41:       const res = await fetch(`${API_BASE}${path}`, {
42:         ...options,
43:         headers,
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### lib/legal/cases/legal-cases-api.ts:64
- URL pattern: `url`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
62:   const qs = q.toString();
63:   const url = `${LEGAL_PREFIX}/cases${qs ? `?${qs}` : ""}`;
64:   const res = await fetch(url, { headers: tenantHeaders(tenantId) });
65:   if (!res.ok) throw new Error(`Error al cargar expedientes (${res.status})`);
66:   const raw = await parseJson<unknown>(res);
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:71
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
69: 
70: export async function fetchCaseDetail(tenantId: string, caseId: string): Promise<LegalCase> {
71:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}`, {
72:     headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
73:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:82
- URL pattern: ``${/api/v1/legal}/cases``
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
80: 
81: export async function createCase(tenantId: string, body: CreateCasePayload): Promise<LegalCase> {
82:   const res = await fetch(`${LEGAL_PREFIX}/cases`, {
83:     method: "POST",
84:     headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:98
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
96:   caseId: string
97: ): Promise<AvailableActionsResponse> {
98:   const res = await fetch(
99:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/available_actions`,
100:     { headers: tenantHeaders(tenantId) }
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:112
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
110:   payload: Record<string, unknown> = {}
111: ): Promise<unknown> {
112:   const res = await fetch(
113:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/actions/${encodeURIComponent(actionName)}`,
114:     {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:128
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
126:   caseId: string
127: ): Promise<{ events: CaseTimelineEvent[] }> {
128:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/events`, {
129:     headers: tenantHeaders(tenantId),
130:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:138
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
136: 
137: export async function fetchDeadlines(tenantId: string, caseId: string) {
138:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/deadlines`, {
139:     headers: tenantHeaders(tenantId),
140:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:153
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
151:   body: { new_deadline_date: string; reason: string; legal_basis: string }
152: ) {
153:   const res = await fetch(
154:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/deadlines/${encodeURIComponent(deadlineId)}/override`,
155:     {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:166
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
164: 
165: export async function fetchStrategies(tenantId: string, caseId: string) {
166:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/strategies`, {
167:     headers: tenantHeaders(tenantId),
168:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:178
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
176:   body: { strategy_ids: string[]; rationale?: string; generate_documents_immediately?: boolean }
177: ) {
178:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/strategies/select`, {
179:     method: "POST",
180:     headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:188
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
186: 
187: export async function fetchDocuments(tenantId: string, caseId: string) {
188:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}`, {
189:     headers: tenantHeaders(tenantId),
190:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:202
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
200:   body: { new_status: string; notes?: string; submitted_to_court_acuse?: string }
201: ) {
202:   const res = await fetch(
203:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/lifecycle`,
204:     {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:220
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
218:   body: Record<string, unknown>
219: ) {
220:   const res = await fetch(
221:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(docId)}/verify_extracted_data`,
222:     {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:233
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
231: 
232: export async function fetchIssues(tenantId: string, caseId: string) {
233:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/issues`, {
234:     headers: tenantHeaders(tenantId),
235:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:243
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
241: 
242: export async function postIssue(tenantId: string, caseId: string, body: Record<string, unknown>) {
243:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/issues`, {
244:     method: "POST",
245:     headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:258
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
256:   body: Record<string, unknown>
257: ) {
258:   const res = await fetch(
259:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/issues/${encodeURIComponent(issueId)}/resolve`,
260:     {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:271
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
269: 
270: export async function fetchSnapshots(tenantId: string, caseId: string) {
271:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots`, {
272:     headers: tenantHeaders(tenantId),
273:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:281
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
279: 
280: export async function fetchSnapshotDetail(tenantId: string, caseId: string, snapshotId: string) {
281:   const res = await fetch(
282:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots/${encodeURIComponent(snapshotId)}`,
283:     { headers: tenantHeaders(tenantId) }
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:290
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
288: 
289: export async function postSnapshot(tenantId: string, caseId: string, body: Record<string, unknown>) {
290:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/snapshots`, {
291:     method: "POST",
292:     headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:300
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
298: 
299: export async function fetchRisk(tenantId: string, caseId: string): Promise<RiskProfile | null> {
300:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/risk`, {
301:     headers: tenantHeaders(tenantId),
302:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:320
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
318:   body: { lock_reason: string; lock_scope: string; duration_minutes: number }
319: ) {
320:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/lock`, {
321:     method: "POST",
322:     headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:330
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
328: 
329: export async function deleteLock(tenantId: string, caseId: string) {
330:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/lock`, {
331:     method: "DELETE",
332:     headers: tenantHeaders(tenantId),
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:338
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
336: 
337: export async function fetchRelated(tenantId: string, caseId: string) {
338:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/related`, {
339:     headers: tenantHeaders(tenantId),
340:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:346
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
344: 
345: export async function postArchive(tenantId: string, caseId: string, body: Record<string, unknown> = {}) {
346:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/archive`, {
347:     method: "POST",
348:     headers: { ...tenantHeaders(tenantId), "Content-Type": "application/json" },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:360
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
358:   formData: FormData
359: ): Promise<unknown> {
360:   const res = await fetch(`${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents`, {
361:     method: "POST",
362:     headers: { "X-Tenant-ID": tenantId.trim() },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:374
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
372:   body: GenerateDocumentRequestBody
373: ): Promise<GeneratedDocumentDraftResponse> {
374:   const res = await fetch(
375:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/generate`,
376:     {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:400
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
398:   caseId: string
399: ): Promise<GeneratedDocumentsListResponse> {
400:   const res = await fetch(
401:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/generated`,
402:     { headers: tenantHeaders(tenantId) }
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:420
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
418:   docId: string
419: ): Promise<GeneratedDocumentDetail> {
420:   const res = await fetch(
421:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/generated/${encodeURIComponent(docId)}`,
422:     { headers: tenantHeaders(tenantId) }
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:445
- URL pattern: ``${/api/v1/legal}/deadlines/upcoming?${q.toString(`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
443:   q.set("horizon_days", String(horizonDays));
444:   if (includeAcknowledged) q.set("include_acknowledged", "true");
445:   const res = await fetch(`${LEGAL_PREFIX}/deadlines/upcoming?${q.toString()}`, {
446:     headers: tenantHeaders(tenantId),
447:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:461
- URL pattern: ``${/api/v1/legal}/deadlines/${encodeURIComponent(deadlineId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
459:   acknowledgedBy: string,
460: ): Promise<unknown> {
461:   const res = await fetch(
462:     `${LEGAL_PREFIX}/deadlines/${encodeURIComponent(deadlineId)}/acknowledge`,
463:     {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:480
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
478:   documentId: string,
479: ): Promise<{ versions: Record<string, unknown>[]; count: number; document_id: string }> {
480:   const res = await fetch(
481:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}/versions`,
482:     { headers: tenantHeaders(tenantId) },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:497
- URL pattern: ``${/api/v1/legal}/cases/${encodeURIComponent(caseId`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
495:   body: { content: string; createdBy?: string; reason?: string },
496: ): Promise<unknown> {
497:   const res = await fetch(
498:     `${LEGAL_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}/versions`,
499:     {
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:521
- URL pattern: ``${/api/v1/legal}/meta/disaster-mode``
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
519: /** Modo degradado: endpoint opcional; si no existe, se asume NORMAL. */
520: export async function fetchDisasterMode(tenantId: string): Promise<{ level: DisasterLevel }> {
521:   const res = await fetch(`${LEGAL_PREFIX}/meta/disaster-mode`, {
522:     method: "GET",
523:     headers: tenantHeaders(tenantId),
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:570
- URL pattern: ``${/api/v1/legal}/strategies/compare?case_ids=${encodeURIComponent(ids`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
568: ): Promise<StrategyComparisonResponse> {
569:   const ids = caseIds.filter((id) => id.trim()).join(",");
570:   const res = await fetch(
571:     `${LEGAL_PREFIX}/strategies/compare?case_ids=${encodeURIComponent(ids)}`,
572:     { headers: tenantHeaders(tenantId) },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:614
- URL pattern: ``${/api/v1/legal}/jurisdictions``
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
612:   tenantId: string,
613: ): Promise<JurisdictionsResponse> {
614:   const res = await fetch(`${LEGAL_PREFIX}/jurisdictions`, {
615:     headers: tenantHeaders(tenantId),
616:   });
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/legal/cases/legal-cases-api.ts:630
- URL pattern: ``${/api/v1/legal}/knowledge-pack/status?jurisdiction=${encodeURIComponent(jurisdiction`
- Token source actual: unknown
- Endpoint: `/api/v1/legal/*`
- Snippet
```tsx
628:   jurisdiction: string = "do",
629: ): Promise<KnowledgePackStatus> {
630:   const res = await fetch(
631:     `${LEGAL_PREFIX}/knowledge-pack/status?jurisdiction=${encodeURIComponent(jurisdiction)}`,
632:     { headers: tenantHeaders(tenantId) },
```
- Severidad: P1
- Phase 2 action: ANADIR_BEARER

### lib/projects/projectsClient.ts:155
- URL pattern: ``${/api/v1/proyectos}${path === "" ? "" : assertResolvedApiPath(path`
- Token source actual: unknown
- Endpoint: `/api/v1/proyectos/*`
- Snippet
```tsx
153:     }
154: 
155:     const response = await fetch(`${PROJECTS_BASE}${path === "" ? "" : assertResolvedApiPath(path)}`, {
156:       ...init,
157:       headers: baseHeaders,
```
- Severidad: P1
- Phase 2 action: MIGRAR_A_CHFETCH

### app/marketing/segments/page.tsx:433
- URL pattern: `MARKETING_ENDPOINTS.SEGMENTS`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
431:       setApiError(null);
432:       try {
433:         const res = await fetch(MARKETING_ENDPOINTS.SEGMENTS, {
434:           method: "GET",
435:           signal,
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/segments/page.tsx:587
- URL pattern: `MARKETING_ENDPOINTS.SEGMENT_BY_ID(editingSegment.id`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
585:     try {
586:       if (editingSegment) {
587:         const res = await fetch(MARKETING_ENDPOINTS.SEGMENT_BY_ID(editingSegment.id), {
588:           method: "PUT",
589:           headers: {
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/segments/page.tsx:614
- URL pattern: `MARKETING_ENDPOINTS.SEGMENTS`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
612:         addNotification("success", "Segmento actualizado");
613:       } else {
614:         const res = await fetch(MARKETING_ENDPOINTS.SEGMENTS, {
615:           method: "POST",
616:           headers: {
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/segments/page.tsx:688
- URL pattern: `MARKETING_ENDPOINTS.SEGMENT_DUPLICATE(segment.id`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
686:     }
687:     try {
688:       const res = await fetch(MARKETING_ENDPOINTS.SEGMENT_DUPLICATE(segment.id), {
689:         method: "POST",
690:         headers: {
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/segments/page.tsx:716
- URL pattern: `MARKETING_ENDPOINTS.SEGMENT_BY_ID(id`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
714: 
715:     try {
716:       const res = await fetch(MARKETING_ENDPOINTS.SEGMENT_BY_ID(id), {
717:         method: "DELETE",
718:         headers: {
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/templates/create/page.tsx:38
- URL pattern: `MARKETING_ENDPOINTS.TEMPLATES`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
36:       setError(null);
37:       try {
38:         const res = await fetch(MARKETING_ENDPOINTS.TEMPLATES, {
39:           method: "POST",
40:           headers: {
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/templates/page.tsx:101
- URL pattern: `MARKETING_ENDPOINTS.TEMPLATES`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
99:       setError(null);
100:       try {
101:         const res = await fetch(MARKETING_ENDPOINTS.TEMPLATES, {
102:           method: "GET",
103:           signal,
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/templates/page.tsx:183
- URL pattern: `MARKETING_ENDPOINTS.TEMPLATES_GENERATE`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
181:       setGenerateError(null);
182:       try {
183:         const res = await fetch(MARKETING_ENDPOINTS.TEMPLATES_GENERATE, {
184:           method: "POST",
185:           headers: {
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/templates/page.tsx:276
- URL pattern: `MARKETING_ENDPOINTS.TEMPLATE_BY_ID(editId`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
274:       setEditError(null);
275:       try {
276:         const res = await fetch(MARKETING_ENDPOINTS.TEMPLATE_BY_ID(editId), {
277:           method: "PUT",
278:           headers: {
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

### app/marketing/templates/page.tsx:330
- URL pattern: `MARKETING_ENDPOINTS.TEMPLATE_BY_ID(deleteTargetId`
- Token source actual: unknown
- Endpoint: `/api/v1/marketing/*`
- Snippet
```tsx
328:     setDeleteError(null);
329:     try {
330:       const res = await fetch(MARKETING_ENDPOINTS.TEMPLATE_BY_ID(deleteTargetId), {
331:         method: "DELETE",
332:         headers: {
```
- Severidad: P2
- Phase 2 action: ANADIR_BEARER

## Endpoints publicos confirmados sin Bearer (OK)
- `lib/api/suiteOps.ts:45` -> `/health`
- `lib/api/suiteOps.ts:143` -> `/health`
- `app/page.tsx:66` -> `/health`
- `app/agents/execute/page.tsx:74` -> `/health`
- `app/api/health/route.ts:9` -> `/health`
- `app/marketing/run/page.tsx:50` -> `/health`
- `components/marketing/AgentExecutor.tsx:60` -> `/health`
- `components/ui/SystemStatus.tsx:25` -> `/health`

## Endpoints ambiguos para decision Cesar
- `app/[core]/page.tsx:43` -> ` + '/api/catalog/' + coreId + '/agents'`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/advertising/components/AgentsPanel.tsx:25` -> ``/api/v1/agents``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/advertising/components/AgentsPanel.tsx:49` -> ``/api/v1/agents/${agentId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/advertising/google-ads/page.tsx:171` -> ``/api/v1/agents/${encodeURIComponent(agentId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/advertising/google-ads/page.tsx:279` -> ``/api/v1/agents/${encodeURIComponent(agent.backendId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/agents/execute/page.tsx:82` -> `"/api/ai-studio/agents"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/agents/live/page.tsx:58` -> `"/api/tenants"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/ai-studio/generate/page.tsx:39` -> ``/api/v1/agents/contentgeneratoria/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/ame/page.tsx:249` -> `"/api/tenants"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/api/ai-studio/agents/route.ts:16` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/api/tenants/route.ts:20` -> ``/api/v1/tenants``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/api/v1/[[...path]]/route.ts:62` -> `target`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/api/v1/agents/[agentId]/execute/route.ts:32` -> ``/api/v1/agents/${agentId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/audit/page.tsx:32` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/compliance/page.tsx:26` -> ``/api/catalog/compliance/agents``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/credit/dashboard/page.tsx:110` -> `"/credit/dashboard/summary"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/dashboard/components/CoreAgentsPanel.tsx:54` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/dashboard/components/CoreAgentsPanel.tsx:71` -> `'/data/all-agents-structure.json'`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/decision/page.tsx:26` -> ``/api/catalog/decision/agents``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/execute/page.tsx:26` -> ``/api/v1/agents/${agent}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/hooks/contable.ts:104` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/hooks/useAgents.ts:154` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/hooks/useCredit.ts:193` -> ``/api/v2/credit/health``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/hooks/useCredit.ts:314` -> ``/api/v2/credit/stats``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/hooks/useExecuteAgent.ts:48` -> ``/api/v1/agents/${resolvedId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/hooks/useMarketingStats.ts:71` -> ``/api/marketing/dashboard?tenant_id=${encodeURIComponent(tid`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/agents/[agentId]/page.tsx:41` -> ``/api/catalog?module=marketing&limit=300``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/agents/[agentId]/page.tsx:77` -> ``/api/v1/agents/${agentId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/analytics/page.tsx:106` -> ``/analytics/overview?${qs.toString(`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/analytics/page.tsx:109` -> ``/analytics/performance?${new URLSearchParams({`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/attribution/page.tsx:19` -> ``/api/catalog/marketing/agents``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/attribution/page.tsx:39` -> ``/api/v1/agents/${agentId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/command-center/page.tsx:47` -> ``/api/marketing/dashboard?tenant_id=${encodeURIComponent(tenantId.trim(`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/competitive/page.tsx:19` -> ``/api/catalog/marketing/agents``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/competitive/page.tsx:39` -> ``/api/v1/agents/${agentId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/integrations/page.tsx:80` -> ``/api/v1/tenants/${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/marketing/leads/page.tsx:56` -> ``/api/marketing/leads?tenant_id=${encodeURIComponent(tenantId.trim(`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/onboarding/observability/page.tsx:91` -> ``/api/v1/agents/ids``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/onboarding/observability/page.tsx:119` -> ``/api/v1/tenants/${encodeURIComponent(tenant`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/onboarding/observability/page.tsx:240` -> ``/api/v1/agents/${agentId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/onboarding/observability/page.tsx:295` -> ``/api/v1/runs/${encodeURIComponent(runId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/orchestration/page.tsx:26` -> ``/api/catalog/orchestration/agents``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/page.tsx:72` -> ``/api/v1/system/info``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/reports/page.tsx:19` -> ``/api/v1/reports``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/social/connections/page.tsx:49` -> ``/api/social/connections?tenant_id=${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/social/connections/page.tsx:81` -> ``/api/social/${platformId}/auth-url?tenant_id=${encodeURIComponent(tenantId!`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/social/connections/page.tsx:105` -> ``/api/social/${platformId}/disconnect?tenant_id=${encodeURIComponent(tenantId!`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/social/page.tsx:47` -> ``/api/social/connections?tenant_id=${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `app/tenants/page.tsx:44` -> `"/api/ai-studio/agents"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/ai/OnboardingAgent.tsx:34` -> `"/api/ai-studio/agents"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/ai/OnboardingAgent.tsx:97` -> `"/api/ai/copilot"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/ai/OnboardingAgent.tsx:157` -> `"/api/ai/analytics"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/forge/credit-hub/dealer/DealerWizardProvider.tsx:89` -> `"/api/credit-hub/client-metadata"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/google-ads/GoogleAdsExecutionFlow.tsx:173` -> `"/api/v1/google-ads/modules/status"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/legal/cases/PdfDownloadButton.tsx:20` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/marketing/AgentExecutor.tsx:30` -> ``/api/v1/agents/${agentId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/system/SystemAutonomousRunnerSection.tsx:20` -> ``${url}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/system/SystemAutonomousRunnerSection.tsx:227` -> ``${}/run``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/system/useSystemHealth.ts:89` -> ``${url}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/system/useSystemHealth.ts:146` -> ``${}/run``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/ui/HelpCenter.tsx:78` -> ` + "/api/assistant/chat"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/ui/SearchModal.tsx:36` -> ``/api/catalog/${coreId}/agents``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/ui/TenantSelector.tsx:45` -> `"/api/tenants"`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `components/workflows/WorkflowExecutor.tsx:85` -> ``/workflows/${config.id}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/agents/llm/llm-client.ts:48` -> `'https://api.groq.com/openai/v1/chat/completions'`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api.ts:193` -> ``${endpoint}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api.ts:325` -> ``/api/v1/agents/${id}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api.ts:362` -> ``/api/v1/agents/${agentId}/execute``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/agent-registry.ts:19` -> `AGENT_REGISTRY_SUMMARY_PATH`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/auth-v2.ts:93` -> ``${_URL}${endpoint}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/auth-v2.ts:136` -> ``${_URL}/api/v2/auth/logout``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/autopilot.ts:84` -> ``/marketing/campaigns/active?limit=${limit}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/autopilot.ts:101` -> ``/marketing/campaigns/autopilot/best-actions?objective=${encodeURIComponent(objective`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/autopilot.ts:116` -> ``/marketing/autopilot/cycle/trigger``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/base.ts:35` -> ``${endpoint}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/billing.ts:87` -> ``/api/v1/tenants/${encodeURIComponent(tid`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/billing.ts:156` -> ``/api/v1/tenants/${encodeURIComponent(tid`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/billing.ts:248` -> ``/api/v1/tenants/${encodeURIComponent(tid`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/billing.ts:309` -> ``/api/v1/tenants/${encodeURIComponent(tid`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/client.ts:70` -> `resolved`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/document-intelligence.ts:112` -> ``${APP_PREFIX(applicationId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/document-intelligence.ts:148` -> ``${APP_PREFIX(applicationId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/document-intelligence.ts:164` -> ``${APP_PREFIX(applicationId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/document-intelligence.ts:186` -> ``${APP_PREFIX(applicationId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/document-intelligence.ts:222` -> ``${APP_PREFIX(applicationId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/document-intelligence.ts:269` -> ``${APP_PREFIX(applicationId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/document-intelligence.ts:306` -> ``${APP_PREFIX(applicationId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/fetch-client.ts:64` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/googleAdsAgentOps.ts:69` -> ``${}${PREFIX}/run``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/googleAdsAgentOps.ts:104` -> ``${}${PREFIX}/latest``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/googleAdsAgentOps.ts:136` -> ``${}${PREFIX}/history?${q.toString(`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/googleAdsAgentOps.ts:159` -> ``${}${PREFIX}/${encodeURIComponent(runId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/googleAdsPreflight.ts:43` -> ``${}/api/v1/tenants/${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/googleAdsTenantReadiness.ts:58` -> ``${}/api/v1/tenants/${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/googleAdsTenantReadiness.ts:84` -> ``${}/api/v1/tenants/${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:153` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:201` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:325` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:382` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:421` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:505` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:530` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:557` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:586` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:614` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:637` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:677` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:700` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:731` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:751` -> ``/api/social/status/${tenantId}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/marketing.ts:777` -> ``/auth/${platform}/disconnect/${tenantId}``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/qa.ts:18` -> ``/auth/meta/status/${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/qa.ts:30` -> ``/auth/google/status/${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/spyfu-client.ts:102` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/stipulations.ts:104` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/stipulations.ts:330` -> `url`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/suiteOps.ts:68` -> ``${}/api/v1/tenants/build-profile``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/suiteOps.ts:86` -> ``${}/api/v1/tenants/onboard``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/suiteOps.ts:99` -> ``${}/api/v1/tenants/${encodeURIComponent(tenantId`. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- `lib/api/suiteOps.ts:110` -> ``${}/api/v1/tenants/activate``. Razon: No coincide con prefijos autenticados/publicos definidos o usa proxy/constante no resoluble estaticamente.
- ... 32 adicionales en `C:\tmp\fetch_inventory.json`.

## Plan de remediacion Phase 2 propuesto
- Numero de archivos a tocar: 27
- Estimacion de esfuerzo: L
- Patron sugerido: migrar los dominios autenticados a `chFetch` o a un wrapper equivalente por paquete, manteniendo allowlist explicita para endpoints publicos.
- Orden recomendado: P0 (`/api/bank`, `/api/v1/sic`, `/api/v2/credit`) primero; luego P1 (`/api/v1/legal`, `/api/v1/proyectos`, `/api/v1/admin`); finalmente resolver unknowns con decision de producto/arquitectura.

## Artefacto
- Inventario JSON completo: `C:\tmp\fetch_inventory.json`.
