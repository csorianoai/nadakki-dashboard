# Branch & PR Inventory — nadakki-dashboard

**Fecha:** 2026-06-26
**Propósito:** Inventario read-only para que César decida qué limpiar.
**Acción tomada:** NINGUNA — solo lectura.

---

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Branches mergeadas (borrables sin riesgo) | 29 |
| Branches NO mergeadas | 56 |
| PRs abiertos | 9 |
| Branches no mergeadas SIN PR abierto | 47 |
| **Total branches remotas** | **85** |

---

## Tabla A — Branches mergeadas a main (candidatas a borrar)

Estas 29 branches ya están integradas en `main`. Borrarlas no pierde ningún commit.

| # | Branch |
|---|--------|
| 1 | `chore/lint-warnings-bank-cleanup` |
| 2 | `feat/ame-phase-16` |
| 3 | `feat/competitor-research-ui` |
| 4 | `feat/credit-hub-frontend-fase-1` |
| 5 | `feat/forge-bank-portal-tier-s` |
| 6 | `feat/forge-cowork-2026-05-09` |
| 7 | `feat/forge-frontend-session-1-foundation` |
| 8 | `feat/forge-frontend-session-2-content` |
| 9 | `feat/forge-real-credit-analysis-engine` |
| 10 | `feat/forge-redesign-v3` |
| 11 | `feat/legal-core-quick-polish` |
| 12 | `feat/marketing-onboarding-wizard` |
| 13 | `feat/mvp-t2b-ep10b-frontend-application-detail` |
| 14 | `feat/projects-comite-nav-principal` |
| 15 | `feat/projects-comite-ui-fase1c` |
| 16 | `feat/proyectos-documentos-ui` |
| 17 | `feat/sic-v6-frontend-bankready` |
| 18 | `feat/sidebar-v2-notion-style` |
| 19 | `feature/consolidate-advertising-20260208-1443` |
| 20 | `fix/advertising-dark-theme-readability` |
| 21 | `fix/cotizaciones-contratista-selector` |
| 22 | `fix/documentos-modal-overlay` |
| 23 | `fix/legal-chat-empty-query` |
| 24 | `fix/remaining-mock-cleanup` |
| 25 | `fix/remove-marketing-mock-data` |
| 26 | `fix/sprint-0-bugs-cowork-audit` |
| 27 | `legal-phase2/2.4-frontend-cases` |
| 28 | `marketing-frontend-sync` |
| 29 | `security/bff-middleware-final` |

---

## Tabla B — Branches NO mergeadas (requieren decisión)

### B.1 — Activas (< 7 días, desde 2026-06-20)

| # | Branch | Último commit | Mensaje |
|---|--------|---------------|---------|
| 1 | `feat/legal-hearings-calendar` | 2026-06-26 | fix(legal): move hearings UI to /legal/audiencias |
| 2 | `feat/legal-wizard-full-actor-profile` | 2026-06-26 | feat(legal): wizard captura perfil completo de actores |
| 3 | `chore/android-gitignore` | 2026-06-25 | chore(android): add .gradle local.properties to gitignore |
| 4 | `feat/legal-fullwidth-remove-dead-sidebar` | 2026-06-25 | feat(legal): remove dead module sidebar + full width |
| 5 | `feat/legal-os-cockpit-v42` | 2026-06-25 | feat(legal): add Legal OS Cockpit v4.2 |
| 6 | `feat/legal-subnav-cockpit` | 2026-06-25 | feat(legal): add Cockpit link to LegalSubNav |
| 7 | `feat/shell-v5-sidebar-collapse` | 2026-06-25 | feat(shell): collapsible sidebar 240px/68px |
| 8 | `fix/auth-timeout-warmup` | 2026-06-25 | fix(auth): add 15s timeout + warmup ping |
| 9 | `fix/cockpit-shell-syntax` | 2026-06-25 | fix(legal): remove duplicate LegalCockpitShell import |
| 10 | `fix/keepalive-cron` | 2026-06-25 | fix(infra): Vercel cron keep-alive every 10min |
| 11 | `fix/legal-cockpit-layout` | 2026-06-25 | fix(legal): integrate cockpit into legal layout |
| 12 | `fix/remove-dead-sidebar-panel` | 2026-06-25 | fix(shell): remove dead sidebar panel |
| 13 | `fix/remove-keepalive` | 2026-06-25 | chore: remove android build artifacts from PR |
| 14 | `fix/remove-vercel-json` | 2026-06-25 | fix(infra): remove vercel.json |
| 15 | `fix/vercel-json` | 2026-06-25 | fix(infra): remove invalid crons from vercel.json |
| 16 | `feat/contable-dashboard-completo` | 2026-06-24 | feat(contable-dashboard): modulo contable completo |
| 17 | `feat/contable-sidebar-dashboard-financiero` | 2026-06-24 | feat(contable): sidebar + dashboard ejecutivo |
| 18 | `feat/dealer-bank-mobile-app` | 2026-06-24 | chore(dealer-app): add Capacitor dependencies |
| 19 | `codex/pr-b-onboarding-wizard-ui` | 2026-06-23 | add institutional and dealer onboarding wizard |

