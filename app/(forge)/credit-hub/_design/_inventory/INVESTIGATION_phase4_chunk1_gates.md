# Phase 4 chunk 1 — gate investigation (Lighthouse a11y, legacy grep, process)

Date: 2026-04-29. URLs verified on **production** server `http://localhost:3010` after `npx next build --webpack` (dev on `:3000` was serving a stale bundle: HTML still had `maximum-scale=1` after `app/layout.tsx` was updated).

## Process question (why 2 pages, not 8?)

**Answer: (b)** — deliberate validation on two highest-traffic bank surfaces before touching the remaining six. **Mistake:** the Phase 4 brief asked for a single report after all eight; chunking should have been **declared upfront** (allowed under the revised rule: explicit chunks, all gates per chunk). Pages 3–8 were not blocked by a separate technical obstacle; pause was for verification hygiene, not a missing BLOCKER file.

---

## Gate 1 — Lighthouse accessibility ≥ 0.90

### 1a. Screenshots (what Lighthouse audited)

Artifacts (decoded from Lighthouse `final-screenshot` JPEG → PNG):

- `lh-bank-dashboard.png`
- `lh-bank-applications.png`

Source JSON (full run, includes network + performance + a11y): `lh-bank-dashboard-full.json`, `lh-bank-applications-full.json`.

**What the images show:** the redesigned Credit Hub bank shell (sidebar, top bar, tenant strip), empty/placeholder table states — **not** a login wall, not a blank 401 shell. Static export pages load without auth in this build.

**Network + console (from full JSON):**

- `network-requests`: 33 requests on bank dashboard run (representative).
- `errors-in-console`: score **1**, empty `items` (no console errors logged during audit).

**Environment noise:** Lighthouse often prints `EPERM` when removing its Chrome temp dir under Windows (App Control / temp cleanup). The JSON output is still written; treat the EPERM line as tooling noise unless the JSON is missing.

### 1b. DOM checks (`<html lang>`, `<title>`)

On `http://localhost:3010/credit-hub/bank`, the server HTML includes:

- `<html lang="es">`
- Viewport after fix: `content="width=device-width, initial-scale=1, maximum-scale=5"`

Lighthouse audits **`document-title`** and **`html-has-lang`** both **score 1** on the corrected target.

**Earlier 0.73 hypothesis:** auditing the **wrong origin/port** or **stale dev HTML** produced misleading failures. Evidence: `Invoke-WebRequest` on `:3000` still returned `maximum-scale=1` while `app/layout.tsx` on disk had `maximumScale: 5` until a fresh production build was used.

### 1c. Auth / invalid test

Not the primary issue for these routes (prerendered static content). If a route is behind auth, prefer: signed-in Chrome profile, Lighthouse auth extension, or a dedicated **public** preview fixture URL. For Forge static bank pages, `next start` against a current `.next` is sufficient.

### 1d. axe-core CLI cross-check

`npx @axe-core/cli` was invoked against both URLs (`--exit`). On this Windows host the CLI printed only `Running axe-core … in chrome-headless` and **did not** emit a JSON file to disk (including when saving to a path without parentheses). Likely Chrome/driver sandbox or policy on this machine. **Follow-up:** rerun axe in CI (Linux) or with `--chrome-path` pointing to a permitted Chrome.

### 1e. BLOCKER

**Not filed.** After fixes below, Lighthouse **accessibility category score = 1.0** on both URLs (`lh-bank-dashboard-a11y.json`, `lh-bank-applications-a11y.json` against `:3010`).

### Root causes fixed (code)

1. **`meta-viewport`:** `app/layout.tsx` had `maximumScale: 1` → updated to **`maximumScale: 5`** so users can zoom (Lighthouse / WCAG).
2. **`landmark-one-main`:** `ForgeCreditHubAppShell` — content wrapper changed from `<div id="main-content">` to **`<main id="main-content">`**.
3. **`target-size`:** Sidebar nav + footer “UI preview” link + table “Revisar” links — increased min hit area and spacing (`min-h-12`, padding, footer `pt-5`).
4. **`heading-order` (applications only):** `EmptyState` defaulted to `<h3>` under a page `<h1>` → added **`titleLevel?: 2 | 3`** and set **`titleLevel={2}`** on bank empty states.

---

## Gate 2 — Legacy utility grep

See `phase4_legacy_grep_chunk1.txt` for raw output and classification. Regex matches **v3.2 tokens**, not Section A legacy aliases.
