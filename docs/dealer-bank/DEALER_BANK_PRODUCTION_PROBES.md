# Dealer–Bank Production Probes

**Run date:** 2026-07-22 UTC  

| Probe | URL | Result |
|-------|-----|--------|
| Health | GET `/health` | 200 |
| Vehicle search | POST `/api/v1/autos/vehicles/search` | 200 |
| Vehicle detail | GET `/api/v1/autos/vehicles/1` | **500** |
| Leads create | POST `/api/v1/autos/leads` (no auth) | 401 |
| Finance calculate | POST `/api/v1/autos/finance/calculate` | 200 (prior audit) |
| AP-5 smoke | autos.nadakki.com 20 gates | 20/20 (prior audit) |

### P0-001 error excerpt (production)

```
PostgresSyntaxError: syntax error at or near ":"
SQL: ... WHERE v.id = :vehicle_id::uuid
```

**Fix:** `CAST(:vehicle_id AS uuid)` — implemented locally, not deployed.
