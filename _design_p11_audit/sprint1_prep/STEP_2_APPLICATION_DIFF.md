# Step 2 — Application Diff: `tokens.css` Current vs NEW

**Date:** 2026-05-10
**Sprint:** 1 / P11-01 (pre-work for Step 2)
**Compared files:**
- **CURRENT** (post Cursor Step 1): `app/(forge)/credit-hub/_design/tokens.css` — institutional v3.2, scoped to `.forge-app`, light surfaces + `--forge-gray-*` scale
- **NEW** (this pre-work): `_design_p11_audit/sprint1_prep/NEW_tokens.css` — light-first Navy Inverso + V1 Slate Navy dark toggle, scoped to `:root` (proto-style)

**TL;DR:** the prototype and production are speaking **two different design-token languages**. Production uses `--forge-brand-{50..950}` + `--forge-gray-{50..900}` + `--forge-surface-{page,card,raised,sunken}` + `--forge-space-N` + `--forge-radius-X` + `--forge-shadow-X`. Prototype uses `--forge-tenant-primary` + `--forge-ink-{1..4}` + `--forge-bg-{base,raised,elev}` + `--sN` + `--r-X` + `--shN`. Going forward there are **3 possible postures** (see end of doc). DEC1-3 only resolve the ink-* collision and slug naming; the broader naming reconciliation is an unresolved P11-01 sub-decision.

---

## 1. Scope strategy

| Aspect | CURRENT | NEW | Implication |
|---|---|---|---|
| CSS selector scope | `.forge-app { … }` | `:root { … }` | Production scopes to a class to coexist with legacy globals. NEW pollutes `:root`. **Production-ready posture should re-scope NEW to `.forge-app`.** |
| Theme toggle | none (light only; dealer dark dormant) | `[data-theme="dark"]` overrides | NEW introduces real theme toggle (DEC2). Production currently has none. |
| Tenant override | `.forge-app[data-tenant="slug"]` | `[data-tenant="slug"]` (root-scoped) | When NEW is rescoped to `.forge-app`, tenant override selectors collapse to current pattern. |
| Light/dark polarity | Light-default, dark dormant (commented) | Light-default, dark active toggle | Aligned with DEC2. |

---

## 2. Tenant slug alignment (DEC3)

| Tenant | CURRENT slug | NEW slug | Action |
|---|---|---|---|
| Credicefi | `credicefi` | `credicefi` | ✅ NO CHANGE |
| Banco Piloto RD | `banco-piloto` | `banco-piloto-rd` | 🔄 **RENAME** — SQL + frontend constants migration (DEC3 noted; ~15 files affected per existing code search) |
| TestBank MX | `test-mx-tenant-uuid` | `testbank-mx` | 🔄 **RENAME** — same |

---

## 3. Vars in NEW that DO NOT exist in CURRENT (ADD)

### 3.1 Tenant accent (semantic) — entire family is new
```
--forge-tenant-primary          (analogous to --forge-brand-500 in CURRENT)
--forge-tenant-primary-strong   (analogous to --forge-brand-600)
--forge-tenant-primary-soft     (NEW — translucent accent; production has no equivalent)
--forge-tenant-dark             (analogous to --forge-brand-900)
```
**ADD all 4.** Decision: keep `--forge-brand-{50..950}` (CURRENT, 11-stop ramp) AND add `--forge-tenant-*` (NEW, 4-stop semantic) — they're not equivalent ramps. NEW's semantic 4 are derived from CURRENT's ramp positions but expose intent (`primary`/`strong`/`soft`/`dark`) instead of numeric stops.

### 3.2 Ink hierarchy (text levels) — entire family is new
```
--forge-ink-1   #1E3A8A     (primary text)
--forge-ink-2   #1E40AF     (secondary)
--forge-ink-3   #1D4ED8     (tertiary / labels)
--forge-ink-4   #3B82F6     (disabled)
```
**ADD all 4.** DEC1 freed these by renaming the legacy grayscale `--forge-ink-50..900` → `--forge-gray-50..900` in Step 1. Step 2 lands the new 4-level semantics.

