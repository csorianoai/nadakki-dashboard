# Rollback — Visual token regression (PR #328)

## Incident

Production (`dashboard.nadakki.com`) showed unauthorized global theme changes after merge of **PR #328** (`d368268`, 2026-07-17):

- Credit Hub / Forge: unapproved dark palette, low contrast
- `/autos`: dark mode leaking globally via `data-theme` on `<html>`

## Root cause

PR #328 added autos marketplace tokens to **global** `:root` / `[data-theme="dark"]` and mounted autos `ThemeProvider` + `TenantProvider` in **root** `app/layout.tsx`, setting `data-theme` / `data-tenant` on `document.documentElement`.

That activated Forge dark rules (`[data-theme="dark"] .forge-app` in `styles/forge-tokens-v2.css`) site-wide.

**Not the cause:** `forge-tokens-v2.css` import (pre-existing since PR #35, May 2025). That file never defined `--brand`; it uses `--forge-brand-*` by design.

## Fix (this PR)

1. Move autos `ThemeProvider` + `TenantProvider` to `app/autos/layout.tsx` only
2. Scope CSS tokens to `[data-portal="autos"]` / `[data-portal="autos-modal"]`
3. Apply `data-theme` / `data-tenant` on portal container, never `documentElement`
4. Defensive cleanup of legacy `documentElement` attrs on autos mount
5. Keep `ModalProvider` + `Toaster` at root (no `useModal()` consumers outside autos)

## Rollback this fix

```bash
git revert <merge-commit-sha-of-this-pr>
```

## Roll forward if autos theme breaks again

Ensure no code path calls:

```ts
document.documentElement.setAttribute("data-theme", ...)
document.documentElement.setAttribute("data-tenant", ...)
```

Verify:

```powershell
Select-String -Path "styles\*.css" -Pattern "--brand"          # empty (expected)
Select-String -Path "app\globals.css" -Pattern "\[data-portal=`"autos`"\]"  # token defs
```

## Client cleanup (optional)

Users who toggled autos dark before fix may still have `localStorage["nadakki-autos-theme"] === "dark"`. After fix this only affects `/autos`, not Credit Hub. To force light for testing:

```js
localStorage.setItem("nadakki-autos-theme", "light");
localStorage.removeItem("nadakki-autos-theme"); // uses default light
```
