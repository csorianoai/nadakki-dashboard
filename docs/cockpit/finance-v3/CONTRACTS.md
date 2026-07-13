# CONTRACTS — Finance Cockpit v3.1

**Phase:** F1  
**Canonical module:** `lib/cockpit/finance-v3/`

---

## Envelope (all panels)

Every finance cockpit API response consumed by UI must normalize to:

```typescript
{
  data: T;
  data_source: "live" | "derived" | "estimated" | "demo" | "none";
  as_of: string;              // ISO-8601
  freshness_seconds?: number;
  is_estimated: boolean;
  currency?: "DOP" | "USD";   // required on monetary contracts
  period?: { start: string; end: string };
  warnings?: string[];
}
```

Validation: Zod schemas in `lib/cockpit/finance-v3/contracts/*`.  
Runtime: `parseContract()` throws `ContractViolationError` on invalid payload.

### Rules

| Rule | Enforcement |
|------|-------------|
| `data_source="demo"` | Yellow `DataTruthBadge` — never present as live |
| `data_source="none"` | Grey badge "sin data" — **not** coerced to `0` for finance |
| `0` is valid | e.g. 18 Free tenants → `RD$0.00` with `data_source=live` |
| `null` = unknown | Distinct from zero in tenant rows (`next_renewal_at`, etc.) |

---

## data_source → DataTruthBadge

| data_source | Badge level | Color | Label |
|-------------|-------------|-------|-------|
| `live` | `REAL` | Verde | Real |
| `derived` | `DERIVED` | Azul suave | Derivado |
| `estimated` | `ESTIMATED` | Naranja | est. |
| `demo` | `DEMO` | Amarillo | Demo |
| `none` | `NONE` | Gris | sin data |

Implementation: `lib/cockpit/finance-v3/data-source.ts` + extended `lib/credit-hub/honesty/data-truth.ts`.

---

## Contract catalog

| Contract | Zod schema | Backend endpoint | Phase |
|----------|------------|------------------|-------|
| PopulationSummary | `populationSummaryEnvelopeSchema` | `GET /population/summary` | F4 — **live** (raw normalizer exists) |
| PopulationByCore | `populationByCoreEnvelopeSchema` | `GET /population/by-core` | F4 |
| PopulationByFamily | `populationByFamilyEnvelopeSchema` | `GET /population/by-family` | F4 |
| PopulationByEntity | `populationByEntityEnvelopeSchema` | `GET /population/by-entity-type` | F4 |
| PopulationByCountry | `populationByCountryEnvelopeSchema` | `GET /population/by-country` | F4 |
| DigitalAgents | `digitalAgentsEnvelopeSchema` | `GET /population/digital-agents` | F4 |
| TopTenants | `topTenantsEnvelopeSchema` | `GET /population/top-tenants` | F4 |
| TopUsers | `topUsersEnvelopeSchema` | `GET /population/top-users` | F4 |
| FinanceKpis | `financeKpisEnvelopeSchema` | `GET /finance/kpis` | **F3 backend** (new PR) |
| MrrByCore | `mrrByCoreEnvelopeSchema` | `GET /finance/mrr/by-core` | F3 |
| TenantFinancialsList | `tenantFinancialsListEnvelopeSchema` | `GET /finance/tenant-financials` | F3 |
| RegistryProfessions | `registryProfessionsEnvelopeSchema` | `GET/POST/PATCH /registry/professions` | **F5 backend** |
| RegistryEntityTypes | `registryEntityTypesEnvelopeSchema` | `GET/POST/PATCH /registry/entity-types` | F5 |
| TenantCoreMatrix | `tenantCoreMatrixEnvelopeSchema` | `GET /finance/matrix` | **F6 backend** |
| TenantConsolidated | `tenantConsolidatedEnvelopeSchema` | `GET /finance/tenants/{id}/overview` | **F7 backend** |

### Raw vs envelope (population)

Production population router returns **flat** JSON (`routers/cockpit_population_router.py`).  
Frontend normalizes via `normalizePopulationSummary()` and future `normalize/*` helpers in F4.

Finance/registry/matrix/tenant endpoints will return v3.1 envelope **from backend** when implemented (F3/F5/F6/F7).

---

## Backend strategy (F1 decision)

- **Do not wait** for external PR merges.
- **F3** creates new backend PR: `/api/v1/cockpit/finance/*` (Pydantic, service, router, tests, audit).
- **F5** creates new backend PR: `/api/v1/cockpit/registry/*` CRUD + 403 on non-superadmin mutations.
- **F6/F7** add aggregated endpoints (`matrix`, `tenants/{id}/overview`).
- Migrations: next id **088+** only. No edits to 077–087.
- SECURITY DEFINER naming: `cockpit_finance_*`, `cockpit_registry_*`.

---

## Feature flags

| Flag | Default | Phase |
|------|---------|-------|
| `NEXT_PUBLIC_COCKPIT_FINANCE_ENABLED` | `true` (unset) | F2 |
| `NEXT_PUBLIC_COCKPIT_FINANCE_REGISTRY_ENABLED` | `false` | F5 |
| `NEXT_PUBLIC_COCKPIT_FINANCE_MATRIX_ENABLED` | `false` | F6 |
| `NEXT_PUBLIC_COCKPIT_FINANCE_TENANT_DETAIL_ENABLED` | `false` | F7 |

Defined in `lib/cockpit/finance-v3/flags.ts`.

---

## Fixtures

- Tests use synthetic UUIDs only (`11111111-…`, `22222222-…`).
- **Protected tenants never appear in fixtures** (Credicefi, Banco Piloto RD, Nadakki Demo).
