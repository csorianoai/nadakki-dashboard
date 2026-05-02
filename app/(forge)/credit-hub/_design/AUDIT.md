# Forge Credit Hub — Phase 0 Audit

**Branch:** `feat/forge-redesign-v3`  
**Date:** 2026-04-29  
**Scope:** `app/(forge)/credit-hub/**` (route tree + layout entry), consumption via `app/(forge)/layout.tsx`, `components/credit-hub/**`, `styles/forge-tokens.css`, `lib/credit-hub/**` (read-only cross-references for drift and tenant wiring).  
**Forbidden paths:** Not modified (per master prompt Part 0).

---

## 1. File tree — `app/(forge)/credit-hub/`

```
app/(forge)/credit-hub/
├── layout.tsx
├── page.tsx
├── forge-globals.css
├── components/
│   └── page.tsx
├── bank/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── analytics/page.tsx
│   ├── applications/page.tsx
│   ├── applications/[applicationId]/page.tsx
│   ├── audit/page.tsx
│   └── compliance/page.tsx
└── dealer/
    ├── layout.tsx
    ├── page.tsx
    ├── applications/page.tsx
    ├── applications/new/page.tsx
    ├── applications/[applicationId]/page.tsx
    └── preapproval/page.tsx
```

**Count:** 17 route/module files under `credit-hub/` (no `_design/` content before this audit).

---

## 2. Stack confirmation (read from repo)

| Item | Observed |
|------|----------|
| Next.js | `16.2.4` (`package.json`) |
| React | `^19.2.4` |
| Tailwind | `^3.4.4` — config is `tailwind.config.js` (not `.ts`) |
| Build | `"build": "next build --webpack"` — unchanged |
| `vercel.json` / `next.config.js` | Not touched in this phase |

---

## 3. Baseline build — `npm run build`

- **Result:** **Success** (`exit_code: 0`) on this machine after full compile, TypeScript, and static generation.
- **Environment note:** Windows emitted repeated warnings: native `@next/swc-win32-x64-msvc` blocked by Application Control policy; Next.js **fell back to WASM** bindings and still completed. CI/Linux agents without this policy should not see the same warning. No change was made to `package.json` or `vercel.json`.

---

## 4. Tenant context and Forge wiring (Part 8.2 prep)

### 4.1 `contexts/TenantContext.tsx` (existing — not modified)

- **Exports:** `TenantProvider`, `useTenant`, default `TenantContext`.
- **Shape (`TenantContextType`):** `tenantId`, `settings` (`TenantSettings`), `setTenantId`, `updateSettings`, `isFeatureEnabled`, `checkLimit`.
- **`TenantSettings` fields:** `name`, `primaryColor`, `timezone`, `language`, `currency`, `dateFormat`, `features` (campaign-style flags), `limits` (campaigns/contacts/emails), `plan`.
- **Hydration:** On mount, reads `localStorage` key `nadakki_tenant_id`; when `useAuth()` reports `isAuthenticated` and `authTenantId`, syncs `tenantId` and persists to the same key.
- **Default settings:** Generic `name: "—"`, **`primaryColor: "#8b5cf6"`** (marketing-style purple), USD, `America/New_York`, etc.
- **No fields today for:** `logo_url`, `tenant_branding` row, `regulatory_profile` as first-class context, `data-tenant` slug, or `copy_overrides`.
- **Stubs:** Default context uses `console.warn` in development only when provider is missing.

### 4.2 `lib/credit-hub/hooks/useTenant.ts` (Forge-facing adapter)

- **Re-exports pattern:** Wraps `useTenant` from `@/contexts/TenantContext`.
- **Return shape:** `{ tenantId, tenantSlug, loading }` where **`tenantSlug` is set equal to `tenantId`** (UUID string when that is what auth stores — not a URL slug).
- **Fallback chain:** `tenantId` from context **or** `process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID` **or** `DEFAULT_CREDIT_TENANT_ID` from `lib/credit-hub/types/creditCore.ts` (**hardcoded UUID** — see findings below).
- **`loading`:** Always `false` — no async hydration signal for Credit Hub consumers.

### 4.3 `lib/credit-hub/hooks/useTenantConfig.ts`

