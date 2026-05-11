# Step 2 — Decisions Locked

**Date:** 2026-05-10
**Decider:** Cesar
**Status:** All 6 decisions locked · ready for Cursor implementation
**Implementation artifact:** `tokens-step2-additive-block.css` (drop-in additive block)
**Companion docs:** `STEP_2_APPLICATION_DIFF.md` (full diff analysis), `STEP_2_VISUAL_RISKS.md` (component blast radius)

---

## 1. The 6 decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| **D1** | Posture for Step 2 | **B — Additive** | NEW vars added; CURRENT names + values preserved. Ahorra días de debugging. |
| **D2** | UPDATE existing values (semantic hex, accent gold, type scale) | **B — Preserve** | Step 2 puramente aditivo; cualquier update de valor va a ticket futuro. |
| **D3** | Selector scope | **B — `.forge-app`** | Aislamiento del Credit Hub; no contamina marketing/legal modules en `:root`. |
| **D4** | Dark mode activation | **B — Dormant** | Vars dark presentes pero sin toggle UI; activación en Sprint 4+. |
| **D5** | DEC3 slug rename atomicity | **B — Solo banco-piloto** | Solo rename `banco-piloto` → `banco-piloto-rd`. `test-mx-tenant-uuid` queda para ticket futuro. |
| **D6** | Naming convention (short vs long prefix) | **C — Aliases** | Short-prefix aliases (`--s1`, `--r-sm`, etc.) apuntan a vars largas (`--forge-space-1`, etc.) Ambos coexisten. |

---

## 2. What this means concretamente

### Production tokens.css changes (Cursor's Step 2 implementation)

The implementation is **scoped to a single file**: `app/(forge)/credit-hub/_design/tokens.css`.

**Operations:**

1. **APPEND** "NEW FAMILIES" section inside the existing `.forge-app { … }` rule. Adds:
   - 4 tenant-primary tokens (`--forge-tenant-primary{,-strong,-soft,-dark}`)
   - 4 ink hierarchy tokens (`--forge-ink-{1..4}`)
   - 5 bg/surface tokens (`--forge-bg-{base,raised,elev,overlay,overlay-strong}`)
   - 3 line tokens (`--forge-line-{1..3}`)
   - 10 translucent semantic derivatives (`--forge-{success,warning,danger,info,accent-gold}-{bg,line}`)
   - 2 type-scale extras (`--forge-text-2xs`, `--forge-text-hero`)
   - 1 radius extra (`--forge-radius-xl`)
   - 1 modal shadow (`--forge-shadow-modal`)
   - 2 easing extras (`--forge-ease-spring`, `--forge-ease-fast-v2`)
   - **Total: 32 new declarations**

2. **APPEND** "SHORT-PREFIX ALIASES (D6)" section after NEW FAMILIES, still inside `.forge-app`. Adds:
   - 11 spacing aliases (`--s1..--s20` → `--forge-space-N`)
   - 4 radius aliases (`--r-{sm,md,lg,xl}` → `--forge-radius-X`)
   - 4 shadow aliases (`--sh-{1,2,3,modal}` → `--forge-shadow-X`)
   - 6 viz aliases (`--viz-{1..6}` → `--forge-viz-N`)
   - 2 easing aliases (`--ease-spring`, `--ease-fast`)
   - **Total: 27 alias declarations**

3. **RENAME** existing selector:
   - `.forge-app[data-tenant="banco-piloto"]` → `.forge-app[data-tenant="banco-piloto-rd"]`
   - **Same values inside the block — pure selector rename.**

4. **REMOVE** the commented-out dormant dealer-dark block (lines 169-204 of current file) — superseded by D4's unified dark-theme.

5. **APPEND** at end of file (outside `.forge-app { … }`):
   - `.forge-app[data-theme="dark"] { … }` — main dark theme override (bg, ink, line, tenant-primary base)
   - 2nd `.forge-app[data-theme="dark"] { … }` for shadow overrides (separated for clarity)
   - 3 tenant-specific dark blocks (`.forge-app[data-theme="dark"][data-tenant="X"]` for each tenant)

6. **OPTIONAL:** before any of the above, save backup: `cp tokens.css tokens.css.backup-step2-2026-05-10.css`.

### Files NOT touched in Step 2

- **`/components/**`** — zero changes. All Forge UI primitives keep their current Tailwind/CSS-var bindings.
- **`/app/**/page.tsx`** — zero changes. Pages don't reference tokens directly except via primitives.
- **`/lib/credit-hub/types/tenantBranding.ts`** — verify NO string literals `"banco-piloto"` (grep returned no results in `/lib`); if any are found, those are part of this Step 2's atomic rename. If none, the only places that reference the slug are `tokens.css` (covered above), SQL fixtures (backend track), and docs.
- **`tailwind.config.js`** — no rename of Tailwind utility classes; CURRENT `forgeBrand-*` etc. stay.
- **All docs in `_design_p11_audit/**`** — they're audit artifacts, not code.

### Backend coordination (if applicable)

If there is a SQL `tenants` table with `slug = 'banco-piloto'`, the SQL migration must land **atomically with Step 2 PR** or in the same deploy:

```sql
UPDATE tenants SET slug = 'banco-piloto-rd' WHERE slug = 'banco-piloto';
```

Coordinate with Ramon's backend track. If no such migration is needed (slug only exists in CSS / branding-config fixtures), this is moot.

---

## 3. Validation gate post-Step 2

Run before merging the PR:

