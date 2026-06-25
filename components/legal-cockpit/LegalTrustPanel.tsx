"use client";

import type { TrustItem } from "@/lib/legal-cockpit/types";

const STATUS_LABEL: Record<string, string> = {
  verified: "verificado",
  pending: "pendiente de verificación",
  demo: "demo",
  unavailable: "no disponible",
};

const STATUS_ICON: Record<string, string> = {
  verified: "\u2713",
  pending: "\u22EF",
  demo: "\u25CE",
  unavailable: "\u2717",
};

const STATUS_COLOR: Record<string, string> = {
  verified: "text-emerald-400",
  pending: "text-amber-400",
  demo: "text-zinc-400",
  unavailable: "text-red-400",
};

interface Props {
  items: TrustItem[];
}

export function LegalTrustPanel({ items }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-emerald-500"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="text-sm font-medium text-white">
          Confianza y control
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2 bg-zinc-800/30 rounded-lg px-3 py-2 text-xs"
          >
            <span
              className={`text-sm flex-shrink-0 ${STATUS_COLOR[item.status]}`}
            >
              {STATUS_ICON[item.status]}
            </span>
            <div>
              <p className="text-zinc-300">{item.label}</p>
              <p className={`text-[10px] ${STATUS_COLOR[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600 leading-relaxed border-t border-zinc-800 pt-3 italic">
        Nadakki Legal OS asiste a profesionales del derecho. No constituye
        asesoramiento jurídico definitivo. Toda recomendación debe ser revisada y
        validada por un abogado habilitado antes de ser utilizada en un
        expediente real. Los ahorros de tiempo son estimados según benchmarks
        internos.
      </p>
    </div>
  );
}