- **`useTenantConfig`:** Returns `getDefaultTenantBankingConfig(tenantId || "tenant-no-disponible")` via `useMemo` — **always the default object**, keyed only by `tenantId`; **no API fetch** observed in this hook for live `tenant_branding` / backend config.
- **Defaults:** Dominican-focused (`country_code: "DO"`, `currency_code: "DOP"`, `locale: "es-DO"`, `regulatory_profile: "DO_LEY_172_13"`), generic `institution_name: "Institución financiera"`, branding hexes in object (`#ff6b35`, etc.).

### 4.4 Consumers (representative)

- **Credit Hub UI:** `CHTenantGuard`, `BankTopBar`, `DealerTopBar` use `lib/credit-hub/hooks/useTenant`.
- **Data hooks:** `useBankQueue`, `useApplications`, `useApplication`, `useBankDecision`, `useBulkActions`, `useCreditApplications`, `useCreateApplication`, `useCreateCreditApplication`, `useProcessCreditApplication`, `useCreditApplicationDetail`, `useBankAnalytics`, `useCreditStats`, `useCreditAnalysis`, `useHealth` — all depend on `useTenant()` for `tenantId`.
- **i18n:** `useTranslations` depends on `useTenantConfig()` → default config only.

### 4.5 Path A vs B (preliminary — no code change)

- **Path A** (extend `TenantContext` value with `branding`) would touch **`TenantContext.tsx`**, which also serves non–Credit Hub surfaces; risk of regressions unless API extensions are additive and backward compatible.
- **Path B** (Forge-only `ForgeBrandingProvider` composed **inside** existing tenant resolution, consuming `useTenant` / server headers) aligns with “do not break Legal/Marketing consumers” and matches current separation where **banking config is already centralized under `lib/credit-hub`**.
- **Resolution:** Record final choice in `TENANT_CONTEXT_EXTENSION.md` in Phase 8; this audit only captures evidence.

### 4.6 Prompt vs repo: `hooks/useTenant.ts`

- Master prompt lists `hooks/useTenant.ts` as sacred. **This repo’s Credit Hub hook lives at `lib/credit-hub/hooks/useTenant.ts`.** The root `hooks/` folder contains `useTenantServer.ts` but **not** `useTenant.ts`. Any future work must not confuse the two paths.

---

## 5. Styling and token sources

5. **`app/(forge)/credit-hub/forge-globals.css`** imports `styles/forge-tokens.css` and defines `.forge-route` using `var(--forge-bg)` and `var(--forge-text)` only — thin shim.

6. **`app/(forge)/layout.tsx`** (parent of `credit-hub/`) loads `next/font` for **Inter**, **JetBrains Mono**, and **Space Grotesk** as `--forge-font-sans`, `--forge-font-mono`, `--forge-font-display`. **No Source Serif 4** — differs from Part 4 typography decision.

7. **`styles/forge-tokens.css`** is the **current** design token file: spacing, radii up to **`--forge-radius-2xl: 24px`**, shadows including **`--forge-shadow-xl`** and **glow** tokens (`--forge-shadow-glow-orange`, `--forge-shadow-glow-success`), portal blocks `[data-portal="dealer"]` and `[data-portal="bank"]` with **many literal hex values**, **gradients** (`--forge-gradient-hero`, `--forge-gradient-button`, `--forge-gradient-ai`), dealer **dark** surfaces (`#0A0E1A`, etc.).

8. **Part 4 v3.2 spec** calls for a **new** canonical file at `app/(forge)/credit-hub/_design/tokens.css`, flatter radii (max 8px except pills), no `shadow-xl` for cards, **light institutional** surfaces, serif display — **intentional migration** will be needed; today’s tokens are **not** aligned with that spec.

9. **`tailwind.config.js`** maps colors to `var(--forge-primary)`, `var(--forge-bg)`, etc. — coupled to **`data-portal`** driven CSS variables, not to `[data-tenant="…"]` overrides.

10. **`PortalShell`** sets `data-portal={persona}` on a wrapper `div` — persona (bank vs dealer) drives theme, **not** tenant slug.

---

## 6. Color drift (hex / literals outside token vars)

11. **`components/credit-hub/bank/BankDashboardHero.tsx`:** marketing headline **“Mesa de decisiones CrediCefi”** — **hardcoded institution name** (tenant anti-pattern).

12. **`components/credit-hub/dealer/DashboardHero.tsx`:** full-width hero uses **Tailwind arbitrary hex gradient** `from-[#FF6B35] via-[#FF8C42] to-[#FFB627]` plus overlay radial gradients — bypasses CSS variable discipline.

