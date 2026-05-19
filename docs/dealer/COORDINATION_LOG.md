# Agent-3 coordination — Nadakki MVP V3 (dealer / credit UI)

Rolling log for META MVP 4 dealer enhancements (Agent zone: `app/credit/dealer/**`, `components/credit/**` overlays; **no** `app/(bank)/` subtree).

## 2026-05-18 — Agent-3

- **T6.7** Time Compression Wizard — merged (`PR #65`).
- **T6.4** App Health Score — `feat/v3/agent-3/t6-4-app-health-score` (PR vs `main`; flag `NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE`; rollback `docs/dealer/T6-4-app-health-score-rollback.md`).
- **T6.5** Risk-Based UX Playbook — `feat/v3/agent-3/t6-5-risk-based-ux` (stacked PR **base** `feat/v3/agent-3/t6-4-app-health-score` until T6.4 merges; flag `NEXT_PUBLIC_FEATURE_RISK_BASED_UX`; rollback `docs/dealer/T6-5-risk-based-ux-rollback.md`).

**Merge cadence:** land **T6.4 → `main`**, merge **T6.5 PR** afterward (rebasing/updating PR base once T6.4 integrates); both ship separately for reviewability.

