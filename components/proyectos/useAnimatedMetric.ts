"use client";

import { useEffect, useState } from "react";

export function useAnimatedCount(target: number, durationMs = 720): number {
  const safe = Number.isFinite(target) ? Math.max(0, Math.round(target)) : 0;
  const [v, setV] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const ease = 1 - (1 - t) ** 2;
      setV(Math.round(safe * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [safe, durationMs]);

  return v;
}
