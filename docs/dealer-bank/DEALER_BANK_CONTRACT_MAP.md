# Dealer–Bank Contract Map

**Backend base:** `https://nadakki-ai-suite.onrender.com`  
**Frontend:** `https://autos.nadakki.com`  
**OpenAPI:** v5.4.4 (~876 paths)

## Autos public (marketplace)

| Consumer | Method | Path | Backend | Frontend client | Status |
|----------|--------|------|---------|-----------------|--------|
| Search | POST | `/api/v1/autos/vehicles/search` | autos_portal_router | autos-consumer-api | PASS prod |
| Detail | GET | `/api/v1/autos/vehicles/{id}` | search_service | autos-consumer-api | **FAIL 500 prod** |
| Calculate | POST | `/api/v1/autos/finance/calculate` | autos_portal_router | lib/api/finance.ts | PASS (schema drift → local fallback) |

## Entitlements

| Consumer | Method | Path | Notes |
|----------|--------|------|-------|
| Check | POST | `/api/v1/access/entitlements/check` | Core Access router |
| Batch | GET | `/api/v1/access/entitlements/batch` | Core Access router |
| Effective | GET | `/api/v1/autos/dealers/{dealer_id}/effective-capabilities` | **New (local)** |
| Legacy dealer | GET | `/api/v1/autos/tenants/{tid}/dealers/{did}/entitlements/{cap}` | autos_portal_router |
| Frontend Phase 1 | POST | `/api/v1/autos/entitlements/check` | **Mismatch — frontend expects autos prefix** |

## Credit Hub (canonical financing)

| Action | Path |
|--------|------|
| Applications | `/api/v2/credit/applications` |
| Offers | `/api/v2/credit/applications/{id}/offers` |
| Accept | `/api/v2/credit/applications/{id}/accept` |

## Autos finance (checklist paths — not deployed)

| Path | Status |
|------|--------|
| `/api/v1/autos/finance/submit-request` | 404 |
| `/api/v1/autos/finance/offers` | 404 |

## Leads (AP-3)

| Method | Path | Prod |
|--------|------|------|
| POST | `/api/v1/autos/leads` | 401 without JWT |
| GET | `/api/v1/autos/leads/{id}` | 401 without JWT |
