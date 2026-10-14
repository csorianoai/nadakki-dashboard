import { RT, FONT_DISPLAY } from "@/lib/realtor/tokens";
import type { OperationType, RadarSignal } from "@/lib/realtor/types";
import { StatusBadge } from "./StatusBadge";

const OP_LABEL: Record<OperationType, string> = { alquiler: "Alquiler", venta: "Venta" };
const BAR_AREA = 163;

function reading(signal: RadarSignal): { trend: "up" | "down" | "flat"; text: string } | null {
  const p = signal.points;
  if (p.length < 2) return null;
  const first = p[0], last = p[p.length - 1];
  const diff = last.value - first.value;
  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const sign = diff > 0 ? "+" : "";
  const verb = { up: "El interés relativo crece; conviene priorizar contenido en esta zona.", down: "El interés relativo baja; conviene revisar el mensaje antes de invertir más.", flat: "El interés relativo se mantiene estable." }[trend];
  return { trend, text: `${last.label} = ${last.value} frente a ${first.label} = ${first.value} (${sign}${diff} puntos). ${verb} Un índice de 100 es el máximo de la serie, no un número de personas.` };
}

/** Tarjeta de la señal activa (DL10A): título, tendencia, 8 barras, «Cómo leerlo» y ficha. Sin dato real no hay barras ni cifras. */
export function SignalDetail({ signal, operation }: { signal: RadarSignal; operation: OperationType }) {
  const read = reading(signal);
  const title = `${signal.title} · ${OP_LABEL[operation]}`;
  const chip = read && {
    up: { t: "Subiendo", bg: RT.chipUpBg, c: RT.chipUpText },
    down: { t: "Bajando", bg: RT.chipDownBg, c: RT.chipDownText },
    flat: { t: "Estable", bg: RT.page, c: RT.muted },
  }[read.trend];
  return (
    <article data-testid="signal-card" aria-label={title}
      style={{ background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: "22px 22px 18px" }}>
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>{title}</h2>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusBadge status={signal.status} />
          {chip ? <span data-testid="trend-chip" style={{ background: chip.bg, color: chip.c, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{chip.t}</span> : null}
        </span>
      </header>
      <p style={{ margin: "18px 0 0", fontSize: 14, color: RT.muted }}>{signal.note}</p>
      {signal.points.length > 0 ? (
        <ul data-testid="signal-bars" aria-label={`Gráfico: ${title} (${signal.unit})`}
          style={{ listStyle: "none", margin: "24px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10, alignItems: "end", borderBottom: `1px solid ${RT.line}` }}>
          {signal.points.map((p, i) => {
            const current = i === signal.points.length - 1;
            return (
              <li key={p.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: BAR_AREA + 24 }}>
                <span style={{ fontSize: 11, color: RT.muted, letterSpacing: 1, marginBottom: 4 }}>{p.value}</span>
                <span role="img" data-testid="signal-bar" data-current={current} aria-label={`${p.label}: ${p.value} ${signal.unit}`}
                  style={{ width: "100%", height: Math.max(2, Math.round((p.value / 100) * BAR_AREA)), background: current ? RT.teal : RT.barMuted, borderRadius: "4px 4px 0 0" }} />
              </li>
            );
          })}
        </ul>
      ) : null}
      {signal.points.length > 0 ? (
        <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10, marginTop: 14, fontSize: 11, color: RT.muted, textAlign: "center" }}>
          {signal.points.map((p) => (<span key={p.label}>{p.label}</span>))}
        </div>
      ) : null}
      {read ? (
        <div data-testid="como-leerlo" style={{ marginTop: 16, background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 8, padding: "14px 14px", fontSize: 14 }}>
          <strong>Cómo leerlo:</strong> {read.text}
        </div>
      ) : null}
      <dl data-testid="signal-ficha" style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "6px 24px", margin: "16px 0 0", fontSize: 14 }}>
        <dt style={{ fontWeight: 700 }}>Fuente</dt><dd style={{ margin: 0, color: RT.muted }}>{signal.source}</dd>
        <dt style={{ fontWeight: 700 }}>Período</dt><dd style={{ margin: 0, color: RT.muted }}>{signal.period ?? "—"}</dd>
        <dt style={{ fontWeight: 700 }}>Precisión</dt><dd style={{ margin: 0, color: RT.muted }}>{signal.precision ?? "—"}</dd>
      </dl>
    </article>
  );
}
