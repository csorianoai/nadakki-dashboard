"use client";

import type { LegalHonestyBadge } from "@/lib/legal/content-honesty";

const BADGE_STYLES: Record<LegalHonestyBadge, string> = {
  MOCK: "border-violet-300 bg-violet-50 text-violet-900",
  DRAFT: "border-amber-300 bg-amber-50 text-amber-950",
  DEMO: "border-zinc-400 bg-zinc-100 text-zinc-800",
};

const BADGE_LABELS: Record<LegalHonestyBadge, string> = {
  MOCK: "MOCK",
  DRAFT: "DRAFT — NO CERTIFICADO",
  DEMO: "DEMO",
};

export function LegalContentHonestyBadges({ badges }: { badges: LegalHonestyBadge[] }) {
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-2" role="status" aria-label="Etiquetas de honestidad de contenido">
      {badges.map((b) => (
        <span
          key={b}
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${BADGE_STYLES[b]}`}
        >
          {BADGE_LABELS[b]}
        </span>
      ))}
    </div>
  );
}
