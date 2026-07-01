"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { BaseModel, BillingConfig } from "@/lib/credit-hub/monetizacion/types";
import { DEMO_TENANTS, useMonetizacionShell } from "@/components/credit-hub/monetizacion/shell";
import {
  AddonToggle,
  BpsStepper,
  CoreChip,
  ModelCard,
  VersionRow,
  WhatIfPanel,
} from "@/components/credit-hub/monetizacion/ui";
import "./config-screen.css";

const BASE_MODELS: {
  id: BaseModel;
  code: string;
  name: string;
  desc: string;
  accent?: "green" | "blue" | "violet";
  flag?: string;
  defaultBps?: number;
}[] = [
  { id: "B1", code: "B1 · Comisión pura", name: "Comisión pura", desc: "bps sobre principal o flat por fundeado · con mínimo garantizado", defaultBps: 50 },
  { id: "B2", code: "B2 · Híbrido", name: "Híbrido", desc: "base mensual + comisión reducida por fundeado", flag: "ANCLA", defaultBps: 30 },
  { id: "B3", code: "B3 · Por volumen", name: "Por volumen aprobado", desc: "bandas de monto desembolsado · tarifa marginal decreciente", accent: "blue" },
  { id: "B4", code: "B4 · Ilimitado", name: "Ilimitado", desc: "flat mensual · todo incluido · SLA dedicado", accent: "violet" },
];

const DEALER_PLANS = [
  {
    name: "Start",
    price: "RD$ 4,900",
    period: "/mes · o pay-as-you-go",
    features: ["120 solicitudes incluidas", "Overage RD$ 95/solicitud", "1 seat", "Scoring básico"],
  },
  {
    name: "Pro",
    price: "RD$ 18,000",
    period: "/mes",
    anchor: true,
    features: ["600 solicitudes incluidas", "SIC + IA completa", "Multi-seat (hasta 6)", "Overage RD$ 48/solicitud"],
  },
  {
    name: "Scale",
    price: "RD$ 52,000",
    period: "/mes · o bandas RD$",
    features: ["Solicitudes ilimitadas", "Todos los cores + API", "Soporte dedicado", "Bandas por volumen RD$"],
  },
];

function buildRateRows(base: BaseModel, addSetup: boolean, addAi: boolean, addSeats: boolean) {
  const rows: { label: string; note: string; value: string }[] = [];
  if (base === "B1") rows.push({ label: "Mínimo mensual garantizado", note: "piso", value: "RD$ 150,000" });
  if (base === "B2") rows.push({ label: "Base mensual", note: "suscripción híbrido", value: "RD$ 85,000" });
  if (base === "B3") {
    rows.push({ label: "Bandas de volumen", note: "≤25M:40bps · 25–75M:28bps · >75M:18bps", value: "marginal" });
  }
  if (base === "B4") rows.push({ label: "Flat mensual", note: "todo incluido · SLA dedicado", value: "RD$ 380,000" });
  if (addSetup) rows.push({ label: "Setup inicial (B5)", note: "fee one-time, se apila", value: "RD$ 25,000" });
  if (addAi) rows.push({ label: "AI metered", note: "decisión RD$2.50 · doc RD$6.00 · token passthrough", value: "variable" });
  if (addSeats) rows.push({ label: "Seat", note: "por analista activo/mes", value: "RD$ 1,500" });
  return rows;
}

type Props = {
  initialConfig: BillingConfig;
};

