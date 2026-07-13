# ARCHITECTURE — Finance Cockpit v3.1

**Phase:** F1 (foundation)

---

## Stack

```
main
└── finance-v3/f0-baseline
    └── finance-v3/f1-navigation-shell   ← contracts + badge extension
        └── finance-v3/f2-navigation-shell (next)
```

Frontend-only in F1. Backend PRs start F3 (finance) and F5 (registry).

---

## Module layout

```
lib/cockpit/finance-v3/
├── envelope.ts           # CockpitEnvelope + Zod helpers
├── data-source.ts        # data_source → DataTruthBadge
├── parse.ts              # ContractViolationError
├── reconciliation.ts     # MRR/ARR math
├── flags.ts              # Feature flags
├── contracts/            # Zod schemas per domain
├── normalize/            # Raw backend → envelope
└── index.ts

tests/cockpit/finance-v3/
├── contracts.test.ts
└── data-truth-badge.test.tsx
```

---

## Data flow

```
Backend (flat or envelope JSON)
    → platformFetch (Bearer, /api/v1/cockpit/*)
    → parseContract(rawSchema)           # F4 population
    → normalize*(raw) → envelope         # or direct envelope parse for F3+
    → UI component + DataTruthBadge
```

---

## Reimplementation policy

- **Do not import** from closed `finance-ui/f1-f5` branches.
- Reference production backend (`nadakki-ai-suite`) for population shapes only.
- Target contracts for finance/registry/matrix defined ahead of backend work.

---

## Assumptions for F2+

- PR #310 (cockpit exit UX) merged to `main` before F2 shell work.
- F2 rebases on `main` if Topbar/Sidebar overlap.