### 3.3 Surface scale — renamed but partially overlapping
```
--forge-bg-base         (analogous to CURRENT --forge-surface-page)
--forge-bg-raised       (analogous to CURRENT --forge-surface-card / --forge-surface-raised)
--forge-bg-elev         (analogous to CURRENT --forge-surface-raised)
--forge-bg-overlay      (NEW — translucent hover state)
--forge-bg-overlay-strong (NEW)
```
**ADD all 5.** CURRENT has `surface-page/card/raised/sunken/overlay` but the overlay there is `rgba(15,23,41,0.48)` (modal scrim), NOT a hover tint. NEW's overlay is `rgba(30,58,138,0.05)` (hover tint). **These serve different purposes — keep both, document the disambiguation.**

### 3.4 Lines / borders — new triad
```
--forge-line-1   rgba(30,58,138,0.12)   (subtle, navy-tinted)
--forge-line-2   rgba(30,58,138,0.18)   (default)
--forge-line-3   rgba(30,58,138,0.28)   (strong / hover)
```
**ADD all 3.** CURRENT has `--forge-border-subtle / -default / -strong` (full `border` shorthand) — semantically similar but value-only (NEW just gives color, CURRENT gives full `1px solid color`). Both can coexist if we want flexibility.

### 3.5 Shadows — both names AND value style differ
```
--sh-1     soft Stripe-style
--sh-2     soft Stripe-style
--sh-3     soft Stripe-style
--sh-modal soft Stripe-style
```
**Production:** `--forge-shadow-xs/sm/md/lg/none` with rgba(15,23,41) values, similar soft style.
**NEW:** `--sh-{1,2,3,modal}` with rgba(15,23,42) values.

**Action: NAMING DECISION REQUIRED.** Two options:
- **(A) Add NEW names alongside CURRENT names** — both `--sh-1` and `--forge-shadow-xs` exist, slow migration. Risk: duplication, drift over time.
- **(B) Rename NEW values to match CURRENT names** — `--sh-1` → `--forge-shadow-xs` etc. Cleaner long-term; requires editing prototype-derived components later to use the new names.

Recommend **(B)** for consistency with CURRENT's convention. Pre-work `NEW_tokens.css` shows the prototype-style names; production migration should rename.

### 3.6 Space / radius — proto short prefix vs production long
| Token role | NEW (short) | CURRENT (long) |
|---|---|---|
| Space 4px | `--s1` | `--forge-space-1` |
| Space 8px | `--s2` | `--forge-space-2` |
| Space 12px | `--s3` | `--forge-space-3` |
| Space 16px | `--s4` | `--forge-space-4` |
| Space 20px | `--s5` | `--forge-space-5` |
| Space 24px | `--s6` | `--forge-space-6` |
| Space 32px | `--s8` | `--forge-space-8` |
| Space 40px | `--s10` | `--forge-space-10` |
| Space 48px | `--s12` | `--forge-space-12` |
| Space 64px | `--s16` | `--forge-space-16` |
| Space 80px | `--s20` | `--forge-space-20` |
| Space 96px | — | `--forge-space-24` (CURRENT-only) |
| Radius 4px | `--r-sm` | `--forge-radius-sm` |
| Radius 6px | `--r-md` | `--forge-radius-md` |
| Radius 8px | `--r-lg` | `--forge-radius-lg` |
| Radius 12px | `--r-xl` | — (CURRENT-only `--forge-radius-pill: 9999px`) |

**Action: SAME NAMING DECISION (A) vs (B) as shadows.** Recommend **(B)**: rename NEW to `--forge-space-N` and `--forge-radius-X`. Keeps CURRENT's `--forge-space-24` (96px) and adds new `--forge-radius-xl` (12px).

