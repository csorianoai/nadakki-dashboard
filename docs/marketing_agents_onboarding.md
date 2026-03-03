# Marketing Agents Onboarding

## Grouped Catalog

| Group | Agents | Purpose |
|-------|--------|---------|
| A/B Testing | ABTestingIA | Experiment design and analysis |
| Attribution | AttributionModelIA | Multi-touch attribution modeling |
| Audience | AudienceSegmenterIA | Audience segmentation |
| Content | ContentGeneratorIA | Copy and creative generation |
| Campaign | CampaignOptimizerIA | Campaign optimization |
| Budget | BudgetForecastIA | Budget forecasting |

## Inputs / Outputs

| Agent | Inputs | Outputs |
|-------|--------|---------|
| ABTestingIA | query, variants, metric | recommendation, confidence |
| AttributionModelIA | query, touchpoints | attribution_weights |
| AudienceSegmenterIA | query, audience_data | segments |
| ContentGeneratorIA | query, format, tone | copy, headlines |
| CampaignOptimizerIA | query, channels | allocation |
| BudgetForecastIA | query, total_budget | split, projections |

## Flows

### A) Dry run from Live Panel
1. Select tenant (e.g. sf-rentals-nadaki-excursions)
2. Select agent
3. Enter JSON input: `{"query": "smoke test"}`
4. Enable Dry run
5. Execute → uses `POST /api/v1/agents/{id}/execute` (no /run)

### B) Execute Console
1. Go to /agents/execute
2. Resolve agent ID via /api/v1/agents/ids
3. POST /api/v1/agents/{resolvedId}/execute with payload

### C) Marketing pages
- Attribution, Competitive, etc. call backend execute endpoints
- Ensure X-Tenant-ID header is set

### D) Audit Runner
- Run `tools/audit/audit_agents_execute.ps1`
- Verifies execute flow; outputs to logs/audit/

## Operator Checklist

- [ ] X-Tenant-ID set on every tenant-scoped request
- [ ] Use /execute only — never /run in execute flow
- [ ] Body shape: `{ "payload": {...}, "dry_run": true }`
- [ ] Check latest audit: `logs/audit/agents_execute_audit_*.md`

## No /run in Execute Flow

**The execute flow uses only `/api/v1/agents/{id}/execute`.**  
The `/run` path (tenants/{tid}/agents/{aid}/run) is for observable runs with SSE; it is **not** used in the standard execute flow. The dashboard proxy blocks /run and returns 400 with "use /execute instead".

## Latest Audit Report

Path: `logs/audit/agents_execute_audit_<timestamp>.md` (newest file by timestamp)

Run the audit:
```powershell
.\tools\audit\audit_agents_execute.ps1 -BaseUrl http://localhost:3000 -Tenant sf-rentals-nadaki-excursions
```
