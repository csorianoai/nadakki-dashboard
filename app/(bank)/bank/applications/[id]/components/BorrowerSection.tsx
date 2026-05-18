"use client";

import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";

export interface BorrowerSectionProps {
  borrower: BankApplicationDetailResponse["borrower"];
}

/** Masked PII is produced server-side; we never render raw identifiers here. */
export function BorrowerSection({ borrower }: BorrowerSectionProps) {
  return (
    <section
      className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm"
      aria-labelledby="borrower-section-title"
    >
      <h2 id="borrower-section-title" className="text-lg font-semibold text-forgeGray-900">
        Solicitante
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-forge-xs font-medium uppercase text-forgeGray-500">Cédula (enmascarada)</dt>
          <dd className="mt-1 font-forgeMono text-forge-sm text-forgeGray-900">{borrower?.cedula_masked ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-forge-xs font-medium uppercase text-forgeGray-500">Año de nacimiento</dt>
          <dd className="mt-1 text-forge-sm text-forgeGray-900">{borrower?.dob_year ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-forge-xs font-medium uppercase text-forgeGray-500">Ingreso mensual</dt>
          <dd className="mt-1 tabular-nums text-forge-sm text-forgeGray-900">
            {borrower?.income_monthly != null
              ? new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(
                  borrower.income_monthly,
                )
              : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-forge-xs font-medium uppercase text-forgeGray-500">Empleo</dt>
          <dd className="mt-1 text-forge-sm text-forgeGray-800">
            {[borrower?.employment?.employer, borrower?.employment?.position]
              .filter(Boolean)
              .join(" · ") || "—"}
            {borrower?.employment?.tenure_months != null ? (
              <span className="text-forgeGray-600"> · Antigüedad: {borrower.employment.tenure_months} meses</span>
            ) : null}
          </dd>
        </div>
      </dl>
    </section>
  );
}
