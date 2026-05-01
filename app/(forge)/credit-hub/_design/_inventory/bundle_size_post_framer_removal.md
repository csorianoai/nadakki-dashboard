# Bundle impact — `framer-motion` removal (Phase 7 Item 7.1)

- **Dependency:** `framer-motion` removed from `package.json` / lockfile.
- **Replacement:** `lib/motion-stub.tsx` — zero third-party animation runtime; strips motion-only props on `motion.*` host elements. Decorative sequences are no-ops; prefer CSS transitions for new UI.
- **Functional rewrites:** `components/credit-hub/system/PullToRefresh.tsx` — pull distance via React state + CSS `transform` / `opacity` (no motion values). `components/credit-hub/dealer/CountUpNumber.tsx` — `requestAnimationFrame` easing. `components/credit-hub/primitives/ForgeInput.tsx` — removed shake `useAnimationControls` path (error state remains via border color).
- **Quantified gzip delta:** not captured in CI from this Windows agent run (no `@next/bundle-analyzer` in repo). Expect on the order of **~50–60 KB gzip** removed from shared chunks once analyzed on a Unix CI runner.
