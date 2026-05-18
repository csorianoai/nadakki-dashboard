"use client";

import Link from "next/link";
import type { BankApplicationStipulation } from "@/lib/bank-application-detail/types";

export interface StipulationsPanelProps {
  applicationId: string;
  stipulations: BankApplicationStipulation[] | undefined;
}

export function StipulationsPanel({ applicationId, stipulations }: StipulationsPanelProps) {
  const rows = stipulations?.length ? stipulations : [];

  return (
    <section
      className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm"
      aria-labelledby="stips-section-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="stips-section-title" className="text-lg font-semibold text-forgeGray-900">
          Estipulaciones
        </h2>
        <Link
          href={`/bank/applications/${encodeURIComponent(applicationId)}/stipulations`}
          className="no-print text-forge-xs font-medium text-forgeBrand-700 hover:underline"
        >
          Gestionar →
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-forge-sm text-forgeGray-600">Sin estipulaciones activas.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((s, i) => (
            <li
              key={s.id ?? `stip-${i}`}
              className="rounded-lg border border-forgeGray-100 bg-forgeGray-50/60 px-3 py-2 text-forge-sm text-forgeGray-900"
            >
              <span className="font-medium">{s.description ?? "Estipulación"}</span>
              {s.status ? (
                <span className="ml-2 text-forge-xs uppercase text-forgeGray-600">({s.status})</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
