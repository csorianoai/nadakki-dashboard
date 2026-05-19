# T6.1 Document Preview UI — Rollback (~2 minutes)

META MVP 2 — Agent-4 bank preview pane (`DocumentPreviewPane`, `react-pdf`).

## Fast disable (recommended)

Set the feature flag to **OFF** so the checklist hides preview actions and the detail dialog never mounts the viewer:

```bash
NEXT_PUBLIC_FEATURE_DOCUMENT_PREVIEW_UI=false
```

Redeploy or restart `next dev` after changing `.env*` so `NEXT_PUBLIC_*` is baked into the bundle.

Notes:

- `isDocumentPreviewUiEnabled()` treats anything other than `false`, `0`, or `off` as **enabled** (default showcase path).
- No dealer surfaces are wired to this flag; only `(bank)` application detail integrates it.

## Optional full revert

Revert the merged PR/commit that introduced:

- `components/bank/DocumentPreviewPane.tsx`
- `hooks/useDocumentPreview.ts`
- `lib/bank/document-preview-api.ts`
- `lib/env/feature-document-preview-ui.ts`
- Related tests and bank application detail / checklist wiring.

Remove dependency `react-pdf` only if dropping the viewer entirely.

## Sanity after rollback

1. `/bank/applications/[id]` loads without modal errors.
2. Document list renders without **Vista previa** buttons when flag is disabled.
3. CSP / CDN: if PDF.js worker URL is restrictive, rollback + flag-off avoids CSP noise.