### 3.7 Bg-glass — NEW only
```
--forge-bg-glass  rgba(255,255,255,0.05)  (referenced in Component Library.html inline list)
```
**Wait — this is actually missing from the prototype's `tokens.css` itself; it was only in the Component Library's `COLOR_TOKENS` doc literal.** No need to add.

### 3.8 Hero text size
```
--forge-text-hero  96px
```
**ADD.** CURRENT has up to `--forge-text-4xl: 48px`. Hero is needed for the Bank Dashboard hero metric "RD$ 14.2M" at 96/600.

### 3.9 2xs text size
```
--forge-text-2xs  10px
```
**ADD.** CURRENT has `--forge-text-xs: 11px` as smallest. Proto labels (label-eyebrow, ticker labels) use 10px.

### 3.10 Easing curves
```
--ease-spring  cubic-bezier(0.22, 1, 0.36, 1)
--ease-fast    cubic-bezier(0.4, 0, 0.2, 1)
```
CURRENT has `--forge-ease-out`, `--forge-ease-in-out` with similar curves but different exact values. **DECISION (A) vs (B) again.** Recommend (B): rename NEW to use the `--forge-ease-*` namespace, evaluate whether the curve values should match production's (which are themselves derived from earlier design iterations) or proto's (the validated motion spec from the design pack).

### 3.11 Viz palette — naming collision
```
NEW:     --viz-1 .. --viz-6  (no forge prefix)
CURRENT: --forge-viz-1 .. --forge-viz-6
```
**Action: RENAME NEW to `--forge-viz-{1..6}`.** Production convention wins. Pre-work file shows the bare names for fidelity; Step 2 should rename. Values also differ:

| | NEW | CURRENT |
|---|---|---|
| viz-1 | `#4F8FD9` | `#2e5f97` |
| viz-2 | `#22C55E` | `#0a7ea4` |
| viz-3 | `#F59E0B` | `#0f7a3e` |
| viz-4 | `#A78BFA` | `#c8940a` |
| viz-5 | `#F472B6` | `#8a4fbf` |
| viz-6 | `#2DD4BF` | `#b5201e` |

CURRENT is "colorblind-safe" per the comment; NEW is the proto's brighter palette. **DECISION REQUIRED:** keep CURRENT (a11y-vetted) or adopt NEW (visual fidelity to the prototype)? Recommend a **hybrid**: keep CURRENT's palette in production, document NEW's as the "preview/marketing" palette for the design pack.

---

## 4. Vars in CURRENT that DO NOT exist in NEW (KEEP / REMOVE)

### 4.1 Brand ramp (11 stops) — KEEP
```
--forge-brand-{50,100,200,300,400,500,600,700,800,900,950}
```
**KEEP all 11.** Production uses these for sidebar gradients (`forgeBrand-900 → forgeBrand-950`), focus rings, hover backgrounds in components. NEW's 4-stop `--forge-tenant-*` semantic is a complement, not a replacement. Keep both.

### 4.2 Gray ramp (9 stops, post-Step 1) — KEEP
```
--forge-gray-{50,100,200,300,400,500,600,700,800,900}
```
**KEEP all 10.** Used for borders (`--forge-border-subtle = 1px solid var(--forge-gray-200)`), neutral chrome, body text on light surfaces (`color: var(--forge-gray-800)` on body). NEW's `--forge-ink-{1..4}` is for text hierarchy, not for grayscale chrome (post-DEC1).

