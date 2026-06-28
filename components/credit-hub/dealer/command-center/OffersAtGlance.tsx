"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";
import { humanizeApplicant } from "@/lib/credit-hub/honesty/humanize-applicant";
import { CommandCenterPanel } from "./CommandCenterChrome";

export function OffersAtGlance({
  applications,
  currency,
}: {
  applications: CreditApplication[];
  currency: string;
}) {
  const withOffers = applications.filter((a) =>
    ["offered", "counter_offer", "approved", "approved_with_stipulations"].includes(a.status),
  );

  if (withOffers.length === 0) return null;

  return (
    <CommandCenterPanel
      title="Ofertas y decisiones pendientes"
      sub="abre el comparador en cada solicitud"
      truth="REAL"
      action={
        <Link href="/credit-hub/dealer/applications" className="ch-btn ch-btn-ghost ch-btn-sm" style={{ textDecoration: "none" }}>
          Ver solicitudes
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {withOffers.slice(0, 4).map((app) => {
          const h = humanizeApplicant(app, currency);
          return (
            <Link
              key={app.application_id}
              href={dealerDetailHref(app.application_id)}
              className="ch-card block no-underline"
              style={{ padding: 14, border: "1px solid var(--ch-warning-line, var(--ch-line))" }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>{h.primaryLabel}</div>
              <div style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 4 }}>
                {h.vehicleLabel} · {h.amountLabel}
              </div>
              <div style={{ fontSize: 12, color: "var(--ch-warning-text)", marginTop: 8, fontWeight: 600 }}>
                Comparar ofertas →
              </div>
            </Link>
          );
        })}
      </div>
    </CommandCenterPanel>
  );
}
