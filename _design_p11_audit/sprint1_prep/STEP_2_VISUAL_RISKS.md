# Step 2 — Visual Risk Assessment

**Date:** 2026-05-10
**Sprint:** 1 / P11-01 (pre-work)
**Companion:** `STEP_2_APPLICATION_DIFF.md`
**Methodology:** grep-based inventory of token usage in production code; classify per blast radius if Step 2 applies the NEW tokens under recommended **Posture B** (additive new families, preserve CURRENT names).

---

## TL;DR

**Most components are NOT at visual risk** because Posture B is **purely additive** for the new families (`--forge-ink-*`, `--forge-tenant-*`, `--forge-line-*`, `--forge-bg-base/raised/elev/overlay/overlay-strong`, `--forge-text-2xs/hero`). Confirmed: **zero production components currently consume any of those new vars** — they're new symbols.

Real visual risk comes from **3 narrow categories**:

1. **Tenant slug rename** (DEC3): `banco-piloto` → `banco-piloto-rd` and `test-mx-tenant-uuid` → `testbank-mx`. Surface: tokens.css selectors + tenant-config fixtures + docs. **`/lib` and `/components` have zero string-literal references to the old slugs** (confirmed via grep). Risk: SQL/seed data + branding config alignment.

2. **Dark theme activation** (DEC2): introducing `[data-theme="dark"]` triggers any CSS rule that already cascades on `:root` or `.forge-app` defaults. Without consumers reading the new ink/bg/line vars, the dark theme overrides nothing in CURRENT components. Risk: **dark mode looks identical to light** until components are migrated (intentional — Step 2 is foundation, not visible toggle yet).

3. **Optional value updates** (semantic hex, accent gold, viz palette): if Cesar approves any of the §5 UPDATE items in DIFF doc, those touch ~10-30 components. Posture B's default is "keep CURRENT values" → zero risk. Risk only materializes if values are explicitly updated.

**Net assessment:** Posture B is a **very low-risk migration**. The "visual change" in Step 2 is felt by **new components** (Bank Dashboard hero, EvidenceCard with chart slot, etc.) that Sprint 4+ will introduce. Existing components stay identical.

---

## Token usage inventory (grep counts)

| Token family | Production usage (approx files) | Blast radius if value changes |
|---|---|---|
| `--forge-brand-{50..950}` / `forgeBrand-*` Tailwind | **30+ files** (cap reached) | HIGH if values change |
| `--forge-gray-{50..900}` / `forgeGray-*` | similar HIGH-30+ | HIGH if values change |
| `--forge-surface-{page,card,raised,sunken}` / `forgeSurface-*` | **30+ files** | HIGH if values change |
| `--forge-{success,warning,danger,info}-{50,500,700}` / semantic Tailwind | **30+ files** | HIGH if values change |
| `--forge-accent-{gold,teal}` | ~10 files | MEDIUM |
| `--forge-viz-{1..6}` | ~5 files | LOW (charts only) |
| `--forge-text-{xs..4xl}` | ~10 files | MEDIUM if scale changes |
| `--forge-space-N`, `--forge-radius-X`, `--forge-shadow-X` | embedded everywhere via Tailwind | HIGH for values; not affected if names stay |
| **NEW** `--forge-ink-{1..4}` | **0 production usages** | n/a (additive) |
| **NEW** `--forge-tenant-primary*` | **0 production usages** | n/a (additive) |
| **NEW** `--forge-line-{1..3}` | **0 production usages** | n/a (additive) |
| **NEW** `--forge-bg-{base,raised,elev,overlay,overlay-strong}` | **0 production usages** | n/a (additive) |
| **NEW** `--forge-text-{2xs,hero}` | **0 production usages** | n/a (additive) |

> Grep methodology: `Grep` over `/components`, `/app`, `/lib` for each pattern. Counts approximate (some greps returned 30+ files capped at the limit).

---

## HIGH risk — components likely to render differently after Step 2

> Only triggers if Cesar approves §5 UPDATE items in DIFF doc (semantic hex, accent gold, type scale). Under Posture B default, NONE of these are at risk.