### 4.3 Semantic 50/500/700 — KEEP, EXTEND
```
--forge-success-50/500/700      (CURRENT 3-stop)
--forge-warning-50/500/700
--forge-danger-50/500/700
--forge-info-50/500/700
```
NEW has `--forge-success-500 / -bg / -line` (only 1 hex + 2 rgba). **Decision:** keep CURRENT's 3-stop; supplement with NEW's `-bg` and `-line` rgba derivatives. So final shape per semantic:
```
--forge-success-50       (CURRENT — light tinted bg for pages/cards)
--forge-success-500      (CURRENT — same hex stays)
--forge-success-700      (CURRENT — darker for text on light)
--forge-success-bg       (NEW — translucent for status pills)
--forge-success-line     (NEW — translucent for borders)
```
This is the cleanest superset. Action: **ADD** NEW's `-bg` and `-line`; **KEEP** CURRENT's `-50/500/700`.

**Caveat:** the semantic HEX values differ between CURRENT and NEW:

| | CURRENT 500 | NEW 500 |
|---|---|---|
| success | `#0f7a3e` | `#22C55E` |
| warning | `#b7791f` | `#F59E0B` |
| danger | `#b5201e` | `#EF4444` |
| info | `#1f60b5` | `#60A5FA` |

NEW's values are brighter/Tailwind-style; CURRENT is muted/institutional. **DECISION REQUIRED.** Recommendation: keep CURRENT (institutional, banking-appropriate); update only `-bg` and `-line` derivatives to match.

### 4.4 Accent — KEEP, MERGE
```
CURRENT: --forge-accent-gold #c8940a  ·  --forge-accent-teal #0a7ea4
NEW:     --forge-accent-gold #D4A655  +  --forge-accent-gold-bg / -line  (no -teal)
```
**Action:** KEEP `--forge-accent-teal` (CURRENT). **UPDATE** value of `--forge-accent-gold` — decision between institutional `#c8940a` vs warmer `#D4A655`. Recommend keep `#c8940a` for consistency, ADD `-bg` and `-line` rgba derivatives.

### 4.5 Surface page/card/raised/sunken — RENAME / MERGE
```
--forge-surface-page    (= --forge-bg-base in NEW)
--forge-surface-card    (= --forge-bg-raised in NEW)
--forge-surface-raised  (= --forge-bg-elev in NEW)
--forge-surface-sunken  (≈ a darker tint; NEW has no analog — use --forge-bg-overlay-strong?)
--forge-surface-overlay (modal scrim; NEW's overlay is hover tint, NOT equivalent — see 3.3 above)
```
**Action:** during migration, replace `--forge-surface-page` → `--forge-bg-base` etc. in all consumers. Either:
- (A) keep CURRENT names as aliases that resolve to NEW (e.g. `--forge-surface-page: var(--forge-bg-base)`) — backwards compat
- (B) hard-rename in components — clean but high blast radius

Recommend **(A)** in Step 2; remove aliases in later sprint after all consumers migrated.

### 4.6 Type scale extras — KEEP
```
--forge-leading-tight/snug/normal/relaxed   (CURRENT-only)
--forge-tracking-tight/normal/wide/wider    (CURRENT-only)
--forge-weight-regular/medium/semibold/bold (CURRENT-only)
```
**KEEP all 12.** NEW doesn't override line-heights, tracking, or weights — these stay as production conventions.

### 4.7 Border shortcuts — KEEP
```
--forge-border-subtle/-default/-strong
```
**KEEP.** Useful as full-shorthand `1px solid …`. NEW's `--forge-line-*` are color-only.

### 4.8 Motion duration — KEEP
```
--forge-duration-fast/-base/-slow (120ms / 180ms / 240ms)
```
**KEEP.** NEW doesn't define durations. Production-required for animation timing references.

### 4.9 Breakpoints — KEEP
```
--forge-bp-mobile/-tablet/-desktop/-wide
```
**KEEP.** NEW doesn't define breakpoints. Production needs them.

### 4.10 Dealer dark dormant block — REMOVE in Step 2
The commented-out `.forge-app [data-portal="dealer"] { ... }` block in CURRENT (lines 169-204) is **superseded by DEC2's universal `[data-theme="dark"]`**. Action: delete the entire dormant block; replace with NEW's `[data-theme="dark"]` overrides. **Save the deleted lines in git history for archaeology**, but they don't belong in the new tokens file.

