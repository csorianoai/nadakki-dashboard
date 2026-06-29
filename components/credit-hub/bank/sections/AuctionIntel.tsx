"use client";

import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { useAuctionIntel } from "@/lib/credit-hub/hooks/useAuctionIntel";

export function AuctionIntel() {
  const query = useAuctionIntel();
  const data = query.data;
  const truth = data && !query.isError ? "REAL" : "DEMO";

  const winRate = data?.win_rate != null ? `${(data.win_rate * 100).toFixed(0)}%` : "—";
  const lookToBook = data?.look_to_book != null ? `${data.look_to_book.toFixed(1)}x` : "—";
  const tto = data?.avg_time_to_offer_hours != null ? `${data.avg_time_to_offer_hours}h` : "—";
  const lost = data?.lost_deals_count ?? "—";

  return (
    <div style={{ marginBottom: 26 }} data-testid="auction-intel-panel">
      <SectionHeader
        eyebrow="Inteligencia operativa"
        title="Subasta — desempeño de tu institución"
        sub="Ofertas competidoras ocultas por diseño — solo métricas propias"
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <DataTruthBadge level={truth} />
        {query.isError ? (
          <span style={{ fontSize: 11, color: "var(--ch-text-3)" }}>Endpoint no disponible</span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-3">
        <MetricCard label="Win rate" value={winRate} truth={truth} footnote="Ofertas aceptadas / decididas" />
        <MetricCard label="Look-to-book" value={lookToBook} truth={truth} footnote="Solicitudes con oferta / total" />
        <MetricCard label="Tiempo a oferta" value={tto} truth={truth} footnote="Meta ≤ 3 h" />
        <MetricCard label="Deals perdidos" value={lost} truth={truth} footnote="Sin detalle de competidor" />
      </div>
      <div className="ch-card p-4">
        <div className="ch-card-title">Deals perdidos — agregado</div>
        <p style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 6 }}>
          {data?.lost_deals_count
            ? `${data.lost_deals_count} solicitudes donde otra entidad fue elegida. No mostramos tasas ni nombres de competidores (aislamiento activo).`
            : "Sin deals perdidos registrados en el periodo."}
        </p>
      </div>
    </div>
  );
}
