"use client";

/** Persistent DEMO banner — always visible while USE_API=false (mock-first). */
export function DemoBanner() {
  return (
    <div className="fm-demo-banner" role="status" aria-live="polite">
      <span aria-hidden>◆</span>
      Modo demostración · datos ficticios · no usar para decisiones operativas
    </div>
  );
}
