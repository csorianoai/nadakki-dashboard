# Multi-agent coordination log

Append-only-ish notes across agents/branches.

## 2026-05-18 — Agent-4 — T6.1 Document Preview UI (META MVP 2)

- Branch: `feat/v3/agent-4/t6-1-document-preview-ui`
- Frontend: Bank application detail integrates `DocumentPreviewPane` (PDF via `react-pdf` + CDN pdf.js worker) behind `NEXT_PUBLIC_FEATURE_DOCUMENT_PREVIEW_UI` (default **ON** in `.env.example`).
- APIs: Reads T6.1 helpers in `lib/bank/document-preview-api.ts` (`preview.json`, `/download`, `/thumbnail`, URLs resolved from metadata when present).
- Zones: Only `components/bank/`, `hooks/`, `app/(bank)/`, `tests/bank/`, supporting `lib/` for API + env flag.
- Dealer UI: untouched.
- QA: Run `npm test -- --testPathPatterns=tests/bank/DocumentPreviewPane.test.tsx` and `npm run typecheck`.