### B.2 — Recientes (1–4 semanas, 2026-05-29 a 2026-06-19)

| # | Branch | Último commit | Mensaje |
|---|--------|---------------|---------|
| 1 | `feat/antispoofing-bank-evidence-real` | 2026-06-17 | feat(credit-hub): replace EvidenceGrid hardcodes |
| 2 | `feat/antispoofing-liveness-customer-ui` | 2026-06-17 | feat(credit-hub): liveness capture flow |
| 3 | `feat/mee-redesign-from-claude-design` | 2026-06-15 | fix(mee): polish FiltersBar |
| 4 | `fix/layout-height-chain` | 2026-06-14 | fix(layout): constrain height chain |
| 5 | `feat/market-intel-f5b-frontend` | 2026-06-11 | [F5b] Align market-intel API |
| 6 | `fix/mee-segment-growth-rate-display` | 2026-06-16 | fix(mee): consume growth_rate_by_year |
| 7 | `fix/sprint3-bff-auth-tenant` | 2026-06-04 | fix(sprint3): BFF v2 proxy |
| 8 | `feat/v3/phase-a/agent-3/dealer-e2e` | 2026-05-31 | test(dealer): expose mobile integration |
| 9 | `feat/v3/phase-a/agent-4/bank-e2e` | 2026-05-30 | test(v3/phase-a): Agent-4 bank E2E |
| 10 | `security/phase1-frontend-jwt-helpers` | 2026-05-29 | fix(security): document-intelligence Bearer |
| 11 | `audit/phase2-fetch-inventory` | 2026-05-30 | audit(security): phase2 fetch inventory |

### B.3 — Antiguas (> 1 mes, antes de 2026-05-27)