---

## 5. Vars that change VALUE (UPDATE)

For vars that exist in both files with the same name:

| Var | CURRENT value | NEW value | Reason for change |
|---|---|---|---|
| `--forge-font-display` | `var(--forge-font-display-opt), "Source Serif Pro", Georgia, serif` | `"Source Serif 4", "Iowan Old Style", Georgia, serif` | NEW uses Source Serif **4** (display variant), proto loads from Google Fonts. CURRENT uses font-opt CSS var injected by Next's font loader. **Keep CURRENT's pattern**; if Source Serif 4 is the desired family, update the Next font config separately. |
| `--forge-font-body` | `var(--forge-font-sans), -apple-system, …` | `"Inter", system-ui, …` | Same pattern; CURRENT uses Next font loader. **Keep CURRENT.** |
| `--forge-font-mono` | `var(--forge-font-mono-opt), "IBM Plex Mono", …` | `"JetBrains Mono", "SF Mono", …` | Same; **keep CURRENT.** |
| `--forge-text-xs` | `11px` | `11px` | No change. |
| `--forge-text-sm` | `13px` | `12px` | **DOWNGRADE** in NEW. Proto compactness. Action: keep CURRENT (13px is institutional default); if compactness needed, use `--forge-text-2xs` (NEW-introduced). |
| `--forge-text-base` | `14px` | `13px` | Same pattern — proto compactness. **Keep CURRENT.** |
| `--forge-text-md` | `16px` | `14px` | Proto compactness. **Keep CURRENT.** |
| `--forge-text-lg` | `18px` | `16px` | Same. **Keep CURRENT.** |
| `--forge-text-xl` | `22px` | `20px` | Same. **Keep CURRENT.** |
| `--forge-text-2xl` | `28px` | `26px` | Same. **Keep CURRENT.** |
| `--forge-text-3xl` | `36px` | `36px` | No change. |
| `--forge-text-4xl` | `48px` | `48px` | No change. |
| `--forge-accent-gold` | `#c8940a` | `#D4A655` | Warmer in NEW. **Keep CURRENT** unless visual review decides otherwise. |
| (none of CURRENT's brand/gray/semantic/etc. have NEW analog with same name — they're disjoint sets) | | | |

**Verdict on type scale:** NEW's scale is shifted -1 (NEW's `xl` = CURRENT's `lg`). Either we accept the global downscale (which makes the whole UI denser, matching the proto's aesthetic) OR keep production's scale. **DECISION REQUIRED.**

Recommendation: **keep CURRENT scale** in production; reserve NEW's compact scale for marketing/design canvases only.

---

## 6. Vars NO CHANGE

These exist in both with **same name and same/equivalent value**:

| Var | Value | Comment |
|---|---|---|
| `--forge-text-xs` | `11px` | identical |
| `--forge-text-3xl` | `36px` | identical |
| `--forge-text-4xl` | `48px` | identical |
| (font family names if we adopt prototype names, but per §5 we keep CURRENT) | | |
| `@media (prefers-reduced-motion: reduce)` rule | same | identical |

That's the only overlap. **Most of NEW is additive (new families) and most of CURRENT is preserved**; the actual hex/value updates are very few.

---

## 7. Recommended posture for Step 2 application

Given the depth of naming drift, Step 2 has **three viable postures**:

### Posture A — "Drop in NEW, alias CURRENT"
- Replace tokens.css with NEW as-is (just rename `:root` → `.forge-app`)
- Add a compat block on top:
  ```css
  .forge-app {
    --forge-surface-page: var(--forge-bg-base);
    --forge-surface-card: var(--forge-bg-raised);
    --forge-space-1: var(--s1);
    --forge-radius-sm: var(--r-sm);
    --forge-shadow-xs: var(--sh-1);
    /* ... etc */
  }
  ```
