"use client";

import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { useAuctionIntel } from "@/lib/credit-hub/hooks/useAuctionIntel";

export function AuctionIntel() {
  const query = useAuctionIntel();
  const data = query.data;
  const truth = data && !query.isError ? "REAL" : "DEMO";

  const winRate = data?.win_rate != null ? `${(data.win_rate * 100).toFixed(0)}` : "—";
  const lookToBook = data?.look_to_book != null ? `${data.look_to_book.toFixed(1)}` : "—";
  const tto = data?.avg_time_to_offer_hours != null ? `${data.avg_time_to_offer_hours}` : "—";
  const lost = data?.lost_deals_count ?? "—";

  const demoTrend = [2, 3, 4, 5, 6, 7];

  return (
    <section style={{ marginBottom: 26 }} data-testid="auction-intel-panel">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="ch-eyebrow">Inteligencia operativa</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Subasta — desempeño de tu institución
        </h2>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ch-text-3)" }}>
        Ofertas competidoras ocultas por diseño — solo métricas propias
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <DataTruthBadge level={truth} />
        {query.isError ? (
          <span style={{ fontSize: 11, color: "var(--ch-text-3)" }}>Endpoint no disponible</span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-3">
        <MetricCard
          label="Win rate"
          value={winRate}
          unit={data?.win_rate != null ? "%" : undefined}
          truth={truth}
          delta={data?.win_rate != null ? { direction: "up", label: "ofertas aceptadas" } : undefined}
          accent
          trendDemo={!data?.win_rate}
          trendColor="var(--ch-success)"
          trendValues={data?.win_rate != null ? [...demoTrend, Math.round(data.win_rate * 100)] : undefined}
        />
        <MetricCard
          label="Look-to-book"
          value={lookToBook}
          unit={data?.look_to_book != null ? "x" : undefined}
          truth={truth}
          delta={data?.look_to_book != null ? { direction: "up", label: "con oferta / total" } : undefined}
          trendDemo={!data?.look_to_book}
          trendColor="var(--ch-bank-accent, var(--ch-info))"
        />
        <MetricCard
          label="Tiempo a oferta"
          value={tto}
          unit={data?.avg_time_to_offer_hours != null ? "h" : undefined}
          truth={truth}
          delta={{ direction: "down", label: "meta ≤ 3 h" }}
          trendDemo={!data?.avg_time_to_offer_hours}
          trendColor="var(--ch-warning)"
        />
        <MetricCard
          label="Deals perdidos"
          value={lost}
          truth={truth}
          delta={typeof lost === "number" && lost > 0 ? { direction: "down", label: "sin detalle competidor" } : undefined}
          trendDemo={!data}
          trendColor="var(--ch-danger)"
        />
      </div>
      <div className="ch-card overflow-hidden">
        <div className="ch-card-h">
          <div className="ch-card-title">Deals perdidos — agregado</div>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <p style={{ fontSize: 12.5, color: "var(--ch-text-3)", margin: 0 }}>
            {data?.lost_deals_count
              ? `${data.lost_deals_count} solicitudes donde otra entidad fue elegida. No mostramos tasas ni nombres de competidores (aislamiento activo).`
              : "Sin deals perdidos registrados en el periodo."}
          </p>
        </div>
      </div>
    </section>
  );
}
