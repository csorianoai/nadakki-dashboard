"use client";

import { useMemo } from "react";
import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import { EmptyStateRich } from "@/components/credit-hub/primitives";
import { CHPanelState } from "@/components/credit-hub/system/CHPanelState";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { useAuctionIntel } from "@/lib/credit-hub/hooks/useAuctionIntel";
import { isAnalyticsUnavailable } from "@/lib/credit-hub/hooks/analyticsQueryOptions";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import { chMoney } from "@/lib/credit-hub/ch-base";

function hasAuctionMetrics(data: {
  total_offers?: number;
  win_rate?: number | null;
  applications_with_offers?: number;
} | undefined): boolean {
  if (!data) return false;
  return (
    (data.total_offers ?? 0) > 0 ||
    data.win_rate != null ||
    (data.applications_with_offers ?? 0) > 0
  );
}

export function AuctionIntel({ analytics }: { analytics?: BankDashboardAnalytics }) {
  const query = useAuctionIntel();
  const data = query.data;
  const unavailable = isAnalyticsUnavailable(query.error);
  const hasMetrics = hasAuctionMetrics(data);
  const panelTruth: DataTruthLevel = hasMetrics && !query.isError ? "REAL" : unavailable ? "ROADMAP" : "ROADMAP";

  const winRate = data?.win_rate != null ? `${(data.win_rate * 100).toFixed(0)}` : "—";
  const lookToBook = data?.look_to_book != null ? `${data.look_to_book.toFixed(1)}` : "—";
  const tto = data?.avg_time_to_offer_hours != null ? `${data.avg_time_to_offer_hours}` : "—";
  const lost = data?.lost_deals_count ?? 0;

  const portfolioValue = analytics?.portfolio_value;
  const metricTruth: DataTruthLevel = hasMetrics ? "REAL" : "ROADMAP";

  const lenderRows = useMemo(() => {
    const rows = data?.lender_breakdown ?? [];
    return rows.filter((r) => (r.offer_count ?? 0) > 0);
  }, [data?.lender_breakdown]);

  return (
    <section style={{ marginBottom: 26 }} data-testid="auction-intel-panel">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="ch-eyebrow">Inteligencia de subasta</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Desempeño anonimizado
        </h2>
        <DataTruthBadge level={panelTruth} />
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ch-text-3)" }}>
        Agregado sin nombres ni tasas de competidores · aislamiento activo
      </p>

      <CHPanelState
        isLoading={query.isLoading && query.isFetching}
        isError={query.isError && !unavailable}
        isUnavailable={unavailable}
        unavailableTitle="Inteligencia de subasta no conectada"
        unavailableDescription="El endpoint auction-intel aún no está disponible en este entorno."
        errorTitle="Error al cargar inteligencia de subasta"
        onRetry={() => void query.refetch()}
        loadingLabel="Cargando métricas de subasta…"
      >
        {hasMetrics ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-3">
              <MetricCard
                label="Win rate"
                value={winRate}
                unit={data?.win_rate != null ? "%" : undefined}
                truth={metricTruth}
                accent
                trendDemo={data?.win_rate == null}
                trendColor="var(--ch-success)"
                delta={{ direction: "up", label: "solo tu institución" }}
              />
              <MetricCard
                label="Look-to-book"
                value={lookToBook}
                unit={data?.look_to_book != null ? "x" : undefined}
                truth={metricTruth}
                trendDemo={data?.look_to_book == null}
                trendColor="var(--ch-bank-accent, var(--ch-info))"
              />
              <MetricCard
                label="Tiempo a oferta"
                value={tto}
                unit={data?.avg_time_to_offer_hours != null ? "h" : undefined}
                truth={metricTruth}
                delta={{ direction: "down", label: "meta ≤ 3 h" }}
                trendDemo={data?.avg_time_to_offer_hours == null}
              />
              <MetricCard
                label="Deals perdidos"
                value={lost || "—"}
                truth={metricTruth}
                delta={lost ? { direction: "down", label: "sin PII competidor" } : undefined}
                trendDemo={!data}
                trendColor="var(--ch-danger)"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
              <div className="ch-card overflow-hidden">
                <div className="ch-card-h">
                  <div className="ch-card-title">Win-rate por banda de score</div>
                  <DataTruthBadge level="ROADMAP" />
                </div>
                <div style={{ padding: "16px" }}>
                  <EmptyStateRich
                    variant="placeholder"
                    title="Próximamente"
                    description="El backend aún no expone win_rate_breakdown por banda de score."
                  />
                </div>
              </div>

              <div className="ch-card overflow-hidden">
                <div className="ch-card-h">
                  <div className="ch-card-title">Deals perdidos — motivo agregado</div>
                  <DataTruthBadge level="ROADMAP" />
                </div>
                <div style={{ padding: "16px" }}>
                  <EmptyStateRich
                    variant="placeholder"
                    title="Próximamente"
                    description={
                      lost > 0
                        ? `${lost} deals perdidos en el periodo — motivos agregados pendientes de API.`
                        : "Motivos agregados de deals perdidos pendientes de API."
                    }
                  />
                </div>
              </div>
            </div>

            {lenderRows.length > 0 ? (
              <div className="ch-card overflow-hidden mb-3">
                <div className="ch-card-h">
                  <div className="ch-card-title">Desglose por prestamista</div>
                  <DataTruthBadge level="REAL" />
                </div>
                <table className="ch-table">
                  <thead>
                    <tr>
                      <th>Prestamista</th>
                      <th className="ch-num">Ofertas</th>
                      <th className="ch-num">Win rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lenderRows.map((row) => (
                      <tr key={row.lender_code}>
                        <td>{row.lender_code}</td>
                        <td className="ch-num">{row.offer_count}</td>
                        <td className="ch-num">
                          {row.win_rate != null ? `${(row.win_rate * 100).toFixed(0)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyStateRich
            variant="empty"
            title="Sin métricas de subasta"
            description="No hay ofertas ni aplicaciones con ofertas en el periodo. Verifica el seed del tenant demo."
            primary={
              <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={() => void query.refetch()}>
                Reintentar
              </button>
            }
          />
        )}

        <div className="ch-card ch-card-spotlight overflow-hidden">
          <div className="ch-card-h">
            <div>
              <div className="ch-card-title">Portafolio y financiero</div>
              <div className="ch-card-sub">Volumen · APR · concentración</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ padding: "14px 16px" }}>
            {[
              {
                label: "Volumen cartera",
                value: portfolioValue != null ? chMoney(portfolioValue) : "—",
                truth: (portfolioValue != null ? "REAL" : "ROADMAP") as DataTruthLevel,
              },
              {
                label: "Solicitudes con ofertas",
                value: data?.applications_with_offers != null ? String(data.applications_with_offers) : "—",
                truth: (data?.applications_with_offers != null ? "REAL" : "ROADMAP") as DataTruthLevel,
              },
              { label: "APR ponderado", value: "—", truth: "ROADMAP" as DataTruthLevel },
            ].map((row, i) => (
              <div
                key={row.label}
                style={{
                  padding: "10px 12px",
                  borderRight: i < 2 ? "1px solid var(--ch-line-subtle)" : undefined,
                }}
              >
                <div className="ch-eyebrow" style={{ marginBottom: 6 }}>
                  {row.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="ch-mono font-bold text-lg">{row.value}</span>
                  <DataTruthBadge level={row.truth} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--ch-line-subtle)", background: "var(--ch-surface-2)" }}>
            <span style={{ fontSize: 11, color: "var(--ch-text-3)" }}>
              Concentración por segmento — próximamente (sin datos ilustrativos).
            </span>
          </div>
        </div>
      </CHPanelState>
    </section>
  );
}