- **Pros:** zero changes to consumer components.
- **Cons:** every consumer now indirects through aliases; long-term debt. Tailwind config rebuild required (resolves `forgeSurface-page` → `--forge-surface-page` → `--forge-bg-base`).

### Posture B — "Merge: NEW additions + CURRENT names kept" (RECOMMENDED)
- Add NEW's new families (`--forge-tenant-*`, `--forge-ink-*`, `--forge-line-*`, `--forge-bg-overlay/-overlay-strong`, `--forge-text-2xs/-hero`)
- Use CURRENT's existing names for surfaces/spaces/radii/shadows/easings — NO renames there
- Update only the few vars where the VALUE matters (e.g. `--forge-accent-gold` value review; viz palette decision)
- **Pros:** preserves production's component code unchanged. NEW vocab available for new components (Bank Dashboard hero metric, EvidenceCard, etc.)
- **Cons:** the prototype's `--s1`, `--r-sm`, `--sh-1` won't exist — proto-derived snippets need a rename pass before they paste in.

### Posture C — "Full proto-style"
- Replace CURRENT entirely with NEW (rename selector to `.forge-app`)
- Migrate every consumer from `--forge-surface-page` → `--forge-bg-base` etc.
- **Pros:** clean slate, matches design intent fully.
- **Cons:** TIGER UPGRADE. ~150+ files to update, days of work, high regression risk.

**Strong recommendation: Posture B.** It captures DEC1/DEC2/DEC3 (the explicit decisions), introduces the new semantic vocab needed for new components (Hero, Evidence, etc.), and avoids the rename tax on existing production code. The naming-convention reconciliation (sX vs forge-space-N etc.) becomes a defer-to-later cleanup ticket if it ever matters.

Under Posture B, the **NEW_tokens.css I generated is the wrong shape for direct drop-in** — it carries the proto's short prefixes. The Step 2 implementation prompt for Cursor should be: "use NEW_tokens.css as the **values reference** for new families (ink, tenant, line, bg-overlay, etc.); use CURRENT's names for everything that already exists."

---

## 8. Migration sequence (under Posture B)

1. Add ADD-list to `app/(forge)/credit-hub/_design/tokens.css` (additive, zero blast radius)
2. Add `[data-theme="dark"]` block with the dark V1 Slate Navy values
3. Update CURRENT's `.forge-app[data-tenant="banco-piloto"]` selector to `[data-tenant="banco-piloto-rd"]` (DEC3) — and add migration note for SQL
4. Rename `[data-tenant="test-mx-tenant-uuid"]` → `[data-tenant="testbank-mx"]` (DEC3)
5. Remove the dormant dealer dark block (commented-out section)
6. Add value adjustments for any final-pass UPDATE items Cesar approves
7. Run typecheck, smoke (`VISUAL_VALIDATION_CHECKLIST.md` Tests 5 + 6)

---

## 9. Open decisions for Cesar before Step 2 lands

1. **Posture A / B / C?** → Recommend B.
2. **Viz palette source of truth?** → CURRENT (a11y-vetted) vs NEW (proto-styled). Recommend CURRENT.
3. **Semantic hex values?** → CURRENT (institutional) vs NEW (Tailwind). Recommend CURRENT.
4. **Type scale?** → CURRENT (default 14px body) vs NEW (compact 13px). Recommend CURRENT.
5. **Accent gold?** → CURRENT `#c8940a` vs NEW `#D4A655`. Recommend visual review on the EvidenceCard rail.
6. **Slug rename strategy** (`banco-piloto` → `banco-piloto-rd`, `test-mx-tenant-uuid` → `testbank-mx`): SQL migration + frontend constants update — who owns? Recommend: Cursor's Step 3 (after this token migration lands).

---

*End of diff. Companion: `STEP_2_VISUAL_RISKS.md` for component-level blast radius.*
