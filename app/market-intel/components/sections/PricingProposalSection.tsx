"use client";

import { CardHeader } from "../CardHeader";
import { ICN, Ic } from "../Icons";
import { EmptyState } from "../States";
import type { PricingProposal } from "../../lib/types";

interface PricingProposalSectionProps {
  pricing: PricingProposal | undefined;
  cur: string;
}

export function PricingProposalSection({ pricing, cur }: PricingProposalSectionProps) {
  if (!pricing || !pricing.plans || !pricing.plans.length) {
    return (
      <div className="card">
        <EmptyState
          icon={ICN.dollar}
          title="Propuesta de precios en preparación"
          body="El agente de pricing aún no ha generado planes para este run. Vuelve a ejecutar el pipeline o configura una propuesta manual."
          action={
            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 6 }}>
              <Ic d={ICN.refresh} s={13} />
              Re-ejecutar pricing
            </button>
          }
        />
      </div>
    );
  }

  const c = pricing.currency === "USD" ? "US$" : cur;
  const fee = (n: number | undefined) =>
    n != null ? `${c}${n.toLocaleString("en-US")}` : "—";

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          alignItems: "start",
        }}
      >
        {pricing.plans.map((p, i) => {
          const featured = p.target ? /recomendado/i.test(p.target) : false;
          return (
            <div
              key={i}
              className="card"
              style={{
                overflow: "hidden",
                borderColor: featured ? "var(--mee-accent-mid)" : "var(--mee-line)",
                boxShadow: featured ? "var(--mee-sh-2)" : "none",
                position: "relative",
              }}
            >
              {featured ? (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "var(--mee-accent-mid)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: "0 var(--mee-r-lg) 0 8px",
                  }}
                >
                  Recomendado
                </div>
              ) : null}
              <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--mee-line)" }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
                {p.target ? (
                  <div style={{ fontSize: 11.5, color: "var(--mee-ink-3)", marginTop: 2 }}>
                    {p.target}
                  </div>
                ) : null}
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}
                  >
                    {fee(p.per_application_fee)}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--mee-ink-3)" }}>/ solicitud</span>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 12, color: "var(--mee-ink-3)", marginTop: 4 }}
                >
                  Setup {fee(p.setup_fee)}
                  {p.monthly_min ? ` · mín. ${fee(p.monthly_min)}/mes` : " · sin mínimo"}
                </div>
              </div>
              <div style={{ padding: "14px 20px 18px" }}>
                {(p.features ?? []).map((f, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      gap: 9,
                      alignItems: "flex-start",
                      padding: "5px 0",
                      fontSize: 12.5,
                      color: "var(--mee-ink-2)",
                    }}
                  >
                    <Ic
                      d={ICN.check}
                      s={14}
                      w={2.2}
                      style={{ color: "var(--mee-pos)", marginTop: 2 }}
                    />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {pricing.dealer_tiers && pricing.dealer_tiers.length > 0 ? (
        <div className="card">
          <CardHeader
            eyebrow="Descuentos por volumen"
            title="Tiers de concesionario"
            sub="Descuento sobre fee por solicitud según volumen mensual"
            actions={
              pricing.fx_to_usd ? (
                <span className="chip mono">
                  FX 1 US$ = {cur}
                  {pricing.fx_to_usd}
                </span>
              ) : undefined
            }
          />
          <table className="t">
            <thead>
              <tr>
                <th>Tier de concesionario</th>
                <th className="num">Solicitudes / mes (mín.)</th>
                <th className="num">Descuento</th>
                <th className="num">Fee efectivo · plan Pro</th>
              </tr>
            </thead>
            <tbody>
              {pricing.dealer_tiers.map((d, i) => {
                const pro =
                  pricing.plans?.find((p) => /pro/i.test(p.name)) ?? pricing.plans?.[0];
                const baseFee = pro?.per_application_fee ?? 0;
                const discount = d.discount_pct ?? 0;
                const eff = baseFee * (1 - discount / 100);
                return (
                  <tr key={i}>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: [
                              "var(--mee-tier3)",
                              "var(--mee-tier2)",
                              "var(--mee-tier1)",
                            ][i],
                          }}
                        />
                        {d.label ?? d.tier}
                      </span>
                    </td>
                    <td className="num">
                      {d.min_apps_month === 0 || d.min_apps_month == null
                        ? "—"
                        : `≥ ${d.min_apps_month}`}
                    </td>
                    <td className="num">
                      {discount === 0 ? "—" : `−${discount}%`}
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {c}
                      {eff.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
