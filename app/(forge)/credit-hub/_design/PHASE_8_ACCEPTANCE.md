# Phase 8 — acceptance tests (2026-05-02)

## Test A — Cold-start comprehension

**Question:** Where do I change the brand color of Credicefi?

**Procedure:** Open only [`README.md`](./README.md); follow [Change Credicefi brand color](./README.md#brand-color); follow pointer to `tokens.css` tenant block `.forge-app[data-tenant="credicefi"]`.

| Result | PASS |
|--------|------|
| **Time** | < 60 s (anchor `#brand-color` + table link to `./tokens.css`) |
| **Notes** | Spanish deep-dive lives in [`TENANT_THEMING.md`](./TENANT_THEMING.md) (not required for this test). |

---

## Test B — Tenant onboarding simulation (TENANT_THEMING.md only)

**Scenario:** Onboard fictional **Banco Boliviano**.

| Result | PASS |
|--------|------|
| **Time** | ~12 min conceptual walkthrough |
| **Steps followed** | A (contract) → B (SQL illustrative) → C (contrast + OKLCH) → D–H checklist |
| **Blockers** | None; SQL marked illustrative pending real `tenant_branding` schema (documented explicitly in guide). |

---

## Test C — Fork plan (REUSE_PLAYBOOK.md only)

**Product:** *Treasury Management Suite*.

| Result | PASS |
|--------|------|
| **Notes** | Plan maps reusable primitives/tokens (Section **A**), replacement hooks/routes (**B**), six-step fork (**C**), monorepo vs package decision (**D**), anti-patterns (**E**). |

---

## Gates (session)

| Gate | Result |
|------|--------|
| `npm run build` | Green (2026-05-02) |
| `npm run docs:validate` (`--strict`) | Exit 0 |
| Lighthouse a11y `/credit-hub/preview` | Existing artifact ≥ 0.95 (`_inventory/lh-credit-hub-preview-a11y-phase7-72.json`, score **0.97**) — no app code changes in Phase 8 |
| `markdown-link-check` | Zero broken links across the eight `_design/*.md` targets; log in `tools/docs/_linkcheck-report.txt` |