- [ ] `npm run typecheck` zero errors
- [ ] `npm run lint` zero new warnings (CSS lint may flag `:root` duplicates if any — none expected since everything is `.forge-app`-scoped)
- [ ] `npm run dev` boots cleanly
- [ ] `VISUAL_VALIDATION_CHECKLIST.md` Tests 1-6 ALL PASS on `main`-head (Sprint 0 closure smoke)
- [ ] **Tier 1 visual diff suite** from `STEP_2_VISUAL_RISKS.md` § "Recommended visual test order" (6 routes):
   - `/credit-hub`, `/credit-hub/dealer`, `/credit-hub/bank`, `/credit-hub/bank/compliance`
   - DevTools elements inspect: `--forge-ink-1` resolves to `#1E3A8A`, `--forge-bg-base` to `#DBEAFE`
   - Cmd+K opens, modal renders cleanly
- [ ] **Tier 2 visual diff suite** SKIPPED (D2 = no value updates)
- [ ] **Tier 3 dark mode** SKIPPED (D4 = dormant, no toggle yet)
- [ ] PR diff < 250 lines net (additive; rename is 1 line)
- [ ] `git diff` shows ONLY `app/(forge)/credit-hub/_design/tokens.css` modified
- [ ] Backup file `tokens.css.backup-step2-2026-05-10.css` committed alongside (optional but recommended)

---

## 4. Why this is a low-risk migration

Under the 6 locked decisions, the cumulative blast radius is:

- **Posture B + D2 (preserve values)** → no existing component renders differently. Every CSS rule in production resolves identically before/after Step 2.
- **D3 (`.forge-app` scope)** → zero pollution of `:root`. Marketing pages, legal module, signin pages, etc. completely unaffected.
- **D4 (dark dormant)** → no surprise theme flip. Dark vars exist but no rule activates `[data-theme="dark"]` on the root until Sprint 4+.
- **D5 (one slug rename)** → 1 selector edit + 1 line of SQL (if applicable). Grep confirmed `/lib` and `/components` have zero string literals to the old slug — likely backed only by tokens.css and seed data.
- **D6 (aliases bidirectional)** → existing components keep using long names; new prototype-derived snippets can use short names without rewrite. Aliases are CSS variable indirections — zero runtime cost.

**Net code surface for Step 2 PR:** roughly **120 lines added, 1 line renamed, ~36 lines removed (dormant block)** — net ~85 lines of CSS change in a single file.

---

## 5. What's deferred (out of Step 2 scope)

| Deferred item | Decided | Target ticket |
|---|---|---|
| `tokens.css` value updates (semantic hex, accent gold, type scale, viz palette) | D2 says preserve | Post-Sprint 1 (no urgency; may end up in P11-32 a11y audit) |
| `test-mx-tenant-uuid` → `testbank-mx` slug rename | D5 says solo banco-piloto | Sprint 1 follow-up ticket, or batch with the Visual System V3 if it ever happens |
| Dark mode UI toggle (sun/moon icon in topbar, localStorage persist) | D4 says vars only | Sprint 4 (when first proto-aligned component lands and benefits from a working toggle) |
| Tailwind config additions for new families (e.g. `forgeInk-1`, `forgeBg-base`) | not in this step | When a component first wants to use the new var via a Tailwind class — could be Sprint 4+ |
| Production component refactor to consume new vars (KpiCard sparkline slot, hero metric, EvidenceCard chart) | not in this step | Sprint 4 (P11-11 Bank Dashboard Home), Sprint 6 (P11-19 EvidenceCard Banker) |

---

## 6. Open hand-off questions for Cursor

When Cursor receives the Step 2 implementation prompt, two clarifications might come up:

1. **`--forge-tenant-primary` default value (line 1 of NEW FAMILIES section in additive block):** I aliased it to `var(--forge-brand-500)`. That makes the default Credicefi navy `#1B4A8C` (since Credicefi tenant block overrides `--forge-brand-500: #1b4a8c`). Other consumers see the **default brand** (currently `#2e5f97`). Is that the desired default, or should `--forge-tenant-primary` default to a hardcoded value? Recommendation: **keep alias `var(--forge-brand-500)`** — it's the cleanest semantic relationship.

2. **`--forge-ease-fast` aliasing:** prototype defines both `--forge-ease-fast` and the production already has `--forge-duration-fast` (different concept: easing curve vs timing). To avoid confusion, in the additive block I renamed proto's `--ease-fast` to `--forge-ease-fast-v2`. Cursor may want to drop the `-v2` and use a different name (e.g. `--forge-curve-fast`). Either works. Recommendation: **proceed with `-v2` or `--forge-curve-fast`; the alias `--ease-fast` resolves to whichever the long name ends up being.**

---

## 7. Sprint 1 step-by-step (after Step 2 lands)

Once this CSS additive block lands in `main`, the Sprint 1 P11-01 ticket has two more steps:

- **Step 3:** Wire `--forge-ink-1` and `--forge-bg-base` to be **explicitly consumed** by at least one production component (e.g. `KpiCard.tsx` adds a body text color via `var(--forge-ink-1)` to validate the cascade), proving the new vocab works end-to-end. ~1h.
- **Step 4:** Add a Storybook / preview page showing the new tokens alongside CURRENT for visual reference (`/credit-hub/preview/tokens-v2`). ~3h.
- **Step 5 (optional):** Tailwind config additions for `forgeInk-1`, `forgeBg-base`, `forgeLine-1`, `forgeTenantPrimary` so future components can use class names like `bg-forgeBg-base text-forgeInk-1`. ~2h.

**Steps 6+:** rest of P11 sprint roadmap (component refactors in Sprint 4+).

---

*End of decisions log. Implementation artifact: `tokens-step2-additive-block.css` in this same folder.*