13. **`components/credit-hub/bank/BankAnalyticsCharts.tsx`:** Recharts `Cell` / `Bar` fills use **inline hex arrays** (`#22c55e`, `#f59e0b`, `#ef4444`, `#3b82f6`, `#ff6b35`) — not data-viz token map.

14. **`components/credit-hub/dealer/preapproval/AmortizationChart.tsx`:** axis, tooltip, and line **stroke/fill hex** literals (`#94a3b8`, `#0f172a`, `#334155`, `#38bdf8`, `#f97316`, `#22c55e`).

15. **`components/credit-hub/brand/ForgeLogo.tsx`:** SVG **linearGradient** with stop colors — brand mark embedded in component.

16. **`contexts/TenantContext.tsx`:** default `primaryColor` **`#8b5cf6`** — unrelated to Forge bank/dealer palettes.

17. **`lib/credit-hub/hooks/useTenantConfig.ts`:** default `branding.primary_color` **`#ff6b35`**, etc. — hex in TS defaults.

18. **`lib/credit-hub/types/creditCore.ts`:** **`DEFAULT_CREDIT_TENANT_ID`** constant UUID — hardcoded tenant identity fallback for all Credit Hub API calls when context/env empty.

---

## 7. Typography and density

19. **Display font today:** **Space Grotesk** (geometric sans), not **Source Serif 4** specified in Part 4.

20. **`tailwind.config.js`:** `fontFamily.display` falls back to **Inter** in the stack — weak separation between display and body.

21. **Bank applications page** (`app/(forge)/credit-hub/bank/applications/page.tsx`): eyebrow uses `tracking-[0.18em]` — custom tracking, not yet unified with tokenized `--forge-tracking-*`.

22. **Wizard and panels:** mix of `text-sm`, `text-lg`, `font-display`, `font-bold` across `WizardContainer` and bank components — **no single type scale** enforced at component layer.

---

## 8. Radius, shadow, motion (anti-patterns vs Part 4)

23. **Widespread `rounded-2xl` / `rounded-3xl`** in dealer UI (`DashboardHero`, `ApplicationCard`, `WizardContainer`, `SimulatorControls`, `CreditAnalysisPanel`, `ForgeCard` primitive, etc.) — exceeds v3.2 max **8px** for cards (except pills).

24. **`ForgeButton`:** `bg-gradient-to-br`, `hover:shadow-lg`, **`active:scale-[0.98]`** — scale motion conflicts with “motion is functional only / no bounce” institutional bar.

25. **`ForgeSkeleton`:** `animate-forge-shimmer` with **2s** infinite animation — Part 4 suggests skeleton cycle not faster than 1.2s; needs review against `prefers-reduced-motion` (global CSS may exist; not verified in this file).

26. **`ForgeToaster`:** **`shadow-2xl`** + **`backdrop-blur-md`** — glassmorphism-adjacent; Part 11 explicitly rejects heavy shadow / glass for institutional tone.

27. **`tailwind.config.js`:** keyframes **`forge-float`** (3s ease-in-out infinite) — decorative motion risk.

28. **`styles/forge-tokens.css`:** **`--forge-shadow-xl`** and **glow** shadows — contradicts “almost flat / borders carry weight” target.

---

## 9. Component patterns (cards, buttons, tables)

29. **Card primitive:** **`ForgeCard`** (`components/credit-hub/primitives/ForgeCard.tsx`) uses **`rounded-2xl`** + variant classes — single primitive, but **many wrappers** re-apply `rounded-2xl border …` ad hoc (metric cards, wizard sections).

30. **Button primitive:** **`ForgeButton`** centralizes variants but relies on **gradients** and **shadow** for primary — consumer-fintech idiom vs Marquee-style flat primary.

31. **Tables:** **No shared `DataTable` primitive** found under `components/credit-hub`. At least **`ScenarioComparison.tsx`** uses a raw `<table className="w-full min-w-[640px] …">` — forces horizontal scroll on small viewports; Part 5 expects a unified DataTable + mobile card pattern.

32. **Bank queue:** **`BankQueueList`** uses **`ForgeCard`** + list rows, not a semantic `<table>` — different pattern from scenario comparison → **inconsistent table/list semantics** for tabular banking data.

33. **Toasts:** **`ForgeToaster`** (custom) coexists with dependency **`react-hot-toast`** in `package.json` — potential duplicate notification strategies (verify wiring in Phase 2 if adopting `sonner`).

---

## 10. Information architecture vs spec