If type scale gets downscaled (NEW's compactness: 13px body vs CURRENT 14px):
- **All Forge UI primitives** that don't explicitly set font-size — Card, Button, Input, Select, DataTable, KpiCard, EvidenceCard, etc. They'd uniformly drop one step.
- **All `app/(forge)/credit-hub/**/page.tsx`** pages — same behavior. Body text smaller everywhere.
- **All `components/legal/**`** — same.

**Mitigation:** keep CURRENT type scale per recommendation in DIFF §5.

If semantic hex changes (CURRENT institutional muted → NEW Tailwind brighter):
- **`StatusPill.tsx`** — colored backgrounds + text for success/warning/danger/info. Visible everywhere status is shown (bandeja, audit timeline, AML alerts).
- **`Badge.tsx`** — same palette.
- **`Toast.tsx`** — notifications would shift palette.
- **`Alert`/`Banner`** components — error/warning banners shift hue.
- **`KpiCard.tsx`** delta trends — currently uses `forgeSuccess-700` / `forgeDanger-600` (per code reading). Trend pills shift hue.
- **`CaseRiskBadge`, `CasePriorityBadge`, `AttorneyReviewBadge`** — legal track badges, same.

**Mitigation:** keep CURRENT institutional values; only ADD the new `-bg` / `-line` translucent derivatives.

If accent gold updates (`#c8940a` → `#D4A655`):
- **`EvidenceCard.tsx`** left rail (`.evidence-rail` in production CSS will need a value review).
- **Anywhere that uses `forgeAccent-gold` Tailwind class** (low frequency; mostly EvidenceCard).

**Mitigation:** visual review on EvidenceCard rail before deciding.

If viz palette swaps (CURRENT a11y → NEW brighter):
- **`MicroChart.tsx`** and any future Recharts components consuming `--forge-viz-{1..6}`.
- **Sparklines** if added to KpiCard in P11-01 Step 3+.

**Mitigation:** keep CURRENT a11y palette in production; reserve NEW's brighter palette for marketing canvases.

---

## MEDIUM risk — affected only by DEC3 slug rename

These files reference the OLD tenant slugs and need a sync update when SQL migration runs:

### Production code (NOT user-facing UI) — needs SQL/seed update:
- **`lib/credit-hub/types/tenantBranding.ts`** — type definitions / fixtures may reference slug strings (grep found 2 hits on the regex `data-tenant="..."` but verify content; possibly just doc strings).
- **`app/(forge)/credit-hub/_design/tokens.css`** itself — selectors `[data-tenant="banco-piloto"]` and `[data-tenant="test-mx-tenant-uuid"]` need rename per DEC3.
- **`app/(forge)/credit-hub/_design/mockups/P10-05_tenant_branding_states.html`** — mockup, may reference slugs for demos.

### Documentation / audit artifacts — no UI impact, fine to lag:
- `_DESIGN_SYSTEM_RULES.md`, `_HANDOFF_TO_CODE_P10-05.md`, `_DESIGN_TOOLS_PLAYBOOK.md`
- `app/(forge)/credit-hub/_design/P10-05_*.md`, `SMOKE_TEST_P10-05.md`, `REFERENCES_P10-05.md`, `REUSABILITY_TEST.md`, `PHASE_8_ACCEPTANCE.md`, `TOKENS.md`
- `forge-design-preview/**` (prototype source — keep as-is for fidelity)
- `_design_p11_audit/sprint1_prep/01..05_*.md` and `SPRINT_1_READINESS_REPORT.md`
- `tokens.css.backup-p11-20260510_1703` (Cursor's backup, ignore)
- `tools/docs/build-tokens-md.mjs` (docs build tool; may need update if it parses tokens.css)

**Confirmed: `/lib` and `/components` have ZERO string-literal references to the old slugs** (grep returned no files). The slug rename is genuinely contained to docs + CSS selectors + (possibly) seed data + (possibly) `tenantBranding.ts` type literal — all in low-traffic files.

**Mitigation:** as part of Step 2 implementation in Cursor:
1. Rename selectors in `tokens.css`
2. Update `tenantBranding.ts` if it has slug literals
3. Update `mockups/P10-05_tenant_branding_states.html` for demo fidelity
4. Coordinate with backend track for SQL migration on `tenants` table (Ramon's scope)
5. Docs can be batch-updated later

---

## LOW / NO risk — components definitively unaffected

Under Posture B (additive NEW, CURRENT names preserved, value-stable):

### Forge UI primitives — NO visual change in Step 2:
- `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Breadcrumb.tsx`, `Checkbox.tsx`, `CommandPalette.tsx`, `ConsentCapture.tsx`, `DataTable.tsx`, `DateInput.tsx`, `Drawer.tsx`, `EmptyState.tsx`, `EvidenceCard.tsx`, `IconButton.tsx`, `Input.tsx`, `KpiCard.tsx`, `Modal.tsx`, `MoneyInput.tsx`, `RadioGroup.tsx`, `Select.tsx`, `Skeleton.tsx`, `StatusPill.tsx`, `Switch.tsx`, `Tabs.tsx`, `Textarea.tsx`, `Toast.tsx`, `TenantBrandingErrorBanner.tsx`, `AuditTimeline.tsx`, `MicroChart.tsx`

All currently bind to `forgeBrand-*`, `forgeSurface-*`, `forgeGray-*`, `forgeSuccess-*` etc. — those names DON'T CHANGE. The NEW symbols are added in parallel.

### Legal track — NO visual change:
- All `components/legal/**/*.tsx` files (Case, Document, Task families)
- Bind to forge tokens; unchanged by Posture B

### Forge layout — NO visual change:
- `ForgeCreditHubAppShell.tsx`, `ForgeCreditHubSidebar.tsx`, `ForgeCreditHubTopbar.tsx`, `ForgeCommandPaletteContext.tsx`, `Topbar.tsx`, `ForgeAppShell.tsx`
- Same logic

### `app/**/page.tsx` — NO visual change:
- Dealer + Bank pages render via the forge primitives; primitives don't change, pages don't change.

---

## Recommended visual test order for Step 6 (smoke validation post-Step 2 application)

When Step 2 lands in `main`, run `_design_p11_audit/sprint_logs/VISUAL_VALIDATION_CHECKLIST.md` first. Then this **targeted visual diff suite** to catch the value-update risks if any (run only the rows whose category applies):

### Tier 1 — Must pass (any Step 2 application)

1. **Hard refresh `/credit-hub`** → topbar shows tenant, sidebar gradient navy, body text reads cleanly. No console hydration errors. Confirms slug rename didn't break tenant fetch.
2. **`/credit-hub/dealer`** → KPI cards render with `forgeBrand-*` accent. Hero "Sigamos concretando…" serif. Empty state bandeja unchanged.
3. **`/credit-hub/bank`** → Mesa de decisiones hero serif. 4 KPI cards. Bandeja error state copy unchanged. **This is the highest-traffic visual surface.**
4. **`/credit-hub/bank/compliance`** → 3 stat cards. "Sin alertas AML/KYC" success state — uses `forgeSuccess-*`. Confirms semantic hex unchanged (assuming Posture B default).
5. **DevTools Elements inspect on `<html>` or `.forge-app` root:**
   - `[data-tenant]` attribute set correctly to long slug (`credicefi`, `banco-piloto-rd`, or `testbank-mx`)
   - Computed `--forge-brand-500` matches the tenant
   - **NEW:** confirm `--forge-ink-1` is now `#1E3A8A` (was undefined before Step 2)
   - **NEW:** confirm `--forge-bg-base` is now `#DBEAFE` (was undefined before)
6. **Open Cmd+K palette** → no console errors; modal renders with `--forge-bg-raised` (NEW value) — should be `#FFFFFF`.

### Tier 2 — Run if §5 UPDATE items were approved

7. **`StatusPill` snapshot tests** — if semantic hex updated, success/warning/danger pills change tone. Manual eyeball on `/bank` bandeja or audit.
8. **`KpiCard` trend arrow color** — if semantic hex updated, the trend pill (forgeSuccess-700 / forgeDanger-600) shifts hue.
9. **EvidenceCard rail color** — if accent gold updated, the 3px left rail shifts from `#c8940a` to `#D4A655`. Visual side-by-side recommended.
10. **`MicroChart`** lines — if viz palette swapped, chart strokes change. Inspect any sparkline visible in production.
11. **Body text density** — if type scale downscaled, paragraphs feel tighter. Eyeball the longest text block (e.g. compliance "Derecho al olvido" copy).

### Tier 3 — Dark mode (when first component starts consuming new vars)

12. Toggle theme to dark (via Tweaks or `<html data-theme="dark">` via DevTools):
   - `--forge-bg-base` flips to `#0F1A2E` (V1 Slate Navy)
   - `--forge-ink-1` flips to `#E8ECF7`
   - `--forge-tenant-primary` flips to `#4F8FD9` (Credicefi dark-tuned)
   - **Note:** until a component starts consuming `--forge-bg-base` etc., the page WILL NOT visually flip to dark. That's expected for Posture B — dark is "wired but not invoked".

---

## Pre-flight checklist before applying Step 2

- [ ] Cursor's Step 1 (ink → gray rename) merged to `main`
- [ ] DEC1/DEC2/DEC3 locked (already done in `PROGRESS_RECORD.md`)
- [ ] Cesar approved Posture A / B / C (recommend B in DIFF §7)
- [ ] Cesar reviewed §5 UPDATE items individually (or accepts "no value updates in Step 2, just additive families")
- [ ] Backup `app/(forge)/credit-hub/_design/tokens.css` → `tokens.css.backup-step2-{date}.css`
- [ ] PR diff <500 lines (additive; Posture B keeps it small)
- [ ] Verify `npm run typecheck` zero errors before/after
- [ ] Run `npm run lint` before/after (CSS lint may flag `:root` duplicates if any)
- [ ] `VISUAL_VALIDATION_CHECKLIST.md` Tests 1-6 pass on `main` head before Step 2 lands

---

## Open questions for Cesar before Step 2 implementation prompt to Cursor

1. **Posture:** A / B / C? — Cowork recommends **B**.
2. **Value updates:** are any §5 UPDATE items (type scale, semantic hex, accent gold, viz palette) approved for Step 2? — Cowork recommends **none, defer all to a separate ticket**.
3. **Selector scope:** keep production `.forge-app { … }` scope, or move to `:root` like the prototype? — Cowork recommends **keep `.forge-app`** for backward compat.
4. **Dark theme activation:** add `[data-theme="dark"]` block but require explicit `data-theme="dark"` attr to activate (so no surprise flip), or auto-detect `@media (prefers-color-scheme: dark)`? — Cowork recommends **explicit attr only**; user-controlled toggle via Tweaks / future topbar button.
5. **DEC3 slug rename:** does it land in Step 2 (alongside token migration) or as separate ticket Step 3? — Cowork recommends **Step 2** (atomic: both selectors in tokens.css + matching `tenantBranding.ts` literals if any).

---

*End of risk assessment. With Posture B + no value updates + scoped slug rename, Step 2 is a low-risk additive change. Smoke test cost: ~10 min.*
