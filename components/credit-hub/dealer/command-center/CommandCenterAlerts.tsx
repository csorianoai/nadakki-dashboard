"use client";

import Link from "next/link";
import { AlertTriangle, Clock, FileWarning, TrendingUp } from "lucide-react";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";
import { humanizeApplicant } from "@/lib/credit-hub/honesty/humanize-applicant";
import { CommandCenterPanel } from "./CommandCenterChrome";

export interface DealerAlert {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  body: string;
  href?: string;
}

function buildAlerts(apps: CreditApplication[], currency: string): DealerAlert[] {
  const alerts: DealerAlert[] = [];
  const now = Date.now();

  for (const app of apps) {
    const h = humanizeApplicant(app, currency);
    const label = h.primaryLabel;
    const href = dealerDetailHref(app.application_id);

    if (!h.hasClientData) {
      alerts.push({
        id: `missing-${app.application_id}`,
        severity: "medium",
        title: "Expediente incompleto",
        body: `${label} — falta nombre del cliente`,
        href,
      });
    }

    if (!app.vehicle_make && !app.vehicle_model) {
      alerts.push({
        id: `vehicle-${app.application_id}`,
        severity: "low",
        title: "Vehículo sin registrar",
        body: label,
        href,
      });
    }

    const ageMs = now - new Date(app.created_at).getTime();
    const days = ageMs / (24 * 60 * 60 * 1000);
    if (
      ["submitted", "processing", "manual_review"].includes(app.status) &&
      days > 5
    ) {
      alerts.push({
        id: `stuck-${app.application_id}`,
        severity: "high",
        title: "Solicitud trabada",
        body: `${label} lleva ${Math.floor(days)} días sin avance`,
        href,
      });
    }

    if (["offered", "counter_offer"].includes(app.status)) {
      alerts.push({
        id: `offer-${app.application_id}`,
        severity: "medium",
        title: "Ofertas pendientes de decisión",
        body: `${label} — revisa y compara ofertas`,
        href,
      });
    }
  }

  return alerts.slice(0, 6);
}

const SEV = {
  high: { c: "var(--ch-danger-text)", bg: "var(--ch-danger-soft)", Icon: AlertTriangle },
  medium: { c: "var(--ch-warning-text)", bg: "var(--ch-warning-soft)", Icon: FileWarning },
  low: { c: "var(--ch-info-text)", bg: "var(--ch-info-soft)", Icon: Clock },
};

export function CommandCenterAlerts({
  applications,
  currency,
}: {
  applications: CreditApplication[];
  currency: string;
}) {
  const alerts = buildAlerts(applications, currency);
  if (alerts.length === 0) return null;

  return (
    <CommandCenterPanel
      title="Alertas operativas"
      sub="derivadas de tu cartera actual"
      truth="REAL"
    >
      <div className="ch-card" style={{ padding: 4 }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {alerts.map((a) => {
            const s = SEV[a.severity];
            const Icon = s.Icon;
            const inner = (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--ch-line)",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: s.bg,
                    color: s.c,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 2 }}>{a.body}</div>
                </div>
              </div>
            );
            return (
              <li key={a.id}>
                {a.href ? (
                  <Link href={a.href} className="block no-underline text-inherit hover:bg-[var(--ch-surface-2)]">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </CommandCenterPanel>
  );
}

export function NextBestAction({
  applications,
  currency,
  draftCount,
}: {
  applications: CreditApplication[];
  currency: string;
  draftCount: number;
}) {
  let title = "Captura una nueva solicitud";
  let body = "Inicia el wizard guiado para enviar a varios bancos en un solo flujo.";
  let href = "/credit-hub/dealer/applications/new/applicant";
  let truth: "REAL" | "DEMO" = "REAL";

  const offerPending = applications.find((a) =>
    ["offered", "counter_offer", "approved", "approved_with_stipulations"].includes(a.status),
  );
  const incomplete = applications.find(
    (a) => !humanizeApplicant(a, currency).hasClientData && a.status !== "draft",
  );
  const stuck = applications.find((a) => {
    const days = (Date.now() - new Date(a.created_at).getTime()) / 86400000;
    return ["submitted", "processing"].includes(a.status) && days > 5;
  });

  if (offerPending) {
    const h = humanizeApplicant(offerPending, currency);
    title = "Compara y acepta una oferta";
    body = `${h.primaryLabel} tiene respuestas de banco listas para revisar.`;
    href = dealerDetailHref(offerPending.application_id);
  } else if (draftCount > 0) {
    title = "Reanuda borradores pendientes";
    body = `${draftCount} solicitud(es) sin enviar — completa y envía hoy.`;
    href = "/credit-hub/dealer/applications/new/applicant";
  } else if (incomplete) {
    title = "Completa expedientes incompletos";
    body = "Hay solicitudes sin nombre de cliente — mejora la tasa de respuesta bancaria.";
    href = dealerDetailHref(incomplete.application_id);
  } else if (stuck) {
    title = "Da seguimiento a solicitudes trabadas";
    body = "Una solicitud lleva más de 5 días en proceso — contacta al banco.";
    href = dealerDetailHref(stuck.application_id);
  }

  return (
    <CommandCenterPanel title="Mejor siguiente acción" truth={truth}>
      <Link
        href={href}
        className="ch-card block no-underline"
        style={{
          padding: 18,
          display: "flex",
          gap: 14,
          alignItems: "center",
          border: "1px solid var(--ch-persona-soft)",
          background: "linear-gradient(135deg, var(--ch-surface) 0%, var(--ch-dealer-accent-soft) 100%)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "var(--ch-persona)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrendingUp className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ch-text)" }}>{title}</div>
          <div style={{ fontSize: 13, color: "var(--ch-text-2)", marginTop: 4 }}>{body}</div>
        </div>
      </Link>
    </CommandCenterPanel>
  );
}
