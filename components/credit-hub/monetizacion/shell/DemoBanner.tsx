"use client";

/** Persistent DEMO banner — always visible while USE_API=false (mock-first). */
export function DemoBanner() {
  return (
    <div className="fm-demo-banner" role="status" aria-live="polite">
      <span className="fm-demo-banner-dot" aria-hidden />
      <strong>DEMO</strong>
      · datos ficticios · no usar para decisiones operativas
    </div>
  );
}