| # | Branch | Último commit | Mensaje |
|---|--------|---------------|---------|
| 1 | `feat/frontend/dealer-wizard-field-validation` | 2026-05-26 | feat(dealer): validacion de campos obligatorios |
| 2 | `feat/projects-analisis-demo-ready` | 2026-05-25 | feat(projects-analisis): market RAG sources card |
| 3 | `feat/projects-next-action` | 2026-05-25 | feat(projects): next-action recommendation panel |
| 4 | `feat/projects-riesgos-ia` | 2026-05-25 | feat(projects-riesgos): wire AI risk scan |
| 5 | `feat/projects-valoracion-senal-sustentada` | 2026-05-26 | fix(projects-valoracion): alinear AnalisisClient |
| 6 | `feat/projects-wbs-ia` | 2026-05-25 | feat(projects-wbs): wire AI WBS generation |
| 7 | `fix/globals-css-parse-error` | 2026-05-25 | fix(css): load Google Fonts via layout |
| 8 | `feature/projects-core-v1-frontend` | 2026-05-23 | feat(projects-core-fe): intake wizard |
| 9 | `feature/projects-core-v1-frontend-fase8` | 2026-05-24 | feat(projects-core-fe): full creation wizard |
| 10 | `feature/projects-core-v1-frontend-fase9-analisis` | 2026-05-24 | feat(projects-core-fe): analysis UI |
| 11 | `feat/mvp-t2b-ep09b-frontend-bank-queue` | 2026-05-17 | feat(mvp-t2b): EP-9b bank application queue UI |
| 12 | `feat/mvp-t2b-ep11-frontend-decision-modal` | 2026-05-18 | feat(mvp-t2b): EP-11 frontend decision modal |
| 13 | `feat/cap11-phase3-dashboard-page` | 2026-05-15 | feat(credit): Phase 3 Dashboard page |
| 14 | `fix/advertising-dark-theme` | 2026-05-13 | fix(advertising): apply dark theme |
| 15 | `feat/sidebar-restoration` | 2026-05-13 | feat(navigation): restore full sidebar |
| 16 | `feat/sidebar-vibrant-redesign` | 2026-05-13 | docs(forge): catalog Global shell |
| 17 | `feat/s3-02-sic-migration-phase1` | 2026-05-12 | feat(sic): migrate Phase 1 to Forge |
| 18 | `feat/s3-04-legal-contracts-migration` | 2026-05-12 | feat(legal): migrate contracts page |
| 19 | `feat/p11-03-auth-frontend-hooks` | 2026-05-11 | feat(auth): Auth v2 frontend hooks |
| 20 | `feat/p11-04-auth-ui` | 2026-05-11 | feat(auth): Login UI + AuthProvider |
| 21 | `legal-core/audit-and-revolution` | 2026-05-08 | feat(legal): document-driven revolution |
| 22 | `legal-phase2/fix-fe-be-mismatches` | 2026-05-07 | docs(legal): reporte verificacion 2.4 |
| 23 | `legal-recovery/safe-visual-changes` | 2026-05-08 | feat(legal): recuperar cambios visuales |
| 24 | `feat/forge-credit-analysis-ui` | 2026-04-28 | chore: trigger vercel rebuild |
| 25 | `feat/forge-frontend-session-3-polish` | 2026-04-27 | feat(forge): Sesion 3 Polish |
| 26 | `feat/forge-frontend-session-4-real-data` | 2026-04-27 | feat(forge): add contextual credit guide |

---

## Tabla C — PRs abiertos

| PR # | Título | Branch | Edad | Mergeable | Recomendación |
|------|--------|--------|------|-----------|---------------|
| 191 | feat(legal): perfil completo de cliente + multiples partes | `feat/legal-wizard-full-actor-profile` | 0d | MERGEABLE | **Revisar** — PR del día, listo para merge |
| 186 | feat(legal): hearings calendar and KPI dashboard | `feat/legal-hearings-calendar` | 0d | UNKNOWN | **Revisar** — trabajo activo |
| 159 | feat(dealer-app): PWA + Capacitor mobile app | `feat/dealer-bank-mobile-app` | 1d | UNKNOWN | **Revisar** — trabajo reciente |
| 144 | feat(credit-hub): replace EvidenceGrid hardcodes | `feat/antispoofing-bank-evidence-real` | 9d | UNKNOWN | **Revisar** — puede tener conflictos |
| 143 | feat(credit-hub): liveness capture flow | `feat/antispoofing-liveness-customer-ui` | 9d | UNKNOWN | **Revisar** — puede tener conflictos |
| 142 | fix(mee): consume growth_rate_by_year by segment | `fix/mee-segment-growth-rate-display` | 10d | UNKNOWN | **Revisar** — fix puntual |
| 123 | fix(layout): acotar altura para que main sea scroller | `fix/layout-height-chain` | 12d | UNKNOWN | **Revisar** — fix de layout |
| 93 | audit(security): phase2 fetch inventory + Bearer gaps | `audit/phase2-fetch-inventory` | 27d | UNKNOWN | **Revisar** — auditoría de seguridad |
| 45 | fix(advertising): white-on-white text bug | `fix/advertising-dark-theme` | 44d | UNKNOWN | **Cerrar?** — 44 días sin actividad |

---

## Notas

- Las 29 branches mergeadas se pueden borrar con `git push origin --delete <branch>` sin perder trabajo.
- 8 de 9 PRs tienen mergeable=UNKNOWN (GitHub calcula esto lazily).
- 47 branches no mergeadas no tienen PR abierto asociado.
