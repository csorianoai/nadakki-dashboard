"use client";

import { useMemo, useState } from "react";
import type { BaseModel } from "@/lib/credit-hub/monetizacion/types";
import { INVOICE_MAY_2026 } from "@/lib/credit-hub/monetizacion/fixtures";
import { formatRd } from "@/lib/credit-hub/monetizacion/format";
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

export function MonetizacionSandboxClient() {
  const [bps, setBps] = useState(30);
  const [addAi, setAddAi] = useState(true);
  const [addSeats, setAddSeats] = useState(true);
  const [model, setModel] = useState<BaseModel>("B2");

  const whatIfConfig = useMemo(
    () => ({ base: model, bps, addAI: addAi, addSeats, addSetup: false }),
    [model, bps, addAi, addSeats],
  );

  return (
    <div className="fm-ui-sandbox-grid">
      <section className="fm-ui-sandbox-section">
        <h3>M3a · presentacionales</h3>
        <div className="fm-ui-sandbox-row">
          <AlertChip kind="MARGEN BAJO UMBRAL" text="Banco Atlántico · 9% < 15%" severity="bad" />
          <KpiCard label="GMV financiado" value="RD$ 78.5M" delta="+12.4%" sub="34 préstamos" onDrill={() => undefined} />
        </div>
        <RevenueBar label="Comisión" amount="RD$ 642,500" pct={41} color="green" />
        <EventTapeRow time="16:40" type="FUNDEADO" text="DEAL-7801" amount="+15,600" />
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
        <FunnelStep label="Solicitudes" value="1,240" conv="100%" />
        <StatCard label="Subastas activas" value="27" delta="+4" />
        <AuditRow type="PRÉSTAMO" id="DEAL-7801" detail="fundeado" hash="0x1c2f…a9" amount="RD$ 15,600.00" />
      </section>

      <section className="fm-ui-sandbox-section">
        <h3>M3b · controles + WhatIfPanel (live whatif)</h3>
        <div className="fm-ui-sandbox-row">
          <ModelCard code="B2 · Híbrido" name="Híbrido" desc="base + comisión" selected={model === "B2"} onSelect={() => setModel("B2")} flag="ANCLA" />
          <ModelCard code="B1" name="Comisión pura" desc="bps + mínimo" selected={model === "B1"} onSelect={() => setModel("B1")} />
        </div>
        <AddonToggle label="AI metered" desc="add-on IA" checked={addAi} onChange={setAddAi} />
        <AddonToggle label="Seats" desc="8 analistas" checked={addSeats} onChange={setAddSeats} />
        <BpsStepper value={bps} onChange={setBps} />
        <div className="fm-ui-sandbox-row">
          <CoreChip label="Credit / Forge" active onToggle={() => undefined} />
        </div>
        <WhatIfPanel config={whatIfConfig} />
        <VersionRow tariff="30 bps" range="desde 01 may 2026" current />
        <InvoiceLine
          label={INVOICE_MAY_2026.lines[0].label}
          count={INVOICE_MAY_2026.lines[0].count}
          note={INVOICE_MAY_2026.lines[0].note}
          amount={formatRd(INVOICE_MAY_2026.lines[0].amount)}
        />
        <InvoiceTotals
          subtotal={formatRd(INVOICE_MAY_2026.subtotal)}
          itbis={formatRd(INVOICE_MAY_2026.itbis)}
          total={formatRd(INVOICE_MAY_2026.total)}
        />
      </section>
    </div>
  );
}
