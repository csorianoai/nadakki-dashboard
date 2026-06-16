"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { chRelTimeDealer, dealerDetailHref, formatDealerMoney } from "@/lib/credit-hub/dealer/dealerFormat";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { DealerStatusBadge } from "@/components/credit-hub/dealer/shared/dealerUi";

export function ActiveApplicationsTable({
  apps,
  currency,
}: {
  apps: CreditApplication[];
  currency: string;
}) {
  const prefix = currency === "DOP" ? "RD$" : currency === "MXN" ? "MX$" : `${currency} `;

  return (
    <div className="ch-card" style={{ overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--ch-line)", textAlign: "left" }}>
            {["Solicitante", "Monto", "Estado", "Actualizada", ""].map((h) => (
              <th key={h} className="ch-eyebrow" style={{ padding: "10px 14px", fontWeight: 600 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.application_id} style={{ borderBottom: "1px solid var(--ch-line)" }}>
              <td style={{ padding: "12px 14px" }}>
                <div style={{ fontWeight: 600 }}>{app.applicant_name || "—"}</div>
                <div className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-3)" }}>
                  {app.application_id}
                </div>
              </td>
              <td className="ch-mono" style={{ padding: "12px 14px", fontWeight: 600 }}>
                {formatDealerMoney(app.requested_amount, currency)}
              </td>
              <td style={{ padding: "12px 14px" }}>
                <DealerStatusBadge status={app.status} />
              </td>
              <td style={{ padding: "12px 14px", color: "var(--ch-text-3)", fontSize: 12 }}>
                {chRelTimeDealer(app.updated_at)}
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                <Link
                  href={dealerDetailHref(app.application_id)}
                  className="ch-btn ch-btn-ghost ch-btn-sm"
                  style={{ textDecoration: "none", minHeight: 44, minWidth: 44 }}
                >
                  Revisar
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
