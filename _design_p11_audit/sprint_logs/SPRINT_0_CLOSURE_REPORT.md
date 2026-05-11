# Sprint 0 — Closure Report

**Date:** 2026-05-10
**Status:** **COMPLETED**
**Duration:** 1 day (commenced 16:05, closed late same day)
**Branch baseline:** `main @ 7504a03` → ended at `main @ 9333381` (fast-forward, 3 frontend bug fixes shipped)

---

## Tickets

| ID | Description | Owner | Status | Commit |
|---|---|---|---|---|
| **P11-S0-01** | Redirect `/credit-hub/dealer/simulator` → `/credit-hub/dealer/preapproval` (fixes BUG-A1) | Cursor | ✅ COMPLETED | `9680f13` |
| **P11-S0-02** | Redirect `/credit-hub/bank/queue` → `/credit-hub/bank/applications` + Command Palette action target alignment (fixes BUG-A2) | Cursor | ✅ COMPLETED | `6e22a0e` |
| **P11-S0-03** | UTF-8 mojibake fix — replace latin1-encoded "Institucià³n" with proper "Institución" across topbar/tenant strings (fixes BUG-A3) | Cursor | ✅ COMPLETED | `9333381` |
| **P11-S0-04** | Playwright baseline screenshots for `before/after` visual regression starting in Sprint 1 | Cowork | 🟡 **PARTIAL** — script delivered, run pending Cesar local execution | n/a (no commit; audit artifacts in `_design_p11_audit/`) |
| **P11-S0-05** | RBAC backend audit (auth model, role schema, permissions matrix, migration risks) | Claude Code | 🔄 **IN PROGRESS** | n/a (audit-only, no commits expected) |
| **P11-S0-06** | GitHub Project Board for P11 sprint tracking | Cesar | ⏸️ Deferred (pending) | n/a |

**Outcome:** 3 ticketed bug fixes shipped to `main`. 1 deliverable partial-but-unblocked. 1 in flight. 1 deferred. Sprint 0 unblocks Sprint 1 cleanly.

---

## Git history

```
9333381  P11-S0-03  fix(i18n): repair UTF-8 mojibake in tenant strings        [Cursor]
6e22a0e  P11-S0-02  fix(routing): redirect /bank/queue + cmd palette target   [Cursor]
9680f13  P11-S0-01  fix(routing): redirect /dealer/simulator                  [Cursor]
7504a03  ← Sprint 0 baseline (P10-05 + P10-11 merged on main)
```

**Merge strategy:** fast-forward `fix/sprint-0-bugs-cowork-audit` → `main`. No merge commit; clean linear history. Branch deleted post-merge.

**Net diff vs Sprint 0 start:** +3 commits, all backend-safe (zero schema changes, zero API contract changes, surface only routing + i18n string repairs). Safe to deploy without coordination.

---

## Cowork artifacts delivered (P11-S0-04)

| Artifact | Path | Purpose |
|---|---|---|
| Playwright capture script | `_design_p11_audit/audit-screenshots.js` (100 lines, 3.7 KB) | Verbatim per spec — capture 9 dashboard routes + prototype standalone @ 1440×900 fullPage |
| One-click wrapper | `_design_p11_audit/RUN_BASELINE.cmd` | `cd` + `npx playwright install chromium` + `node audit-screenshots.js` + `dir` + `pause` |
| Output target dir | `_design_p11_audit/screenshots/baseline/` | Created, empty until first run |

**Pending Cesar:** `.\_design_p11_audit\RUN_BASELINE.cmd` on Windows PowerShell. Expected ~3 min wall-clock (most of it the one-time Chromium download).

---

## Issues found during Sprint 0

### Cowork sandbox network isolation (blocker for Cowork-side execution)

Two independent blockers prevented Cowork from running Playwright end-to-end:

1. **Cowork sandbox cannot reach Cesar's `http://127.0.0.1:3000`** — the sandbox's `localhost` loops back to itself, not to the user's host machine. Confirmed via `curl http://127.0.0.1:3000` → `Connection refused`. Confirmed via `curl http://host.docker.internal:3000` → `HTTP 403 (Connection blocked by network allowlist)`. The host-machine bridge that Chrome MCP relies on (forwarding to the user's actual Chrome) does NOT exist for arbitrary HTTP clients running inside the sandbox.
2. **`cdn.playwright.dev` blocked by sandbox allowlist** — `npx playwright install chromium` returns `HTTP 403 (Connection blocked by network allowlist)` for the Chromium binary CDN. Cannot download the browser inside the sandbox even if the dev-server bridge existed.

**Mitigation:** moved Playwright execution to Cesar's Windows machine via `RUN_BASELINE.cmd`. Windows has unrestricted network access to both `localhost` (its own dev server) and `cdn.playwright.dev` (Chromium download). Same script, same outputs, just hosted on the right side of the network boundary.

