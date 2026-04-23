# Phase 5 — Competitor Research UI — Audit

## Baseline

- Branch: `feat/competitor-research-ui`
- Stack: Next.js App Router, TypeScript, Tailwind, existing `DashboardLayout` navigation
- Active nav source: `components/layout/DashboardLayout.tsx` (not deprecated `Sidebar.tsx`)

## Feature flag

- `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED` — default `false` (omit or any value other than `true` disables route + nav)
- Server `app/competitor-research/page.tsx` calls `notFound()` when disabled

## Files to create

| Area | Path |
|------|------|
| Types | `types/spyfu.ts` |
| API | `lib/api/spyfu-client.ts` |
| Hooks | `hooks/useCompetitorSearch.ts`, `hooks/useDeepAnalysis.ts`, `hooks/useChatConversation.ts`, `hooks/useSpyFuUsage.ts` |
| Page | `app/competitor-research/page.tsx` (server gate), `app/competitor-research/CompetitorResearchClient.tsx` |
| Components | `app/competitor-research/components/*.tsx` |
| Tests | `tests/competitor-research/**/*.test.ts(x)` |
| Setup | `jest.config.js`, `jest.setup.tsx` (global mocks for ESM-only deps) |

## Files to modify

- `components/layout/DashboardLayout.tsx` — optional nav module under PUBLICIDAD when flag on
- `package.json` — dependencies + `test` / `typecheck` scripts
- `.env.example` — new vars (create if missing)

## API client design

- Single `SpyFuClient` class; `export const spyfu = new SpyFuClient()`
- Base URL: `process.env.NEXT_PUBLIC_API_URL` (fallback production URL)
- Default tenant: `process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID` (fallback pilot tenant id)
- Every method accepts optional `tenantId` override for `X-Tenant-ID`
- Central `request()` maps HTTP status → typed errors (`MissingTenantError`, `TenantMismatchError`, `UnknownIntentError`, `BudgetExceededError`, `FeatureDisabledError`, `NetworkError`)

## Component tree

```
CompetitorResearchClient
├── Header (title, ES/EN toggle, TenantSelector)
├── UsageWidget (polls usage)
├── Tab strip (Quick Search | Deep Analysis | Ask Anything)
├── ErrorBoundary (per tab)
│   ├── QuickSearchTab → CountrySelector, search, CompetitorOverviewCard, AdsHistoryTable, KeywordsTable×2, CompetitorsList×2
│   ├── DeepAnalysisTab → ConfidenceBadge, charts/summary, lists
│   └── AskAnythingTab → ChatInterface → ChatMessage, MarkdownRenderer
└── Toaster (react-hot-toast)
```

## Testing

- **Jest** + jsdom + Testing Library (Vitest/MSW native bindings blocked in this Windows environment; API client tests use **fetch mocks** with the same assertions as MSW would cover).
- Target: error mapping, Quick Search / Chat / Ads table / normalize helpers, page smoke.
