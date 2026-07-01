"use client";

import { useState } from "react";
import {
  AddonToggle,
  AlertChip,
  AuditRow,
  BpsStepper,
  CoreChip,
  EventTapeRow,
  FunnelStep,
  InvoiceLine,
  InvoiceTotals,
  KpiCard,
  ModelCard,
  RevenueBar,
  StatCard,
  TenantRow,
  VersionRow,
  WhatIfPanel,
} from "@/components/credit-hub/monetizacion/ui";
import "@/components/credit-hub/monetizacion/ui/components.css";

export function MonetizacionSandboxClient() {
  const [bps, setBps] = useState(30);
  const [addAi, setAddAi] = useState(true);
  const [model, setModel] = useState<"B1" | "B2">("B2");
  const [coreCredit, setCoreCredit] = useState(true);

  return (
    <div className="fm-ui-sandbox-grid">
      <section className="fm-ui-sandbox-section">
        <h3>AlertChip · KpiCard</h3>
        <div className="fm-ui-sandbox-row">
          <AlertChip
            kind="MARGEN BAJO UMBRAL"
            text="Banco Atlántico · margen efectivo 9% < 15%"
            severity="bad"
          />
          <KpiCard
            label="GMV financiado"
            value="RD$ 78.5M"
            delta="+12.4%"
            sub="34 préstamos fundeados"
            onDrill={() => undefined}
          />
        </div>
      </section>

      <section className="fm-ui-sandbox-section">
        <h3>RevenueBar · EventTapeRow</h3>
        <RevenueBar label="Comisión (success fee)" amount="RD$ 642,500" pct={41} color="green" />
        <EventTapeRow time="16:40" type="FUNDEADO" text="DEAL-7801 · Banco del Cibao" amount="+15,600" />
      </section>

      <section className="fm-ui-sandbox-section">
        <h3>TenantRow · MarginBadge</h3>
        <TenantRow
          name="Banco del Cibao"
          initials="BC"
          accent="green"
          kind="Banco"
          model="Híbrido"
          gmv="78.5M"
          revenue="391,900"
          cost="152,800"
          margin="61%"
          status="ok"
        />
      </section>

      <section className="fm-ui-sandbox-section">
        <h3>Config controls</h3>
        <div className="fm-ui-sandbox-row">
          <ModelCard
            code="B2 · Híbrido"
            name="Híbrido"
            desc="base mensual + comisión reducida"
            selected={model === "B2"}
            onSelect={() => setModel("B2")}
            flag="ANCLA"
          />
          <ModelCard
            code="B1 · Comisión pura"
            name="Comisión pura"
            desc="bps sobre principal"
            selected={model === "B1"}
            onSelect={() => setModel("B1")}
            accent="green"
          />
        </div>
        <AddonToggle label="AI metered (add-on)" desc="por decisión / documento / token" checked={addAi} onChange={setAddAi} />
        <BpsStepper value={bps} onChange={setBps} />
        <div className="fm-ui-sandbox-row" style={{ marginTop: 10 }}>
          <CoreChip label="Credit / Forge" active={coreCredit} onToggle={() => setCoreCredit((v) => !v)} />
          <CoreChip label="Legal" active onToggle={() => undefined} />
        </div>
      </section>

      <section className="fm-ui-sandbox-section">
        <h3>WhatIfPanel · VersionRow · Invoice</h3>
        <WhatIfPanel
          period="mayo 2026"
          total="RD$ 462,442.00"
          subtotal="RD$ 391,900.00"
          lines={[
            { label: "Base mensual (suscripción)", amount: "RD$ 85,000.00" },
            { label: "Comisión reducida · 30 bps", amount: "RD$ 235,500.00" },
          ]}
          delta="RD$ 0.00"
          deltaPositive
        />
        <VersionRow tariff="30 bps" range="vigente desde 01 may 2026" current />
        <InvoiceLine
          label="Comisión sobre préstamos fundeados"
          count={34}
          note="30 bps · principal RD$ 78,500,000.00"
          amount="RD$ 235,500.00"
        />
        <InvoiceTotals subtotal="RD$ 391,900.00" itbis="RD$ 70,542.00" total="RD$ 462,442.00" />
      </section>

      <section className="fm-ui-sandbox-section">
        <h3>FunnelStep · StatCard · AuditRow</h3>
        <FunnelStep label="Solicitudes recibidas" value="1,240" conv="100%" />
        <StatCard label="Subastas activas" value="27" delta="+4" />
        <AuditRow
          type="PRÉSTAMO"
          id="DEAL-7801"
          detail="fundeado 05 may 16:40"
          hash="0x1c2f…a9"
          amount="RD$ 15,600.00"
        />
      </section>
    </div>
  );
}