### BUG-A1 partial false positive (worth recording)

The original visual audit reported `/credit-hub/dealer/simulator` as a broken sidebar link (404). On closer inspection of `ForgeCreditHubSidebar.tsx`, the code *already* pointed to `/credit-hub/dealer/preapproval`. The 404 was reproduced via direct URL navigation, not via sidebar click. So **the user-facing UX was always correct**; what shipped in P11-S0-01 was a defensive redirect for users who type the URL manually or follow stale bookmarks. **Not a regression**, but worth confirming the sidebar code wasn't sneaking around two truths.

### Chrome MCP cannot save screenshots to disk

Chrome MCP returns each screenshot inline (visible in chat history) but does NOT expose a host-filesystem path for the PNG bytes. The `save_to_disk: true` parameter saves to Anthropic's content store (for chat attachment), not to Cesar's workspace. **Implication:** all PNG generation MUST flow through Playwright (or Cesar's own Snipping Tool / Windows+Shift+S), not through Chrome MCP. This is what motivated P11-S0-04 in the first place — and is the structural reason the Cowork visual audit report (24 KB markdown, no embedded PNGs) describes screens textually rather than referencing image files.

---

## Learnings (going into Sprint 1)

| # | Learning | Action for Sprint 1+ |
|---|---|---|
| L1 | Cowork sandbox is great for static analysis, code editing, audit writing — bad for browser automation that needs to reach the user's localhost | When a sprint needs visual regression, generate the Playwright script in Cowork, **execute on Cesar's machine**. Don't try to run from sandbox. |
| L2 | File-based prompt delivery to Claude Code works cleanly | Continue dropping prompts as `.md` files in `_design_p11_audit/rbac/` (or analogous track folders). Claude Code reads them and writes back. |
| L3 | Visual audit findings can over-state bugs | Verify each "bug" against the code, not just the rendered behavior, before opening a ticket. BUG-A1 was 50% real. |
| L4 | Chrome MCP is unreliable for >5 screenshots due to renderer timeouts | For each route that needs visual capture, plan ≥10s wait between navigate and screenshot. After 3-4 routes, expect at least one CDP timeout — re-navigate fixes it. |
| L5 | Sandbox/host filesystem sync has eventual-consistency issues for `Edit`/`Write` | Verify writes both via Read (host view) and `wc -l` (bash view). Earlier sessions saw 21-line gaps between the two. Don't trust either alone for critical files. |

---

## Active tracks at Sprint 0 close

| Track | Owner | State | Hand-off into Sprint 1 |
|---|---|---|---|
| Bug fixes (P11-S0-01/02/03) | Cursor | Merged to `main` | No hand-off; closed |
| Playwright baseline | Cowork → Cesar | Script delivered, run pending | Once Cesar runs RUN_BASELINE.cmd, Cowork analyzes against prototype (`BASELINE_ANALYSIS_TEMPLATE.md` ready) |
| RBAC backend audit | Claude Code | In progress (RBAC P11-S0-05 — 4 phases auth/roles/perm matrix/migration) | Feeds directly into P11-02 + P11-03 of Sprint 1 |
| Visual System V2 pre-work | Cursor | `sprint1_prep/` folder populated (`01..04_*.md` + `SPRINT_1_READINESS_REPORT.md`) | Inputs for P11-01 ticket execution in Sprint 1 |
| Cesar validation | Cesar | Pending RUN_BASELINE.cmd + visual smoke from `VISUAL_VALIDATION_CHECKLIST.md` | Gating signal before Sprint 1 kickoff |

---

## Next Sprint kickoff (Sprint 1 — Visual System + RBAC Backend)

Tickets cued up:

- **P11-01** Visual System V2 — token migration `forge-design-preview/forge/tokens.css` → `app/(forge)/credit-hub/_design/tokens.css` (~8h frontend). Pre-work in `sprint1_prep/`; readiness report says **NOT ready as "copy-file day 1"** — requires D0-* product/architecture decisions first.
- **P11-02** RBAC Database Schema (~12h backend). Depends on Claude Code's audit closing.
- **P11-03** RBAC Auth API (~16h backend). Depends on P11-02.
- **P11-04** Sprint 1 QA + Documentation (~4h). Cowork + Cesar.

**Sprint 1 total estimate:** ~40 hours / ~1 week with paralleling.

**Gating signal to start Sprint 1:** Cesar runs `RUN_BASELINE.cmd`, baseline screenshots land in `_design_p11_audit/screenshots/baseline/`, and the 6-test `VISUAL_VALIDATION_CHECKLIST.md` passes.

---

*End of Sprint 0 closure. All in-scope tickets either landed in `main` or have a clear handoff. No outstanding blockers for Sprint 1 except Cesar's gating actions (3 min PowerShell + 5 min visual smoke).*