34. **`app/(forge)/credit-hub/page.tsx`:** Hub lists bank portal with **`href: "#"`** and **`available: false`** while **`/credit-hub/bank`** routes exist and work — **stale IA** vs implemented bank area.

35. **Side navigation:** Implemented in **`components/credit-hub/bank/navigation/BankSideNav`** and dealer **`DealerBottomNav` / `DealerTopBar`** — not in `components/forge/layout/` (expected target for Phase 3).

36. **No `CommandPalette` / `cmdk`** in dependencies today — Phase 2 will add package.

37. **Skip link:** Present in both bank and dealer `layout.tsx` with Spanish copy — good baseline for a11y; focus styles use **`rounded-lg`** + **`bg-forge-primary`**.

---

## 11. Internationalization and copy

38. **Copy:** Heavy **Spanish** strings in components (`Saltar al contenido principal`, bank hero, subtitles). Part 4 expects **locale-driven** formatting; i18n layer exists (`useTranslations`) but **not all strings** go through it (e.g. skip link, CrediCefi hero).

39. **`useTenantConfig`:** Defaults lock **DO** / **DOP** / **es-DO** — correct for one region but **not** proof of multi-country onboarding without API-backed config.

---

## 12. TODO / FIXME / console

40. **`components/credit-hub/dealer/wizard/WizardContainer.tsx`:** comment **`TODO: extender backend…`** (~line 330) — backend contract note; should be ticket-linked in Phase 5+ cleanup.

41. **No `console.log`** found under `lib/credit-hub` in a quick grep; **`console.warn`** remains in `TenantContext` default stubs (dev-only).

42. **`app/(forge)/credit-hub`:** **No** `TODO` / `FIXME` / `console.log` in-route files (grep clean).

---

## 13. Hardcoded tenant and institution references (inventory)

| Location | Reference |
|----------|-----------|
| `components/credit-hub/bank/BankDashboardHero.tsx` | **“CrediCefi”** (brand string in UI) |
| `lib/credit-hub/types/creditCore.ts` | **`DEFAULT_CREDIT_TENANT_ID`** UUID `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` |
| `lib/credit-hub/hooks/useTenantConfig.ts` | Default **`institution_name: "Institución financiera"`** (generic, acceptable; not a real bank name) |

**“Banco Piloto”:** **not found** in `app/(forge)/credit-hub` or `components/credit-hub` grep.

---

## 14. Gaps vs Part 12 Definition of Done (preview)

43. **`components/forge/ui/**` and `components/forge/layout/**`:** **Do not exist** — entire primitive layer must be introduced in Phase 2–3.

44. **`EvidenceCard`, `AuditTimeline`, `ConsentCapture`, unified `DataTable`** with virtualization, **`StatusPill`** driven by tenant label map — **not present** as named spec components; partial analogs may exist scattered in bank/dealer modules (not exhaustively mapped in this audit).

45. **Lighthouse / bundle budgets:** Not run in Phase 0 — scheduled for later gates.

---

## 15. Risk register (for Phase 1+)

46. **Dual token systems:** Migrating to `_design/tokens.css` must avoid breaking **`tailwind.config.js`** `forge-*` utilities until mapping is complete.

47. **Dealer dark theme vs new “light institutional” spec:** Largest visual pivot; dealer mobile-first requirement still applies — needs explicit design decision when porting tokens.

48. **Tenant branding at runtime:** Today’s **`useTenantConfig` default-only** behavior is a **blocker for “zero deploy onboarding”** until a real fetch + cache aligns with `tenant_branding` API (document in Phase 8; no API change in this repo scope without product approval).

49. **`useTenant` `tenantSlug`:** Misnamed if value is UUID — risks wrong `data-tenant` attribute if used naively.

50. **Forge root layout** (`app/(forge)/layout.tsx`) imports **`CHQueryProvider`** from `components/credit-hub` — tight coupling; Phase 3 layout extraction should preserve provider order.

---

## 16. Verification gate checklist (Phase 0)

| Gate | Status |
|------|--------|
| Branch `feat/forge-redesign-v3` | **Yes** (confirmed via `git branch --show-current`) |
| File tree for `app/(forge)/credit-hub/` | **Above** |
| ≥ 30 findings | **Yes** (50 numbered items) |
| Hardcoded tenant refs listed | **Section 13** |
| `TenantContext` shape + hydration documented | **Section 4** |
| Baseline `npm run build` | **Success** (see §3) |

---

*End of Phase 0 audit. Phase 1 must not start until Cesar greenlights this document.*
