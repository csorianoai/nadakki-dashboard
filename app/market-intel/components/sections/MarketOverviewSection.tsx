"use client";

import { useMemo } from "react";
import { CardHeader } from "../CardHeader";
import { Donut, HBar, MarketTrend, type HBarDatum } from "../Charts";
import { TIER_COLOR } from "../Chips";
import { ICN, Ic } from "../Icons";
import { fmtLocal } from "../../lib/formatters";
import { filterInstitutionShares, scaleMarketSizeForSegment } from "../../lib/mee-filters";
import { deriveMarketTrend } from "../../lib/market-trend";
import type { DrawerPick, InstitutionShare, MarketOverview, MeeFilters } from "../../lib/types";

interface MarketOverviewSectionProps {
  overview: MarketOverview;
  cur: string;
  fx: number;
  onPick: (pick: DrawerPick) => void;
  filters: MeeFilters;
}

export function MarketOverviewSection({
  overview,
  cur,
  fx,
  onPick,
  filters,
}: MarketOverviewSectionProps) {
  const mo = overview;
  const shares = useMemo(
    () => filterInstitutionShares(mo.institution_shares ?? [], filters),
    [mo.institution_shares, filters]
  );
  const keyPlayers = mo.key_players ?? [];
  const visibleKeyPlayers = useMemo(() => {
    if (filters.tier === "all") return keyPlayers;
    const shareNames = shares.map((s) => s.name.toLowerCase());
    return keyPlayers.filter((p) => {
      const m = p.match(/^(.+?)\s*\(/);
      const name = (m ? m[1] : p).trim().toLowerCase();
      return shareNames.some(
        (sn) => sn.includes(name) || name.includes(sn.split(/\s+/)[0] ?? ""),
      );
    });
  }, [keyPlayers, shares, filters.tier]);
  const growthRate = mo.growth_rate_pct ?? 0;
  const marketSizeLocal = useMemo(
    () => scaleMarketSizeForSegment(mo.market_size_local ?? 0, filters.segment),
    [mo.market_size_local, filters.segment]
  );

  const trendData = useMemo(
    () => deriveMarketTrend(marketSizeLocal, growthRate),
    [marketSizeLocal, growthRate]
  );

  const barData = useMemo<HBarDatum[]>(
    () =>
      shares.map((s) => ({
        label: s.name,
        value: s.portfolio_rd,
        pct: s.participation_pct,
        color: TIER_COLOR[s.tier] ?? "var(--mee-tier-other)",
        raw: s,
      })),
    [shares]
  );

  const tierAgg = useMemo(() => {
    const t = { Tier1: 0, Tier2: 0, Tier3: 0 };
    shares.forEach((s) => {
      const key = s.tier as keyof typeof t;
      if (key in t) t[key] += s.participation_pct;
    });
    const covered = t.Tier1 + t.Tier2 + t.Tier3;
    return [
      { label: "Tier 1", value: t.Tier1, color: "var(--mee-tier1)" },
      { label: "Tier 2", value: t.Tier2, color: "var(--mee-tier2)" },
      { label: "Tier 3", value: t.Tier3, color: "var(--mee-tier3)" },
      {
        label: "Otros / fragmentado",
        value: +(100 - covered).toFixed(1),
        color: "var(--mee-tier-other)",
      },
    ];
  }, [shares]);

  const top4 = tierAgg[0].value + tierAgg[1].value;
  void fx;

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
        <div className="card">
          <CardHeader
            eyebrow="Tamaño y crecimiento"
            title="Mercado de crédito automotriz"
            sub="Cartera vigente del sistema · serie 2020–2024"
            actions={
              growthRate ? (
                <span className="chip pos">
                  <Ic d={ICN.trending} s={11} />+{growthRate}% CAGR
                </span>
              ) : undefined
            }
          />
          <div style={{ padding: "16px 18px" }}>
            <MarketTrend data={trendData} cur={cur} />
            <div
              style={{
                display: "flex",
                gap: 18,
                marginTop: 8,
                fontSize: 11,
                color: "var(--mee-ink-3)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 8,
                    background: "var(--mee-accent-line)",
                    borderRadius: 2,
                  }}
                />
                Cartera vigente
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{ width: 12, height: 2, background: "var(--mee-accent-strong)" }}
                />
                Crecimiento anual
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <CardHeader
            eyebrow="Estructura competitiva"
            title="Concentración por tier"
            sub={`Top-4 entidades = ${top4.toFixed(1)}% de la cartera`}
          />
          <div
            style={{
              padding: "16px 18px",
              display: "flex",
              gap: 20,
              alignItems: "center",
            }}
          >
            <Donut data={tierAgg} centerValue={`${top4.toFixed(0)}%`} centerLabel="Top 4" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
              {tierAgg.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "var(--mee-ink-2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 2,
                        background: t.color,
                        flexShrink: 0,
                      }}
                    />
                    {t.label}
                  </span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {t.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <CardHeader
          eyebrow="Participación de mercado"
          title="Cartera auto por entidad"
          sub="Clic en una institución para ver su ficha y fuentes"
          actions={
            <span className="chip">
              <Ic d={ICN.building} s={11} />
              {shares.length} entidades
            </span>
          }
        />
        <div style={{ padding: "8px 18px 14px" }}>
          <HBar
            data={barData}
            cur={cur}
            onPick={(d) =>
              onPick({ type: "institution", data: d.raw as InstitutionShare })
            }
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <CardHeader
            eyebrow="Entorno"
            title="Marco regulatorio"
            actions={
              <span className="chip info">
                <Ic d={ICN.scale} s={11} />
                SB · BCRD
              </span>
            }
          />
          <div
            style={{
              padding: "14px 18px",
              fontSize: 13,
              color: "var(--mee-ink-2)",
              lineHeight: 1.6,
            }}
          >
            {mo.regulatory_environment || "—"}
          </div>
        </div>

        <div className="card">
          <CardHeader
            eyebrow="Competidores"
            title="Jugadores clave"
            sub={`${visibleKeyPlayers.length} entidades identificadas`}
          />
          <div style={{ padding: "6px 0" }}>
            {visibleKeyPlayers.map((p, i) => {
              const m = p.match(/^(.+?)\s*\((.+)\)$/);
              const name = m ? m[1].trim() : p;
              const detail = m ? m[2] : "";
              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "20px 1fr",
                    gap: 10,
                    padding: "8px 18px",
                    borderTop: i ? "1px solid var(--mee-line)" : "none",
                    alignItems: "baseline",
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, color: "var(--mee-ink-4)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                    {detail ? (
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: "var(--mee-ink-3)", marginLeft: 8 }}
                      >
                        {detail}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
