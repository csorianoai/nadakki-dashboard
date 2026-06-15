"use client";

import { CardHeader } from "../CardHeader";
import { TIER_COLOR } from "../Chips";
import { ICN, Ic } from "../Icons";
import { EmptyState } from "../States";
import { fmtLocal } from "../../lib/formatters";
import type { DrawerPick, EntryStrategy } from "../../lib/types";

interface EntryStrategySectionProps {
  strategy: EntryStrategy | undefined;
  cur: string;
  onPick: (pick: DrawerPick) => void;
}

const SEG_LABEL: Record<string, string> = {
  vehiculos_usados: "Vehículos usados",
  vehiculos_nuevos: "Vehículos nuevos",
  comercial: "Flota comercial",
};

export function EntryStrategySection({ strategy, cur, onPick }: EntryStrategySectionProps) {
  if (!strategy) {
    return (
      <div className="card">
        <EmptyState
          icon={ICN.target}
          title="Estrategia de entrada en preparación"
          body="El agente strategist aún no ha generado la estrategia para este run."
        />
      </div>
    );
  }

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        className="card"
        style={{
          background: "var(--mee-accent-soft)",
          borderColor: "var(--mee-accent-line)",
        }}
      >
        <div
          style={{
            padding: "20px 22px",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 18,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "var(--mee-accent-mid)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ic d={ICN.target} s={22} w={1.8} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span className="eyebrow" style={{ color: "var(--mee-accent-strong)" }}>
                Segmento objetivo
              </span>
              <span className="chip amber" style={{ background: "#fff" }}>
                {SEG_LABEL[strategy.target_segment] || strategy.target_segment}
              </span>
            </div>
            <div
              className="serif"
              style={{
                fontSize: 21,
                color: "var(--mee-ink)",
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}
            >
              {strategy.angle}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <CardHeader
          eyebrow="Tesis comercial"
          title="Argumentos de venta"
          sub="Justificación cuantitativa de la oportunidad"
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
          {strategy.sales_arguments.map((a, i) => (
            <div
              key={i}
              style={{
                padding: "18px 20px",
                borderLeft: i ? "1px solid var(--mee-line)" : "none",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--mee-accent)",
                  marginBottom: 8,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--mee-ink-2)", lineHeight: 1.55 }}>
                {a}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
            padding: "0 2px",
          }}
        >
          <div className="eyebrow">Plan de abordaje por tier</div>
          <span style={{ fontSize: 11, color: "var(--mee-ink-3)" }}>
            Clic en una entidad para ver su ficha
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            alignItems: "start",
          }}
        >
          {strategy.institution_tiers.map((t, i) => (
            <div key={i} className="card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--mee-line)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderTop: `3px solid ${TIER_COLOR[t.tier] ?? "var(--mee-tier-other)"}`,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: TIER_COLOR[t.tier] ?? "var(--mee-tier-other)",
                  }}
                >
                  {t.tier.replace("Tier", "Tier ")}
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: "var(--mee-ink-3)", marginLeft: "auto" }}
                >
                  {t.names.length} entidades
                </span>
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  fontSize: 12.5,
                  color: "var(--mee-ink-2)",
                  lineHeight: 1.5,
                  borderBottom: "1px solid var(--mee-line)",
                  minHeight: 78,
                }}
              >
                {t.rationale}
              </div>
              <div>
                {t.names.map((n, j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() =>
                      onPick({
                        type: "institution",
                        data: {
                          name: n.name,
                          tier: n.tier ?? t.tier,
                          portfolio_rd: n.portfolio_rd,
                          participation_pct: n.participation_pct,
                          source: n.source,
                        },
                      })
                    }
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 8,
                      alignItems: "center",
                      padding: "11px 16px",
                      border: "none",
                      borderTop: j ? "1px solid var(--mee-line)" : "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--mee-surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {n.name}
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: 11, color: "var(--mee-ink-3)", marginTop: 2 }}
                      >
                        {fmtLocal(n.portfolio_rd, cur)} · {n.participation_pct}%
                      </div>
                    </div>
                    <Ic d={ICN.arrowR} s={14} style={{ color: "var(--mee-ink-4)" }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