export function MonetizacionConfigClient({ initialConfig }: Props) {
  const { tenantId } = useMonetizacionShell();
  const tenant = DEMO_TENANTS.find((t) => t.id === tenantId) ?? DEMO_TENANTS[0];

  const [tab, setTab] = useState<"banco" | "dealer">("banco");
  const [baseModel, setBaseModel] = useState<BaseModel>(initialConfig.base_model);
  const [bps, setBps] = useState(initialConfig.bps);
  const [addSetup, setAddSetup] = useState(initialConfig.add_setup);
  const [addAi, setAddAi] = useState(initialConfig.add_ai);
  const [addSeats, setAddSeats] = useState(initialConfig.add_seats);
  const [cores, setCores] = useState(initialConfig.cores);

  const rateRows = useMemo(
    () => buildRateRows(baseModel, addSetup, addAi, addSeats),
    [baseModel, addSetup, addAi, addSeats],
  );

  const whatIfConfig = useMemo(
    () => ({
      base: baseModel,
      bps,
      addSetup,
      addAI: addAi,
      addSeats,
      principal: 78_500_000,
    }),
    [baseModel, bps, addSetup, addAi, addSeats],
  );

  const selectModel = (id: BaseModel, defaultBps?: number) => {
    setBaseModel(id);
    if (defaultBps) setBps(defaultBps);
  };

  const showBps = baseModel === "B1" || baseModel === "B2";

  return (
    <div>
      <header className="fm-config-header">
        <div>
          <h1 className="fm-config-title">Configuración de cobro · {tenant.label}</h1>
          <p className="fm-config-lead">
            Captura todo siempre, factura sobre un subconjunto. Cambiar el modelo no recopila datos nuevos — re-mide los ya capturados.
          </p>
        </div>
        <div className="fm-config-tabs" role="tablist" aria-label="Tipo de configuración">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "banco"}
            className={`fm-config-tab${tab === "banco" ? " fm-config-tab--active" : ""}`}
            onClick={() => setTab("banco")}
          >
            Modelos de banco
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "dealer"}
            className={`fm-config-tab${tab === "dealer" ? " fm-config-tab--active" : ""}`}
            onClick={() => setTab("dealer")}
          >
            Planes de dealer
          </button>
        </div>
      </header>

      {tab === "banco" ? (
        <div className="fm-config-grid">
          <div>
            <p className="fm-config-section-label">Modelo base · elige uno</p>
            <div className="fm-config-model-grid">
              {BASE_MODELS.map((model) => (
                <ModelCard
                  key={model.id}
                  code={model.code}
                  name={model.name}
                  desc={model.desc}
                  accent={model.accent ?? "green"}
                  flag={model.flag}
                  selected={baseModel === model.id}
                  onSelect={() => selectModel(model.id, model.defaultBps)}
                />
              ))}
            </div>

            <p className="fm-config-section-label">Complementos · se apilan sobre el base</p>
            <AddonToggle label="Setup + mensualidad (B5)" desc="fee inicial one-time, se apila" checked={addSetup} onChange={setAddSetup} />
            <AddonToggle label="AI metered (add-on)" desc="por decisión / documento / token" checked={addAi} onChange={setAddAi} />

            <section className="fm-ui-card" style={{ marginTop: 16 }}>
              <p className="fm-config-section-label">Tarifas · {BASE_MODELS.find((m) => m.id === baseModel)?.name}</p>
              {showBps ? (
                <div style={{ marginBottom: 12 }}>
                  <BpsStepper value={bps} onChange={setBps} />
                </div>
              ) : null}
              {rateRows.map((row) => (
                <div key={row.label} className="fm-config-rate-row">
                  <span>
                    {row.label}
                    <div className="fm-config-rate-note">{row.note}</div>
                  </span>
                  <span className="fm-config-rate-value">{row.value}</span>
                </div>
              ))}
              <p className="fm-config-section-label" style={{ marginTop: 14 }}>
                Cores incluidos en la factura
              </p>
              <div className="fm-config-cores">
                {Object.keys(cores).map((core) => (
                  <CoreChip
                    key={core}
                    label={core}
                    active={cores[core]}
                    onToggle={() => setCores((prev) => ({ ...prev, [core]: !prev[core] }))}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="fm-config-stack">
            <WhatIfPanel
              config={whatIfConfig}
              onApply={() => toast.success("Modelo aplicado con vigencia 01 jun 2026 · histórico preservado")}
            />
            <section className="fm-ui-card">
              <div className="fm-config-version-head">
                <h3 className="fm-config-card-title">Vigencia y versionado</h3>
                <span className="fm-config-version-chip">desde 01 jun 2026</span>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "var(--fm-sub)" }}>
                Cambiar una tarifa no reescribe el histórico: crea una versión nueva.
              </p>
              {initialConfig.versions.map((v) => (
                <VersionRow key={v.tariff} tariff={v.tariff} range={v.range} current={v.current} />
              ))}
            </section>
            <section className="fm-ui-card fm-config-contract">
              <span className="fm-config-contract-icon" aria-hidden>
                📄
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--fm-font-display)", fontSize: 14, color: "var(--fm-ink)" }}>
                  Contrato {initialConfig.contract.id}
                </div>
                <div style={{ fontSize: 12, color: "var(--fm-sub)", marginTop: 4 }}>
                  Responsable · {initialConfig.contract.owner} · firmado {initialConfig.contract.signed_at}
                </div>
              </div>
              <button
                type="button"
                className="fm-drawer-event-link"
                onClick={() => toast.info("Abriendo contrato CT-2026-0142")}
              >
                abrir →
              </button>
            </section>
          </div>
        </div>
      ) : (
        <div className="fm-config-dealer-grid">
          {DEALER_PLANS.map((plan) => (
            <section
              key={plan.name}
              className={`fm-ui-card fm-config-dealer-card${plan.anchor ? " fm-config-dealer-card--anchor" : ""}`}
            >
              <div style={{ fontFamily: "var(--fm-font-display)", fontSize: 15, fontWeight: 600 }}>{plan.name}</div>
              <div className="fm-config-dealer-price">
                {plan.price}
                <span style={{ fontSize: 12, color: "var(--fm-sub)", fontWeight: 500 }}> {plan.period}</span>
              </div>
              {plan.features.map((f) => (
                <div key={f} className="fm-config-dealer-feature">
                  ✓ {f}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
