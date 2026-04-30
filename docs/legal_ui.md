# Legal UI Documentation — Worker L

## Rutas

- `/legal` — Home Legal Intelligence Core (KPIs, agentes, actividad, salud)
- `/legal/research` — Chat con agentes (`chat_asesor_legal` recomendado), RAG/citas, persistencia en `sessionStorage`
- `/legal/audit` — Audit trail, filtros, exportación CSV (UTF-8 BOM)
- Rutas adicionales existentes en `app/legal/` (p. ej. contracts) no forman parte del núcleo demo de tres pantallas pero comparten layout.

## Componentes (`components/legal/`)

- `AuditRiskBadge.tsx`
- `AuditTrailCard.tsx`
- `CitationBadge.tsx`
- `CitationCard.tsx`
- `DecisionBadge.tsx`
- `DemoAcceptanceModal.tsx`
- `DemoBannerStrong.tsx`
- `LegalAgentCard.tsx`
- `LegalAuditClient.tsx`
- `LegalDisclaimer.tsx`
- `LegalEmptyState.tsx`
- `LegalErrorState.tsx`
- `LegalHomeDashboard.tsx`
- `LegalLoadingSkeleton.tsx`
- `LegalMetricCard.tsx`
- `LegalResearchClient.tsx`
- `LegalStatusBadge.tsx`
- `LegalSubNav.tsx`
- `LegalTenantBadge.tsx`
- `LlmModeNotice.tsx`

## Hooks

- **Worker L (API `/api/legal`)**: `hooks/useLegalCore.ts` — `useLegalEffectiveTenantId`, `useLegalHealth`, `useLegalAgents`, `useLegalAuditTrail`, `useKnowledgePackStatus`, `useLegalAgentRun`
- **Re-export**: `hooks/useLegal.ts` exporta los anteriores junto con `useLegalQuickCheck`, `useKnowledgePackInfo`, `useAuditLog` (otros flujos Legal legacy vía `lib/legal-api`)

## Tipos

- `types/legal.ts` — constantes `LEGAL_API_*` e interfaces (`LegalAgent`, `Citation`, `AgentRunResponse`, `AuditTrailEntry`, etc.)

## Variables de entorno

- `NEXT_PUBLIC_API_URL` — base del backend para rewrites Next (ver `next.config.js`)
- `NEXT_PUBLIC_DEFAULT_TENANT_ID` — opcional; en **development** solo, fallback de tenant si el contexto aún no hidrata (nunca sustituye tenant en producción)
- `NEXT_PUBLIC_LEGAL_MOCK_LLM` — si es `"true"`, el badge en Research muestra modo mock

## Endpoints consumidos (mismo origen vía rewrite)

1. `GET /api/legal/health`
2. `GET /api/legal/agents`
3. `POST /api/legal/agents/{agent_id}/run`
4. `GET /api/legal/audit-trail?tenant_id=...`
5. `GET /api/legal/knowledge-pack/status`
6. (Opcional otros módulos) `POST /api/legal/quick-check` vía `useLegalQuickCheck` / `lib/legal-api`

Header obligatorio en cliente Legal Worker L: `X-Tenant-ID` (inyectado en `lib/api/legal.ts`).

## Cómo correr en local

1. Backend: `cd nadakki-ai-suite` → `uvicorn main:app --host 127.0.0.1 --port 8010`
2. Frontend: `cd nadakki-dashboard` → `npm run dev`
3. Abrir `http://localhost:3000/legal` (rewrites envían `/api/legal/*` al backend)

## Demo script Credicefi

1. `/legal` — métricas y grid de agentes
2. “Probar” en `chat_asesor_legal` → `/legal/research`
3. Consulta: p. ej. capital mínimo entidades financieras
4. Revisar citas Capa 1 / Capa 2 y metadatos RAG
5. Copiar `request_id`
6. `/legal/audit` — localizar entrada y expandir fila
7. Exportar CSV

## Limitaciones

- Varios agentes con scoring heurístico pendiente (Worker M); banner en Research si el agente ≠ `chat_asesor_legal`.

## Troubleshooting

- CORS en navegador: comprobar rewrite `/api/legal/:path*` en `next.config.js`; el browser no debe llamar a `127.0.0.1:8010` directamente.
- Sin tenant: skeleton / error tras timeout — revisar `TenantContext` y `X-Tenant-ID`.
