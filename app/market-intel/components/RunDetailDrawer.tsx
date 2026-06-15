"use client";

import { useEffect } from "react";
import { CatChip, ConfChip, LevelChip, TIER_COLOR } from "./Chips";
import { ICN, Ic } from "./Icons";
import { fmtDataPoint, fmtLocal, fmtPlain, fmtUsd } from "../lib/formatters";
import { METRIC_LABELS } from "../lib/metric-labels";
import { findingKey } from "../lib/snapshot-helpers";
import type { DrawerPick, Finding, InstitutionShare } from "../lib/types";

interface RunDetailDrawerProps {
  pick: DrawerPick | null;
  cur: string;
  fx: number;
  institutionShares?: InstitutionShare[];
  onClose: () => void;
}

function DrawerHead({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--mee-line)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div className="eyebrow" style={{ marginBottom: 4 }}>
          {eyebrow}
        </div>
        <div className="serif" style={{ fontSize: 20, lineHeight: 1.25 }}>
          {title}
        </div>
      </div>
      <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
        <Ic d={ICN.x} s={16} />
      </button>
    </div>
  );
}

function InstitutionDetail({
  inst,
  cur,
  fx,
  institutionShares,
  onClose,
}: {
  inst: InstitutionShare & { tier?: string };
  cur: string;
  fx: number;
  institutionShares?: InstitutionShare[];
  onClose: () => void;
}) {
  const full =
    institutionShares?.find((s) => s.name === inst.name) ?? inst;

  const rows: Array<[string, string] | null> = [
    ["Tier", (full.tier || inst.tier || "—").replace("Tier", "Tier ")],
    ["Cartera auto vigente", fmtLocal(full.portfolio_rd, cur)],
    ["Participación de mercado", `${full.participation_pct}%`],
    full.units ? ["Unidades financiadas", fmtPlain(full.units)] : null,
    full.units
      ? [
          "Ticket promedio implícito",
          fmtLocal(Math.round(full.portfolio_rd / full.units), cur),
        ]
      : null,
  ];

  return (
    <>
      <DrawerHead eyebrow="Ficha de institución" title={inst.name} onClose={onClose} />
      <div
        style={{
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            className="chip"
            style={{
              color: TIER_COLOR[full.tier] ?? "var(--mee-ink-3)",
              borderColor: "currentColor",
            }}
          >
            <span className="dot" />
            {(full.tier || "").replace("Tier", "Tier ")}
          </span>
          <span className="chip amber">
            <Ic d={ICN.building} s={11} />
            Cartera auto
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "16px 18px",
              background: "var(--mee-surface-2)",
              borderRadius: 8,
            }}
          >
            <div className="eyebrow">Cartera auto vigente</div>
            <div
              className="mono"
              style={{
                fontSize: 30,
                fontWeight: 600,
                marginTop: 6,
                letterSpacing: "-0.02em",
              }}
            >
              {fmtLocal(full.portfolio_rd, cur)}
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--mee-ink-3)", marginTop: 2 }}>
              {fmtUsd(full.portfolio_rd / fx)} · {full.participation_pct}% del mercado
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: "6px 0" }}>
            {rows
              .filter((row): row is [string, string] => row !== null)
              .map(([k, v], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    borderTop: i ? "1px solid var(--mee-line)" : "none",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--mee-ink-3)" }}>{k}</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {v}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {full.source ? (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Fuente
            </div>
            <span
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--mee-accent)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                lineHeight: 1.5,
              }}
            >
              <Ic d={ICN.file} s={13} />
              {full.source}
              <Ic d={ICN.external} s={11} />
            </span>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-secondary btn-sm">
            <Ic d={ICN.target} s={13} />
            Marcar como objetivo
          </button>
          <button type="button" className="btn btn-ghost btn-sm">
            <Ic d={ICN.compare} s={13} />
            Comparar
          </button>
        </div>
      </div>
    </>
  );
}

function FindingDetail({
  finding: f,
  cur,
  onClose,
}: {
  finding: Finding;
  cur: string;
  onClose: () => void;
}) {
  const idLabel = f.id ? f.id.toUpperCase() : "HALLAZGO";

  return (
    <>
      <DrawerHead eyebrow={`Hallazgo · ${idLabel}`} title={f.source_name} onClose={onClose} />
      <div
        style={{
          padding: 20,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <CatChip category={f.category} />
          <LevelChip level={f.source_level} />
          <ConfChip value={f.confidence} />
          {f.requires_counsel_review ? (
            <span className="chip legal">
              <Ic d={ICN.scale} s={11} />
              Revisión legal
            </span>
          ) : null}
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--mee-ink)" }}>{f.summary}</div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Datos extraídos
          </div>
          <div className="card">
            {f.data_points.map((dp, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 16px",
                  borderTop: i ? "1px solid var(--mee-line)" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                    {METRIC_LABELS[dp.metric] || dp.metric}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 10.5, color: "var(--mee-ink-4)", marginTop: 1 }}
                  >
                    {dp.metric}
                    {dp.year != null ? ` · ${dp.year}` : ""}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 600 }}>
                  {fmtDataPoint(dp, cur)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
          <div
            style={{
              padding: "10px 12px",
              background: "var(--mee-surface-2)",
              borderRadius: 7,
            }}
          >
            <div className="eyebrow">Tier de origen</div>
            <div style={{ marginTop: 4, fontWeight: 500 }}>
              {f.tier === "auto_research" ? "Investigación automática" : "Estimación"}
            </div>
          </div>
          <div
            style={{
              padding: "10px 12px",
              background: "var(--mee-surface-2)",
              borderRadius: 7,
            }}
          >
            <div className="eyebrow">Estado</div>
            <div style={{ marginTop: 4, fontWeight: 500 }}>
              {f.validation_status === "pending" ? "Pendiente" : f.validation_status}
            </div>
          </div>
        </div>

        {f.requires_counsel_review ? (
          <div
            style={{
              display: "flex",
              gap: 9,
              padding: "12px 14px",
              background: "var(--mee-legal-soft)",
              borderRadius: 8,
              fontSize: 12.5,
              color: "var(--mee-legal)",
              lineHeight: 1.5,
            }}
          >
            <Ic d={ICN.scale} s={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>
              Este hallazgo toca materia regulatoria o legal y debe pasar por revisión de
              cumplimiento antes de usarse en material comercial.
            </span>
          </div>
        ) : null}

        <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>
          <Ic d={ICN.external} s={13} />
          Abrir documento fuente
        </button>
      </div>
    </>
  );
}

export function RunDetailDrawer({
  pick,
  cur,
  fx,
  institutionShares,
  onClose,
}: RunDetailDrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = Boolean(pick);

  return (
    <>
      {open ? (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,25,23,0.28)",
            zIndex: 40,
          }}
        />
      ) : null}
      {open && pick ? (
        <aside
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: 460,
            maxWidth: "92vw",
            background: "var(--mee-surface)",
            borderLeft: "1px solid var(--mee-line)",
            boxShadow: "var(--mee-sh-drawer)",
            zIndex: 41,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {pick.type === "institution" ? (
            <InstitutionDetail
              inst={pick.data}
              cur={cur}
              fx={fx}
              institutionShares={institutionShares}
              onClose={onClose}
            />
          ) : (
            <FindingDetail finding={pick.data} cur={cur} onClose={onClose} />
          )}
        </aside>
      ) : null}
    </>
  );
}
