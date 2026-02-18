# CURSOR — FRONTEND PACK (Deploy + Env + Smoke)

## GOAL (Today)
- Ensure dashboard is production-ready with tenant switch + live toggle + audit page
- Confirm it talks to backend via NEXT_PUBLIC_API_URL
- Prepare Vercel env vars and smoke tests

## TASKS

### F1) Verify API URL wiring
- Find where API base URL is defined (NEXT_PUBLIC_API_URL)
- Ensure fallback is correct for prod: https://nadakki-ai-suite.onrender.com
- Ensure all execute requests include:
  - Header: X-Tenant-ID
  - Optional Header: X-Role
  - Body includes: dry_run boolean, payload object, tenant_id

### F2) UI: Dynamic Catalog badge (cosmetic)
Add a small badge in /agents/execute:
- "Dynamic Catalog: ON" when agents loaded from API
- else "Dynamic Catalog: OFF (fallback)"

### F3) Audit page robustness
- If GET /api/v1/audit/logs returns empty list, show "No logs yet for this tenant."
- If backend unavailable, show graceful message.

### F4) Vercel readiness checklist
- Confirm build passes: npm run build
- Confirm routes:
  - /agents/execute
  - /audit
- Confirm environment variables needed for Vercel:
  - NEXT_PUBLIC_API_URL=https://nadakki-ai-suite.onrender.com

### F5) Deploy (if Vercel already connected)
- Push main should auto-deploy
- Verify prod:
  - /agents/execute loads agents
  - executing a DRY_RUN agent works
  - /audit loads logs for selected tenant

## DELIVERABLES
- PR (or direct commit to main if approved workflow)
- Short “Frontend Release Notes” in tasks/cursor_frontend/RELEASE_NOTES.md
- Proof commands: npm run build + curl verifications
