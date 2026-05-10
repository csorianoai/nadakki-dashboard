"use client";

import { AlertTriangle } from "lucide-react";

type Props = { variant?: "compact" | "full" };

export function AttorneyReviewBadge({ variant = "full" }: Props) {
  const text =
    variant === "compact" ? "Requiere revisión" : "Requiere revisión de abogado autorizado";

  return (
    <div
      className="inline-flex max-w-full items-center gap-1.5 rounded-forge-sm border border-forgeWarning-500/30 bg-forgeWarning-50 px-2 py-1 text-xs font-medium leading-snug text-forge-warning"
      role="status"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="leading-snug">{text}</span>
    </div>
  );
}

export function AttorneyReviewRecommendedBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-2 py-1 text-xs font-medium text-forge-text-muted">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-forge-warning" aria-hidden />
      <span>Revisión recomendada</span>
    </div>
  );
}
