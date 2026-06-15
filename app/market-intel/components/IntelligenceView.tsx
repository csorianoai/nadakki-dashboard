"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/forge/ui/EmptyState";
import { FiltersBar } from "./FiltersBar";
import { ICN, Ic } from "./Icons";
import { KpiStat } from "./KpiStat";
import { RunDetailDrawer } from "./RunDetailDrawer";
import { RunsSidebar } from "./RunsSidebar";
import { EntryStrategySection } from "./sections/EntryStrategySection";
import { FindingsPanel } from "./sections/FindingsPanel";
import { MarketOverviewSection } from "./sections/MarketOverviewSection";
import { PricingProposalSection } from "./sections/PricingProposalSection";
import { SourcesSummary } from "./sections/SourcesSummary";
import { ValidationSection } from "./sections/ValidationSection";
import { fmtLocal, fmtUsd } from "../lib/formatters";
import {
  parseEntryStrategy,
  parsePricingProposal,
} from "../lib/snapshot-helpers";
import {
  COUNTRY_DISPLAY,
  MEE_TENANTS,
  getTenantByCountryIso,
} from "../lib/tenant-config";
import type {
  DrawerPick,
  MeeFilters,
  RunResponse,
  SnapshotPayload,
} from "../lib/types";

const TABS = [
  { k: "panorama", l: "Panorama", icon: ICN.globe },
  { k: "hallazgos", l: "Hallazgos", icon: ICN.search },
  { k: "estrategia", l: "Estrategia", icon: ICN.target },
  { k: "precios", l: "Precios", icon: ICN.dollar },
  { k: "fuentes", l: "Fuentes", icon: ICN.book },
  { k: "validacion", l: "Validación", icon: ICN.shieldCheck },
] as const;

type TabKey = (typeof TABS)[number]["k"];

