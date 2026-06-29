"use client";

import Link from "next/link";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { humanizeApplicant, shortFolio } from "@/lib/credit-hub/honesty/humanize-applicant";
import { DisplayStatusPill } from "@/components/credit-hub/honesty/DisplayStatusPill";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { chRelTimeDealer, dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";

function banksColumn(app: CreditApplication): string {
  if (["offered", "counter_offer", "approved", "processed"].includes(app.status)) return "Multi";
  if (["submitted", "processing"].includes(app.status)) return "≥1";
  return "—";
}

export function RecentApplicationsTable({ apps, currency }: { apps: CreditApplication[]; currency: string }) {
  const rows = [...apps].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10);

  return (
    <section data-testid="recent-applications-table" className="mb-[26px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Solicitudes recientes
        </h2>
        <DataTruthBadge level="REAL" />
      </div>
      <div className="ch-card overflow-x-auto">
        <table className="ch-table min-w-[720px]">
          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th className="ch-num">Monto</th>
              <th className="ch-num">Bancos</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((app) => {
              const h = humanizeApplicant(app, currency);
              return (
                <tr key={app.application_id}>
                  <td>
                    <Link href={dealerDetailHref(app.application_id)} className="ch-mono font-semibold no-underline" style={{ color: "var(--ch-accent)" }}>
                      {shortFolio(app.application_id)}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 600 }}>{h.primaryLabel}</td>
                  <td style={{ color: "var(--ch-text-2)", fontSize: 12 }}>{h.vehicleLabel}</td>
                  <td className="ch-num">{h.amountLabel}</td>
                  <td className="ch-num">{banksColumn(app)}</td>
                  <td>
                    <DisplayStatusPill status={app.status} />
                  </td>
                  <td style={{ fontSize: 12, color: "var(--ch-text-3)" }}>{chRelTimeDealer(app.updated_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
