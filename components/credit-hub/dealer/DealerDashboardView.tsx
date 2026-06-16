"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { EmptyStateRich, KpiStripSkeleton } from "@/components/credit-hub/primitives";
import {
  DealerAppCard,
  DealerKpiCard,
  DealerQuickAction,
  DealerSectionHeader,
} from "@/components/credit-hub/dealer/shared/dealerUi";
import { ActiveApplicationsTable } from "@/components/credit-hub/dealer/sections/ActiveApplicationsTable";
import type { DealerDashboardViewProps } from "@/lib/credit-hub/types/dealer-views";
import {
  dealerDetailHref,
  dealerGreeting,
  isActivePipelineStatus,
} from "@/lib/credit-hub/dealer/dealerFormat";

export function DealerDashboardView({
  applications,
  stats,
  institutionName,
  userName,
  locale,
  currency,
  isLoading,
  isError,
  onRetry,
}: DealerDashboardViewProps) {
  const greetingName = userName?.trim() || institutionName || "equipo";

  const activeApps = useMemo(
    () =>
      [...applications]
        .filter((a) => isActivePipelineStatus(a.status))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [applications],
  );

  const draftCount = useMemo(() => applications.filter((a) => a.status === "draft").length, [applications]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <KpiStripSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyStateRich
        variant="error"
        primary={
          <button type="button" className="ch-btn ch-btn-secondary" onClick={onRetry}>
            Reintentar
          </button>
        }
      />
    );
  }

  const activeCount = (stats?.submitted_applications ?? 0) + (stats?.processing_applications ?? 0);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 className="ch-serif" style={{ margin: 0, fontSize: "clamp(22px, 5vw, 26px)", letterSpacing: "-0.01em" }}>
          {dealerGreeting(locale)}, {greetingName}.
        </h1>
        <div style={{ fontSize: 13, color: "var(--ch-text-3)", marginTop: 4 }}>{institutionName}</div>
      </div>

      <Link
        href="/credit-hub/dealer/applications/new/applicant"
        className="ch-btn ch-btn-persona ch-btn-lg"
        style={{ width: "100%", marginBottom: 22, height: 48, fontSize: 15, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <Plus className="h-5 w-5" aria-hidden />
        Nueva solicitud de crédito
      </Link>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-[14px] mb-[26px]">
        <DealerKpiCard label="Solicitudes activas" value={activeCount} trendLabel="enviadas + en proceso" />
        <DealerKpiCard label="Esta semana" value={stats?.applications_this_week ?? 0} trendLabel="nuevas solicitudes" />
        <DealerKpiCard label="Score promedio" value={stats?.average_score ?? "—"} trendLabel="de tus solicitudes" />
        <DealerKpiCard
          label="Tasa de aprobación"
          value={stats?.approval_rate != null ? (stats.approval_rate * 100).toFixed(0) : "—"}
          unit={stats?.approval_rate != null ? "%" : undefined}
          trendLabel="últimos 30 días"
          accent
        />
      </div>

      <DealerSectionHeader
        title="Solicitudes activas"
        sub={`${activeApps.length} en curso`}
        action={
          <Link href="/credit-hub/dealer/applications" className="ch-btn ch-btn-ghost ch-btn-sm" style={{ textDecoration: "none" }}>
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />

      {activeApps.length === 0 ? (
        <EmptyStateRich
          variant="empty"
          title="Sin solicitudes activas"
          description="Cuando envíes una solicitud aparecerá aquí."
          primary={
            <Link href="/credit-hub/dealer/applications/new/applicant" className="ch-btn ch-btn-persona">
              Nueva solicitud
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-[26px] grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {activeApps.slice(0, 6).map((app) => (
              <DealerAppCard key={app.application_id} app={app} currency={currency} href={dealerDetailHref(app.application_id)} />
            ))}
          </div>
          <div className="mb-[26px] hidden md:block">
            <ActiveApplicationsTable apps={activeApps.slice(0, 8)} currency={currency} />
          </div>
        </>
      )}

      <DealerSectionHeader title="Acciones rápidas" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        <DealerQuickAction
          title="Simular preaprobación"
          sub="Estima cuota y probabilidad antes de capturar"
          href="/credit-hub/dealer/preapproval"
        />
        {draftCount > 0 ? (
          <DealerQuickAction
            title="Reanudar borrador"
            sub={`${draftCount} solicitud(es) sin enviar`}
            href="/credit-hub/dealer/applications/new/applicant"
            accent="amber"
          />
        ) : null}
      </div>
    </div>
  );
}
