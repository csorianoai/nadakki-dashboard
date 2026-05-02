# Changelog

All notable changes to **Nadakki Dashboard** are documented in this file.

## [1.0.0] — 2026-04-29

### Added

- **Forge Credit Hub** redesign (Phases 1–5): institutional v3.2 tokens, primitives, bank/dealer surfaces, toast/empty-state/command-palette polish.
- **Phase 6 — Reusability:** `NEXT_PUBLIC_FORGE_TEST_TENANT=mx` local fixture (**TestBank Mexico**), `.forge-app` tenant theme wiring, `REUSABILITY_TEST.md`, screenshot capture script, `es-MX` i18n bundle, regulatory surface helper for compliance copy.

### Changed

- **Phase 7 — Motion:** Removed `framer-motion` dependency; added `lib/motion-stub.tsx` for legacy JSX compatibility; **PullToRefresh** is CSS/state-driven.
- **Forge globals:** `forge-globals.css` imports only `_design/tokens.css` (legacy `styles/forge-tokens.css` remains for non-Forge stacks and Tailwind dual-var fallbacks).

- **Phase 8 — Living documentation:** `_design/` README + design system, `TOKENS.md` autogen, `COMPONENTS.md` primitive catalog + `PAGES.md` hero reference, Spanish operational guides (`TENANT_THEMING.md`, `HOW_TO_MODIFY.md`, `REUSE_PLAYBOOK.md`), Playwright capture tooling under `tools/docs/`, `docs:validate` strict mode, optional PR workflow for doc drift, `PHASE_8_ACCEPTANCE.md`.

### Notes

- **Legacy `components/credit-hub/**`:** documented as out-of-design-system in `MIGRATION.md` / Phase 7.2 Case B; Tailwind permanent legacy aliases remain until migration.
