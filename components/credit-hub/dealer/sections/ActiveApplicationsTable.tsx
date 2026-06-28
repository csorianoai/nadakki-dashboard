"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { chRelTimeDealer, dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";
import { humanizeApplicant } from "@/lib/credit-hub/honesty/humanize-applicant";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { DisplayStatusPill } from "@/components/credit-hub/honesty/DisplayStatusPill";

export function ActiveApplicationsTable({
  apps,
  currency,
}: {
  apps: CreditApplication[];
  currency: string;
}) {
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
          {apps.map((app) => {
            const h = humanizeApplicant(app, currency);
            return (
            <tr key={app.application_id} style={{ borderBottom: "1px solid var(--ch-line)" }}>
              <td style={{ padding: "12px 14px" }}>
                <div style={{ fontWeight: 600 }}>{h.primaryLabel}</div>
                <div className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-3)" }}>
                  {h.secondaryLabel}
                </div>
              </td>
              <td className="ch-mono" style={{ padding: "12px 14px", fontWeight: 600 }}>
                {h.amountLabel}
              </td>
              <td style={{ padding: "12px 14px" }}>
                <DisplayStatusPill status={app.status} />
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
