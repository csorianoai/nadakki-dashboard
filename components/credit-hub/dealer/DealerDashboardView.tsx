"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { EmptyStateRich, KpiStripSkeleton } from "@/components/credit-hub/primitives";
import {
  DealerAppCard,
  DealerQuickAction,
  DealerSectionHeader,
} from "@/components/credit-hub/dealer/shared/dealerUi";
import { ActiveApplicationsTable } from "@/components/credit-hub/dealer/sections/ActiveApplicationsTable";
import { PipelineFunnel } from "@/components/credit-hub/dealer/sections/PipelineFunnel";
import { DealerGoals } from "@/components/credit-hub/dealer/sections/DealerGoals";
import { BankRanking } from "@/components/credit-hub/dealer/sections/BankRanking";
import { CommandCenterKpi } from "@/components/credit-hub/dealer/command-center/CommandCenterChrome";
import {
  CommandCenterAlerts,
  NextBestAction,
} from "@/components/credit-hub/dealer/command-center/CommandCenterAlerts";
import { OffersAtGlance } from "@/components/credit-hub/dealer/command-center/OffersAtGlance";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { DealerDashboardViewProps } from "@/lib/credit-hub/types/dealer-views";
import {
  activeApplicationsFromList,
  activePipelineCountFromStats,
  applicationsThisWeek,
  completedCountFromStats,
} from "@/lib/credit-hub/dealer/dealer-pipeline-metrics";
import { dealerDetailHref, dealerGreeting } from "@/lib/credit-hub/dealer/dealerFormat";

/**
 * P1 — Dealer Command Center (Inicio).
 * Renders on the REAL route: app/(forge)/credit-hub/dealer/page.tsx
 */
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
      [...activeApplicationsFromList(applications)].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [applications],
  );

  const draftCount = useMemo(() => applications.filter((a) => a.status === "draft").length, [applications]);

  const pipelineActive = activePipelineCountFromStats(stats);
  const weekCount = applicationsThisWeek(applications);
  const completedCount = completedCountFromStats(stats);

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

  return (
    <div data-testid="dealer-command-center">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <span
            className="ch-eyebrow"
            style={{ color: "var(--ch-dealer-accent-text)", letterSpacing: "0.08em" }}
          >
            Dealer Command Center
          </span>
          <DataTruthBadge level="REAL" />
        </div>
        <h1
          className="ch-serif"
          style={{ margin: 0, fontSize: "clamp(24px, 5vw, 30px)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
        >
          {dealerGreeting(locale)}, {greetingName}.
        </h1>
        <p style={{ fontSize: 14, color: "var(--ch-text-2)", margin: "6px 0 0", maxWidth: 520 }}>
          {institutionName} — inteligencia de originación en tiempo real sobre tu cartera.
        </p>
      </header>

      <Link
        href="/credit-hub/dealer/applications/new/applicant"
        className="ch-btn ch-btn-persona ch-btn-lg"
        style={{
          width: "100%",
          marginBottom: 22,
          height: 48,
          fontSize: 15,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Plus className="h-5 w-5" aria-hidden />
        Nueva solicitud de crédito
      </Link>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-[14px] mb-[26px]">
        <CommandCenterKpi
          label="En curso"
          value={pipelineActive}
          trendLabel="pipeline activo (sin completadas)"
          truth="REAL"
        />
        <CommandCenterKpi
          label="Esta semana"
          value={weekCount}
          trendLabel="nuevas en los últimos 7 días"
          truth="REAL"
        />
        <CommandCenterKpi
          label="Score promedio"
          value={stats?.average_score ?? "—"}
          trendLabel="de tu cartera"
          truth="REAL"
        />
        <CommandCenterKpi
          label="Tasa de aprobación"
          value={stats?.approval_rate != null ? (stats.approval_rate * 100).toFixed(0) : "—"}
          unit={stats?.approval_rate != null ? "%" : undefined}
          trendLabel="decididas"
          accent
          truth="REAL"
        />
      </div>

      <NextBestAction applications={applications} currency={currency} draftCount={draftCount} />

      <CommandCenterAlerts applications={applications} currency={currency} />

      <OffersAtGlance applications={applications} currency={currency} />

      <DealerSectionHeader
        title="Solicitudes en curso"
        sub={`${activeApps.length} en esta página · ${pipelineActive} en pipeline (stats)`}
        action={
          <Link
            href="/credit-hub/dealer/applications"
            className="ch-btn ch-btn-ghost ch-btn-sm"
            style={{ textDecoration: "none" }}
          >
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />
      <div style={{ marginBottom: 8 }}>
        <DataTruthBadge level="REAL" />
      </div>

      {activeApps.length === 0 ? (
        <EmptyStateRich
          variant="empty"
          title="Sin solicitudes en curso"
          description={
            completedCount > 0
              ? `Tienes ${completedCount} solicitud(es) completadas. Captura una nueva para llenar el pipeline.`
              : "Cuando envíes una solicitud aparecerá aquí con nombre y vehículo."
          }
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
              <DealerAppCard
                key={app.application_id}
                app={app}
                currency={currency}
                href={dealerDetailHref(app.application_id)}
              />
            ))}
          </div>
          <div className="mb-[26px] hidden md:block">
            <ActiveApplicationsTable apps={activeApps.slice(0, 8)} currency={currency} />
          </div>
        </>
      )}

      <PipelineFunnel stats={stats} />
      <BankRanking />
      <DealerGoals stats={stats} applications={applications} currency={currency} />

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
