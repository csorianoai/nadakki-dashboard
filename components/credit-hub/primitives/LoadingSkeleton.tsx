"use client";

export function SkKpiStrip({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="kpi-strip-skeleton">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="ch-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="ch-sk" style={{ height: 10, width: "55%" }} />
          <div className="ch-sk" style={{ height: 26, width: "70%" }} />
          <div className="ch-sk" style={{ height: 8, width: "40%" }} />
        </div>
      ))}
    </div>
  );
}

export function SkTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="ch-card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 16, padding: "12px 14px", borderBottom: "1px solid var(--ch-line)" }}>
        {[40, 24, 18, 14].map((w, i) => (
          <div key={i} className="ch-sk" style={{ height: 9, width: `${w}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 16,
            padding: "13px 14px",
            borderBottom: i < rows - 1 ? "1px solid var(--ch-line)" : "none",
            alignItems: "center",
          }}
        >
          <div className="ch-sk" style={{ height: 12, width: "40%" }} />
          <div className="ch-sk" style={{ height: 12, width: "24%" }} />
          <div className="ch-sk" style={{ height: 12, width: "18%" }} />
          <div className="ch-sk" style={{ height: 20, width: 64, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

export function SkDetail() {
  return (
    <div className="ch-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div className="ch-sk" style={{ width: 48, height: 48, borderRadius: 999 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="ch-sk" style={{ height: 16, width: "45%" }} />
          <div className="ch-sk" style={{ height: 10, width: "30%" }} />
        </div>
      </div>
      <div className="ch-divider" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="ch-sk" style={{ height: 11, width: "30%" }} />
          <div className="ch-sk" style={{ height: 11, width: "18%" }} />
        </div>
      ))}
    </div>
  );
}

export function SkChart({ h = 180 }: { h?: number }) {
  return (
    <div className="ch-card" style={{ padding: 18 }}>
      <div className="ch-sk" style={{ height: 11, width: "35%", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: h }}>
        {[55, 72, 48, 88, 64, 95, 78].map((b, i) => (
          <div key={i} className="ch-sk" style={{ flex: 1, height: `${b}%`, borderRadius: "4px 4px 0 0" }} />
        ))}
      </div>
    </div>
  );
}

export const LoadingSkeleton = {
  KpiStrip: SkKpiStrip,
  Table: SkTable,
  Detail: SkDetail,
  Chart: SkChart,
};

export const KpiStripSkeleton = SkKpiStrip;
export const TableSkeleton = SkTable;
export const DetailSkeleton = SkDetail;
export const ChartSkeleton = SkChart;
