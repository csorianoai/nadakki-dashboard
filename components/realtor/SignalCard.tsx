import { RT } from "@/lib/realtor/tokens";
import type { RadarSignal } from "@/lib/realtor/types";
import { StatusBadge } from "./StatusBadge";

/** Fuente que aún no existe (DR-TRENDS, DR-ORIGEN): rótulo UNAVAILABLE, sin barras ni cifras. */
export function SignalCard({ signal }: { signal: RadarSignal }) {
  return (
    <article data-testid="signal-card" aria-label={signal.title}
      style={{ background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{signal.title}</h3>
        <StatusBadge status={signal.status} />
      </header>
      <p style={{ margin: "8px 0 0", fontSize: 13, color: RT.muted }}>Fuente: {signal.source}</p>
      <p style={{ margin: "6px 0 0", fontSize: 14 }}>{signal.note}</p>
    </article>
  );
}
