# Changelog

All notable changes to **Nadakki Dashboard** are documented in this file.

## [1.0.0] — 2026-04-29

### Added

- **Forge Credit Hub** redesign (Phases 1–5): institutional v3.2 tokens, primitives, bank/dealer surfaces, toast/empty-state/command-palette polish.
- **Phase 6 — Reusability:** `NEXT_PUBLIC_FORGE_TEST_TENANT=mx` local fixture (**TestBank Mexico**), `.forge-app` tenant theme wiring, `REUSABILITY_TEST.md`, screenshot capture script, `es-MX` i18n bundle, regulatory surface helper for compliance copy.

### Changed

- **Phase 7 — Motion:** Removed `framer-motion` dependency; added `lib/motion-stub.tsx` for legacy JSX compatibility; **PullToRefresh** is CSS/state-driven.
- **Forge globals:** `forge-globals.css` imports only `_design/tokens.css` (legacy `styles/forge-tokens.css` remains for non-Forge stacks and Tailwind dual-var fallbacks).

### Notes

- Phase 8 (living documentation) is **out of scope** until the next greenlight.
