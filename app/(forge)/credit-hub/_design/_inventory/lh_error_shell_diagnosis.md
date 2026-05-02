# Lighthouse `html#__next_error__` on `/credit-hub/dealer/applications` — diagnosis (Phase 5 Item 1 follow-up)

## Symptom

A prior Lighthouse CLI run produced accessibility JSON where failing nodes referenced **`html#__next_error__`** (missing `<title>`, `lang`, `<main>`). **`curl.exe`** to the same base URL returned **HTTP 200** with normal HTML (`lang="es"`, `<title>`, `<main id="main-content">`).

## Investigation (2026-05-01)

1. **Stopped** processes listening on common Next ports (`3000`, `3010`, `3012`, `3013`, `3015`) via `Get-NetTCPConnection` + `Stop-Process`.
2. **Removed** `.next` and ran **`npx next build --webpack`** (clean production bundle).
3. Started **`npx next start -p 3015`** (single server instance).
4. **`curl.exe -sI`** and **`curl.exe -s`** to `http://localhost:3015/credit-hub/dealer/applications`:
   - **200** with full app shell HTML (not the error document).
   - Payload includes RSC **`BAILOUT_TO_CLIENT_SIDE_RENDERING`** and Suspense fallback skeletons for the client page — expected for this route, not an error boundary.
5. **Lighthouse** (accessibility-only, `TEMP`/`TMP` → `tmp\lh-tmp-p5`, `--user-data-dir=tmp\lh-chrome-p5`) against the same URL:
   - **`categories.accessibility.score`: `1`**
   - CLI still exited **`1`** on Windows **`EPERM`** during `chrome-launcher` temp cleanup (known); JSON written successfully.

## Conclusion

| Candidate | Verdict |
|-----------|---------|
| **(a) Stale `.next` / stale or competing `next start`** | **Most likely** for the original bad capture. Clean `rm -rf .next` + single fresh server produced a **valid** DOM for Lighthouse. |
| **(b) URL-specific runtime bug triggered only by Lighthouse** | **Not reproduced** after clean rebuild; no server stderr correlated with the audit request. |
| **(c) Ambient flake** | Possible as a secondary factor; does not explain `__next_error__` without (a). |

**Operational lesson:** treat **CAT E** first for false Lighthouse “empty shell” results: **stop all local Next processes on audit ports**, **`rm -rf .next`**, **one `next build` + one `next start`**, then audit. Documented in `COMPONENTS.md` under Lighthouse SOP.

## Artifact

Valid run (post-clean): `lh-dealer-applications-list-a11y.json` in this folder — accessibility score **1.0**.