interface IntelligenceViewProps {
  run: RunResponse;
  snapshot: SnapshotPayload | null;
  runs: RunResponse[];
  selectedRunId: string | null;
  onSelectRun: (id: string) => void;
  onCreateRun?: () => void;
  creating?: boolean;
  onStart?: () => void;
  starting?: boolean;
  onValidate: () => void;
  validating?: boolean;
  loadingSnapshot?: boolean;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "—";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} día${days > 1 ? "s" : ""}`;
}

export function IntelligenceView({
  run,
  snapshot,
  runs,
  selectedRunId,
  onSelectRun,
  onCreateRun,
  creating,
  onStart,
  starting,
  onValidate,
  validating,
  loadingSnapshot,
}: IntelligenceViewProps) {
  const [tab, setTab] = useState<TabKey>("panorama");
  const [tenantKey, setTenantKey] = useState(() => run.country_iso.toUpperCase());
  const [collapsed, setCollapsed] = useState(false);
  const [pick, setPick] = useState<DrawerPick | null>(null);
  const [filters, setFilters] = useState<MeeFilters>({
    segment: "all",
    confidence: "all",
    tier: "all",
  });

  const tenant =
    MEE_TENANTS[tenantKey] ?? getTenantByCountryIso(run.country_iso);
  const cur = tenant.cur;
  const fx = tenant.fx_to_usd;

  const mo = snapshot?.market_overview ?? {};
  const scale = MEE_TENANTS.DO.fx_to_usd / tenant.fx_to_usd;
  const localSize = Math.round((mo.market_size_local ?? 0) * scale);

  const entryStrategy = useMemo(
    () => parseEntryStrategy(snapshot?.entry_strategy),
    [snapshot?.entry_strategy]
  );
  const pricingProposal = useMemo(
    () =>
      snapshot?.pricing_proposal
        ? parsePricingProposal(snapshot.pricing_proposal)
        : undefined,
    [snapshot?.pricing_proposal]
  );

  const validationState =
    run.status === "validated" ? "validated" : snapshot?.validation_state ?? run.status;
  const isValidated = validationState === "validated" || run.status === "validated";

  const top4Share = useMemo(() => {
    const shares = mo.institution_shares ?? [];
    return shares.slice(0, 4).reduce((s, x) => s + x.participation_pct, 0);
  }, [mo.institution_shares]);

  const countryLabel = COUNTRY_DISPLAY[tenantKey] ?? COUNTRY_DISPLAY[run.country_iso.toUpperCase()] ?? run.country_iso;
  const onPick = (x: DrawerPick) => setPick(x);

  const showStartCta = run.status === "draft" && !snapshot && !loadingSnapshot;
  const showResearchingWait =
    run.status === "researching" && !snapshot && !loadingSnapshot;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        height: "100%",
        minHeight: 0,
      }}
    >
      <RunsSidebar
        runs={runs}
        activeId={selectedRunId}
        onPick={onSelectRun}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onCreate={onCreateRun}
        creating={creating}
      />

      <main style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        <header
          style={{
            borderBottom: "1px solid var(--mee-line)",
            background: "var(--mee-surface)",
            padding: "14px 24px 0",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ minWidth: 0, flex: "1 1 auto" }}>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--mee-ink-3)",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 8,
                }}
              >
                <span style={{ color: "var(--mee-accent)" }}>Credit Hub</span>
                <Ic d={ICN.chevR} s={11} />
                <span>Inteligencia de Mercado</span>
                <Ic d={ICN.chevR} s={11} />
                <span style={{ color: "var(--mee-ink-2)" }}>{run.id}</span>
              </div>
              <h1
                className="serif"
                style={{
                  margin: "0 0 8px",
                  fontSize: 26,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                {run.product} · {countryLabel}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {isValidated ? (
                  <span className="chip pos">
                    <Ic d={ICN.shieldCheck} s={12} />
                    Validado
                  </span>
                ) : (
                  <span className="chip warn">
                    <span className="dot" />
                    Pendiente de revisión
                  </span>
                )}
                <span className="chip">
                  <Ic d={ICN.globe} s={11} />
                  {run.vertical}
                </span>
                <span className="chip mono" style={{ color: "var(--mee-ink-3)" }}>
                  <Ic d={ICN.clock} s={11} />
                  Generado {formatRelativeTime(run.updated_at)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div className="seg" aria-label="Tenant / país">
                {Object.keys(MEE_TENANTS).map((k) => (
                  <button
                    key={k}
                    type="button"
                    data-on={tenantKey === k}
                    onClick={() => setTenantKey(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-sm">
                <Ic d={ICN.compare} s={14} />
                Comparar
              </button>
              <button type="button" className="btn btn-secondary btn-sm">
                <Ic d={ICN.download} s={14} />
                Exportar PDF
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onValidate();
                  setTab("validacion");
                }}
                disabled={isValidated || validating}
              >
                <Ic d={ICN.shieldCheck} s={14} />
                {isValidated ? "Validado" : validating ? "Validando…" : "Validar"}
              </button>
            </div>
          </div>

          {snapshot ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  marginTop: 14,
                  borderTop: "1px solid var(--mee-line)",
                }}
              >
                <div style={{ borderRight: "1px solid var(--mee-line)" }}>
                  <KpiStat
                    label="Tamaño · local"
                    value={fmtLocal(localSize, cur).replace(cur, "")}
                    unit={cur}
                    accent
                  />
                </div>
                <div style={{ borderRight: "1px solid var(--mee-line)" }}>
                  <KpiStat
                    label="Tamaño · USD"
                    value={fmtUsd(mo.market_size_usd).replace("US$", "")}
                    unit="US$"
                  />
                </div>
                <div style={{ borderRight: "1px solid var(--mee-line)" }}>
                  <KpiStat
                    label="Crecimiento"
                    value={`${mo.growth_rate_pct ?? "—"}`}
                    unit={mo.growth_rate_pct != null ? "%" : undefined}
                    delta={mo.growth_rate_pct != null ? 2.1 : undefined}
                    sub="vs. 2023"
                  />
                </div>
                <div style={{ borderRight: "1px solid var(--mee-line)" }}>
                  <KpiStat
                    label="Tasa activa prom."
                    value={`${mo.avg_interest_rate_pct ?? "—"}`}
                    unit={mo.avg_interest_rate_pct != null ? "%" : undefined}
                    sub="dispersión alta"
                  />
                </div>
                <div style={{ borderRight: "1px solid var(--mee-line)" }}>
                  <KpiStat
                    label="Morosidad"
                    value={`${mo.npl_ratio_pct ?? "—"}`}
                    unit={mo.npl_ratio_pct != null ? "%" : undefined}
                    sub="sistema · 2025"
                  />
                </div>
                <div>
                  <KpiStat
                    label="Jugadores"
                    value={mo.key_players?.length ?? 0}
                    sub={`top-4 = ${top4Share.toFixed(0)}%`}
                  />
                </div>
              </div>

              <nav style={{ display: "flex", gap: 2, marginTop: 6 }}>
                {TABS.map((t) => (
                  <button
                    key={t.k}
                    type="button"
                    onClick={() => setTab(t.k)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "11px 14px",
                      border: "none",
                      background: "transparent",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: tab === t.k ? 600 : 500,
                      color: tab === t.k ? "var(--mee-ink)" : "var(--mee-ink-3)",
                      borderBottom: "2px solid",
                      borderBottomColor:
                        tab === t.k ? "var(--mee-accent-mid)" : "transparent",
                      cursor: "pointer",
                      marginBottom: -1,
                    }}
                  >
                    <Ic d={t.icon} s={14} w={tab === t.k ? 2 : 1.6} />
                    {t.l}
                    {t.k === "hallazgos" ? (
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          padding: "1px 5px",
                          borderRadius: 999,
                          background: "var(--mee-surface-3)",
                          color: "var(--mee-ink-3)",
                        }}
                      >
                        {snapshot.findings.length}
                      </span>
                    ) : null}
                  </button>
                ))}
              </nav>
            </>
          ) : null}
        </header>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "16px 24px 40px" }}>
            {loadingSnapshot ? (
              <p style={{ fontSize: 13, color: "var(--mee-ink-3)" }}>Cargando snapshot…</p>
            ) : null}

            {showStartCta ? (
              <EmptyState
                title="Sin snapshot aún"
                description="Inicie la investigación para generar el snapshot de inteligencia de mercado."
                action={
                  onStart ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={onStart}
                      disabled={starting}
                    >
                      <Ic d={ICN.spark} s={14} />
                      {starting ? "Iniciando…" : "Iniciar investigación"}
                    </button>
                  ) : undefined
                }
              />
            ) : null}

            {showResearchingWait ? (
              <EmptyState
                title="Investigación en curso"
                description="El motor está recopilando fuentes. Actualice en unos momentos para ver el snapshot."
              />
            ) : null}

            {snapshot ? (
              <>
                {(tab === "hallazgos" || tab === "panorama" || tab === "estrategia") && (
                  <FiltersBar filters={filters} setFilters={setFilters} />
                )}
                {tab === "panorama" && (
                  <MarketOverviewSection
                    overview={mo}
                    cur={cur}
                    fx={fx}
                    onPick={onPick}
                    segment={filters.segment}
                  />
                )}
                {tab === "hallazgos" && (
                  <FindingsPanel
                    findings={snapshot.findings}
                    cur={cur}
                    onPick={onPick}
                    filters={filters}
                  />
                )}
                {tab === "estrategia" && (
                  <EntryStrategySection strategy={entryStrategy} cur={cur} onPick={onPick} />
                )}
                {tab === "precios" && (
                  <PricingProposalSection pricing={pricingProposal} cur={cur} />
                )}
                {tab === "fuentes" && (
                  <SourcesSummary
                    summary={snapshot.sources_summary}
                    findings={snapshot.findings}
                    onPick={onPick}
                  />
                )}
                {tab === "validacion" && (
                  <ValidationSection
                    snapshot={snapshot}
                    onValidate={onValidate}
                    validating={validating}
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>

      <RunDetailDrawer
        pick={pick}
        cur={cur}
        fx={fx}
        institutionShares={mo.institution_shares}
        onClose={() => setPick(null)}
      />
    </div>
  );
}
