# Forge Credit Hub — design documentation

## What is Forge Credit Hub?

Forge Credit Hub is the **Next.js 16** multi-tenant experience for **bank** and **dealer** personas under `/credit-hub/*`. It composes a **token-driven design system** (`tokens.css` on `.forge-app`) with **Forge primitives** in `components/forge/ui/*` and `components/forge/layout/*`, wrapped by **`ForgeCreditHubAppShell`** (sidebar, top bar, command palette, toasts). Legacy **`components/credit-hub/**`** primitives remain in production behind the Forge shell (Phase 7.2 Case B); they are **not** part of the documented design system—see `MIGRATION.md` and repo `_design/_inventory/credit_hub_consumers_grep.txt`.

This `_design/` folder is the **living documentation root**: English technical references, Spanish operational guides (Phase 8), automation scripts under `tools/docs/` (from Step 2), and evidence artifacts under `_inventory/`. Treat it like production code: regenerate token docs from source, validate catalogs against the file tree, and keep links truthful.

## Who should read what

| Role | Start here | Then |
|------|------------|------|
| **Product / design** | `DESIGN_SYSTEM.md` | `TOKENS.md`, `_assets/benchmarks/`, `PAGES.md` (when published) |
| **Frontend engineer** | `README.md` (this file) | `COMPONENTS.md`, `TOKENS.md`, `HOW_TO_MODIFY.md` (ES) |
| **Tenant / brand ops** | `TENANT_THEMING.md` (ES, Phase 8) | `REUSABILITY_TEST.md`, `TOKEN_MIGRATION_MAP.md` |
| **Platform / fork** | `REUSE_PLAYBOOK.md` (ES, Phase 8) | `MIGRATION.md`, `TENANT_CONTEXT_EXTENSION.md` |
| **QA / a11y** | `COMPONENTS.md` (a11y sections), `POLISH.md` | `_inventory/lh-*.json`, `REUSABILITY_TEST.md` |
| **Future agent (cold start)** | This `README.md` → [Change brand color](#brand-color) | `TOKENS.md`, `TENANT_THEMING.md` |

## Document index (one line each)

| Document | Description |
|----------|-------------|
| **README.md** | Entry point, role map, directory tree, quick links. |
| **DESIGN_SYSTEM.md** | Philosophy, benchmarks, anti-patterns, architecture non-negotiables, extend/compose/refuse. |
| **TOKENS.md** | Token reference + **`npm run docs:tokens`** auto-table from `tokens.css` (between `AUTOGEN` markers). |
| **COMPONENTS.md** | Forge primitive catalog, usage rules, motion and a11y gates. |
| **PAGES.md** | Hero route reference — **added Phase 8 Step 4** (not in repo until then). |
| **MIGRATION.md** | Phase 4–7 migration notes, Phase 7.2 legacy Tailwind adapter resolution. |
| **POLISH.md** | Phase 5–7 polish tracker and verification evidence. |
| **AUDIT.md** | Phase 0 baseline audit (drift, anti-patterns vs v3.2). |
| **REUSABILITY_TEST.md** | Phase 6 tenant override proof (TestBank Mexico). |
| **TOKEN_MIGRATION_MAP.md** | Legacy → v3.2 token mapping notes. |
| **TENANT_CONTEXT_EXTENSION.md** | Path A/B for tenant-driven persona (Phase 8 scope). |
| **BLOCKER_phase1.5.md** | Archived Phase 1.5 blocker memo. |
| **TENANT_THEMING.md** | *(Phase 8 Step 5)* Spanish onboarding guide. |
| **HOW_TO_MODIFY.md** | *(Phase 8 Step 6)* Spanish recipe book. |
| **REUSE_PLAYBOOK.md** | *(Phase 8 Step 7)* Spanish fork playbook. |

## Quick links & external

<a id="brand-color"></a>

| Resource | URL / path |
|----------|------------|
| **Production dashboard** | [https://dashboard.nadakki.com](https://dashboard.nadakki.com) |
| **GitHub repo (this branch)** | [https://github.com/csorianoai/nadakki-dashboard/tree/feat/forge-redesign-v3](https://github.com/csorianoai/nadakki-dashboard/tree/feat/forge-redesign-v3) |
| **Design tokens (canonical v3.2)** | [`app/(forge)/credit-hub/_design/tokens.css`](./tokens.css) |
| **Legacy portal variables** | `styles/forge-tokens.css` (dual `var()` with Tailwind — see `MIGRATION.md`) |
| **Vercel** | Project URL is configured in the Vercel dashboard for this repository (not hardcoded in repo). |
| **Preview playground** | `/credit-hub/preview` (local: `http://localhost:<port>/credit-hub/preview`) |

**Change Credicefi (or any tenant) brand color:** edit CSS custom properties under `.forge-app[data-tenant="…"]` in `tokens.css` (orchestrated onboarding in `TENANT_THEMING.md`, Phase 8). Default bank brand scale is `--forge-brand-500` and surrounding steps in the same file.

## Screenshot viewports (Phase 8 standard)

Regenerate captures with the same geometry so docs stay comparable:

| Mode | Size | Notes |
|------|------|--------|
| **Desktop** | 1280×800 | Primary layout proofs, bank/dealer chrome. |
| **Mobile** | 375×667 | iPhone SE class; tables use in-wrapper horizontal scroll + density (see `COMPONENTS.md`). |

## `_design/` directory tree

```text
_design/
├── README.md                 ← you are here
├── DESIGN_SYSTEM.md
├── COMPONENTS.md
├── TOKENS.md
├── MIGRATION.md
├── POLISH.md
├── AUDIT.md
├── REUSABILITY_TEST.md
├── TOKEN_MIGRATION_MAP.md
├── TENANT_CONTEXT_EXTENSION.md
├── BLOCKER_phase1.5.md
├── tokens.css
├── TENANT_THEMING.md         (Phase 8 Step 5)
├── HOW_TO_MODIFY.md          (Phase 8 Step 6)
├── REUSE_PLAYBOOK.md         (Phase 8 Step 7)
├── _assets/
│   ├── benchmarks/           # directional composites (Step 1)
│   ├── components/         # `npm run docs:components` (Playwright / preview)
│   └── pages/               # `npm run docs:pages` (9 heroes × desktop + mobile)
└── _inventory/               # grep outputs, Lighthouse JSON, reusability screenshots
```

## CI note (docs validation)

A dedicated **PR** workflow that runs **`npm run docs:validate`** on changes under `components/forge/ui/**`, `components/forge/layout/**`, or `app/(forge)/credit-hub/_design/tokens.css` is **recommended** (Phase 8 Step 9). The existing [`.github/workflows/auto-deploy-frontend.yml`](../../../../.github/workflows/auto-deploy-frontend.yml) is a **scheduled** deploy check and does **not** gate documentation drift.

## Automation (`tools/docs/`)

| Script | npm | Purpose |
|--------|-----|---------|
| `build-tokens-md.mjs` | `npm run docs:tokens` | Regenerate the `<!-- AUTOGEN:TOKENS -->` region in `TOKENS.md` from `tokens.css`. |
| `capture-components.mjs` | `npm run docs:components` | Playwright captures under `_assets/components/` from `/credit-hub/preview` (requires `next start` + `BASE_URL`). |
| `capture-pages.mjs` | `npm run docs:pages` | Playwright captures 9 hero routes × desktop + mobile under `_assets/pages/`. |
| `validate-docs.mjs` | `npm run docs:validate` | Ensures every `components/forge/ui` + `layout` file is mentioned in `COMPONENTS.md`. |
| — | `npm run docs:all` | Runs all four in sequence. |

**Playwright channel:** capture scripts try **`channel: "msedge"`** first (Windows), then fall back to bundled Chromium—same approach as `tools/capture-forge-reusability.mjs`.
