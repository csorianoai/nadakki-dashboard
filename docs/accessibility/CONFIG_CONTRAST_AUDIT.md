# CONFIG CONTRAST AUDIT — Legal Module

**Repo:** nadakki-dashboard
**Date:** 2026-06-26
**Scope:** Legal config page + legal cockpit components with contrast violations
**Existing fix:** `styles/legal-contrast.css` (scoped to `.legal-surface`)

---

## 1. Config Page: Contrast Violations

**File:** `app/(forge)/legal/config/page.tsx`

This page renders INSIDE the `.legal-surface` wrapper (via `LegalLayoutClient.tsx`), BUT uses `bg-white` cards and `text-slate-500` labels — both are light-mode classes that produce **invisible or near-invisible text** on the dark legal surface.

| Line | Clase actual | Contexto | Riesgo | Reemplazo recomendado |
|------|-------------|----------|--------|----------------------|
| 17 | `bg-white rounded-lg shadow border` | Card container | **CRITICAL** — white card on `--legal-bg: #0d1320` looks correct BUT inner text uses slate-500 on white, which is fine. However the `shadow` and `border` (default gray) are invisible on dark. | `bg-zinc-900 rounded-lg border border-zinc-800` (legal-contrast.css overrides to tokens) |
| 21 | `bg-white rounded-lg shadow border` | Second card | **CRITICAL** — same issue | Same fix |
| 26 | `text-slate-500` | `<dt>` label "Version" | **HIGH** on dark bg — slate-500 (#64748b) on white = 4.6:1 (barely AA). On dark if bg-white override fails = invisible | `text-zinc-400` (legal-contrast.css overrides to `#c2cbd6`) |
| 30 | `text-slate-500` | `<dt>` label "Estado" | **HIGH** | Same |
| 41 | `text-slate-500` | `<dt>` "Verificado por" | **HIGH** | Same |
| 47 | `text-slate-500` | `<dt>` "Fecha verificacion" | **HIGH** | Same |
| 52 | `text-slate-500` | `<dt>` "Hash SHA-256" | **HIGH** | Same |
| 58 | `text-slate-500` | `<dt>` "Leyes codificadas" | **HIGH** | Same |
| 62 | `text-slate-500` | `<dt>` "Articulos codificados" | **HIGH** | Same |
| 66 | `text-slate-500` | `<dt>` "Areas de practica" | **HIGH** | Same |
| 33 | `text-green-700` | Verified status | **MEDIUM** — green-700 on white is OK, but on dark bg would be hard to read | `text-emerald-400` |
| 35 | `text-amber-700` | Unverified status | **MEDIUM** | `text-amber-400` |

### Recommended Fix Strategy

The config page uses `bg-white` which works if the `.legal-surface` CSS override captures it — but `legal-contrast.css` currently does NOT have a rule for `.bg-white`. Two options:

**Option A (Preferred):** Change the config page to use dark Tailwind classes (`bg-zinc-900`, `text-zinc-400`, `border-zinc-800`) which `legal-contrast.css` already overrides to proper tokens. 1 file change.

**Option B:** Add `.legal-surface .bg-white { background-color: var(--legal-surface-1) !important; }` to `legal-contrast.css`. Risky — could affect other modules if they ever nest inside `.legal-surface`.

---

## 2. PracticeAreaConfig Contrast Issues

**File:** `components/legal/PracticeAreaConfig.tsx`

| Line | Clase actual | Contexto | Riesgo | Reemplazo recomendado |
|------|-------------|----------|--------|----------------------|
| 14 | `text-[var(--color-text-secondary)]` | Description paragraph | **UNKNOWN** — depends on whether `--color-text-secondary` is defined. If undefined, inherits parent color (likely fine) | Verify CSS variable exists; fallback to `text-zinc-400` |
| 29 | `opacity-50` | Inactive practice areas | **HIGH** — opacity-50 on already-muted text drops contrast below WCAG-AA | Use `opacity-60` minimum, or dedicated `text-zinc-500` instead |
| 34 | `text-[var(--color-success-strong)]` | Active indicator dot | **UNKNOWN** — depends on variable | Verify; fallback to `text-emerald-400` |
| 40 | `text-[var(--color-text-tertiary)]` | Footer note | **UNKNOWN** — depends on variable | Verify; fallback to `text-zinc-500` |
| 28 | `bg-[var(--color-surface-1)]` | Active area card bg | **UNKNOWN** — depends on variable | Verify; fallback to `bg-zinc-900` |
| 28 | `border-[var(--color-border-subtle)]` | Card borders | **UNKNOWN** — depends on variable | Verify; fallback to `border-zinc-700` |

### CSS Variable Investigation

These CSS variables (`--color-text-secondary`, `--color-surface-1`, etc.) are NOT defined in:
- `tailwind.config.ts` (uses Tailwind theme tokens, not CSS variables with these names)
- `styles/legal-contrast.css` (defines `--legal-*` tokens, not `--color-*`)
- `app/(forge)/credit-hub/forge-globals.css` (not checked but unlikely to match)

**Risk:** If these variables are undefined, the component falls back to browser defaults (likely `inherit` or transparent). Need to verify where `--color-*` variables come from, or replace with Tailwind utility classes.

---

## 3. Cockpit Components — Contrast Issues in Dark Context

These components render inside `.legal-surface` (dark bg). The `legal-contrast.css` handles many zinc overrides, but some escape.

| Archivo | Linea | Clase actual | Riesgo | Notas |
|---------|-------|-------------|--------|-------|
| `LegalKPIRow.tsx` | 48 | `text-zinc-500` | LOW — `legal-contrast.css` overrides `.text-zinc-500` to `var(--legal-text-secondary)` | Already covered |
| `LegalKPIRow.tsx` | 63 | `text-zinc-500` | LOW | Already covered |
| `PerformanceMetrics.tsx` | 58 | `text-zinc-500` | LOW | Already covered |
| `PerformanceMetrics.tsx` | 94 | `text-zinc-500` | LOW | Already covered |
| `PerformanceMetrics.tsx` | 101 | `text-zinc-400` | LOW | Already covered (`#c2cbd6`) |
| `PerformanceMetrics.tsx` | 159 | `text-zinc-500` | LOW | Already covered |
| `PerformanceMetrics.tsx` | 176 | `text-zinc-600` | MEDIUM | `legal-contrast.css` overrides to `#8c97a6` — acceptable |
| `PerformanceMetrics.tsx` | 188 | `text-zinc-600` | MEDIUM | Same |
| `PerformanceMetrics.tsx` | 206 | `text-zinc-600` | MEDIUM | Same |
| `LegalTrustPanel.tsx` | 70 | `text-zinc-600` | MEDIUM | Disclaimer text. Covered by CSS. |
| `LegalCockpitShell.tsx` | 14 | `text-zinc-400` | LOW | Already covered |

**Assessment:** Most cockpit components use `text-zinc-*` classes that `legal-contrast.css` already overrides. No critical gaps in cockpit contrast.

---

## 4. Out-of-Scope Pages (NOT legal module)

These pages have contrast issues but are NOT inside `.legal-surface`:

| Archivo | Issue | Scope |
|---------|-------|-------|
| `app/admin/config/page.tsx` | `text-gray-300/400` throughout | Admin module — separate scope |
| `app/settings/page.tsx` | `text-gray-400` throughout | Global settings — separate scope |
| `app/audiences/page.tsx` | `text-gray-400` | Marketing module — separate scope |

**Decision:** Do NOT touch. These are outside legal module scope.

---

## 5. Scope Summary

### Files Safe to Touch (Legal Module)

| Archivo | Accion | Riesgo | legal-contrast.css suficiente? |
|---------|--------|--------|-------------------------------|
| `app/(forge)/legal/config/page.tsx` | Replace `bg-white` with dark classes, `text-slate-500` with `text-zinc-400` | LOW | YES after fix — zinc classes get overridden |
| `components/legal/PracticeAreaConfig.tsx` | Replace `--color-*` CSS variables with Tailwind zinc/emerald classes | LOW | YES after fix |

### Files NOT to Touch

| Archivo | Razon |
|---------|-------|
| `styles/legal-contrast.css` | Prefer NOT to add bg-white override (scope leak risk). Fix at source instead. |
| `app/admin/config/page.tsx` | Out of scope (admin module) |
| `app/settings/page.tsx` | Out of scope (global) |
| Any cockpit component | Already covered by legal-contrast.css |

---

## 6. Existing Tokens Coverage

`legal-contrast.css` already overrides:
- `text-zinc-500` -> `var(--legal-text-secondary)` = `#a6b0c4` (~7:1 on `--legal-bg`)
- `text-zinc-600` -> `#8c97a6` (~5.5:1 on `--legal-bg`)
- `text-zinc-400` -> `#c2cbd6` (~9:1 on `--legal-bg`)
- `text-zinc-300` -> `var(--legal-text)` = `#e9ecf6` (~14:1 on `--legal-bg`)
- `bg-zinc-900` -> `var(--legal-surface-1)` = `#181f31`
- `bg-zinc-800` -> `var(--legal-surface-2)` = `#1d2538`
- `border-zinc-800` / `border-zinc-700` -> `var(--legal-border)` = `#2a3450`

**NOT covered:** `bg-white`, `text-slate-500`, `text-green-700`, `text-amber-700`, CSS variables `--color-*`.
