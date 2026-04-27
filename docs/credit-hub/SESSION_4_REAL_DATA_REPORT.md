# Forge Credit Hub Session 4 — Real Data Integration

## Status: ✅ Complete

## Endpoints Connected
- `GET /api/v2/credit/health`
- `GET /api/v2/credit/stats`
- `GET /api/v2/credit/applications`
- `POST /api/v2/credit/applications`
- `GET /api/v2/credit/applications/{id}`
- `POST /api/v2/credit/applications/{id}/process`
- `GET /api/v2/credit/applications/{id}/events`

## What Changed
- Added a real Credit Core v2 client at `lib/credit-hub/api/creditCoreClient.ts`
- Added tolerant Credit Core types at `lib/credit-hub/types/creditCore.ts`
- Added normalizers for backend response variations in `lib/credit-hub/api/normalizers.ts`
- Added TanStack Query hooks for stats, list, detail/events, create, and process
- Connected dashboard metrics and recent applications to Credit Core
- Connected applications list to Credit Core with status filters and search by applicant/id
- Connected wizard submit to `POST /api/v2/credit/applications`
- Connected detail page to application/events and added `Procesar con IA`
- Added safe rewrite for `/api/v2/credit/:path*`
- Added Session 4 validation script at `tools/credit-hub/validate-session4.ps1`

## Tenant Behavior
- `X-Tenant-ID` is sent on every Credit Core request
- Uses selected tenant from `useTenant`
- Falls back to `NEXT_PUBLIC_DEFAULT_TENANT_ID`
- Final fallback: `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242`

## Payload Safety
Wizard create payload is constrained to:
- `applicant_name`
- `applicant_email`
- `applicant_phone`
- `requested_amount`
- `vehicle_year`
- `vehicle_make`
- `vehicle_model`
- `down_payment`
- `source: "forge_dealer_portal"`

No SIC v1-only fields are sent to Credit Core v2.

## Proxy / Env Notes
- `next.config.js` now supports `BACKEND_URL || NEXT_PUBLIC_API_URL || NEXT_PUBLIC_RENDER_API_URL || "http://127.0.0.1:8000"`
- `/api/v2/credit/:path*` rewrites to the selected backend
- The local `.env.local` had a concatenated URL line; config now sanitizes that value defensively
- `.env.example` documents local `BACKEND_URL` and default tenant

## Validation
- `http://127.0.0.1:8000/health`: 200
- `http://127.0.0.1:8000/api/v2/credit/health`: 200
- Proxied `http://127.0.0.1:3014/api/v2/credit/health`: 200
- `/credit-hub/dealer`: 200
- `/credit-hub/dealer/applications`: 200
- `/credit-hub/dealer/applications/new`: 200
- `/credit`: 200
- `/sic`: 200
- `/marketing`: 200

## Automated Checks
- `npm run typecheck`: PASS
- `npm run test:run -- credit-hub`: PASS, 34 suites / 102 tests
- `npm run build`: PASS

## Known Risks
- Backend response envelopes are normalized defensively, but any future backend contract changes should be added to `normalizers.test.ts`
- Manual end-to-end creation/processing requires the backend service to remain available at the configured URL
- Untracked local file `.env.local.backup-before-port-fix` was left untouched and should not be committed
