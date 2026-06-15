"use client";

import { useMemo } from "react";
import { CatChip, ConfChip, LevelChip } from "../Chips";
import { ICN, Ic } from "../Icons";
import { EmptyState } from "../States";
import { fmtDataPoint } from "../../lib/formatters";
import { METRIC_LABELS } from "../../lib/metric-labels";
import { findingKey } from "../../lib/snapshot-helpers";
import type { DrawerPick, Finding, MeeFilters } from "../../lib/types";

interface FindingsPanelProps {
  findings: Finding[];
  cur: string;
  onPick: (pick: DrawerPick) => void;
  filters: MeeFilters;
}

export function FindingsPanel({ findings, cur, onPick, filters }: FindingsPanelProps) {
  const list = useMemo(
    () =>
      findings.filter((f) => {
        if (filters.confidence !== "all" && f.confidence !== filters.confidence) return false;
        return true;
      }),
    [findings, filters]
  );

  if (!list.length) {
    return (
      <div className="card">
        <EmptyState
          icon={ICN.search}
          title="Ningún hallazgo coincide con los filtros"
          body="Ajusta la confianza o el segmento para ver hallazgos del pipeline de investigación."
        />
      </div>
    );
  }

  return (
    <div
      className="fade"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
        alignItems: "start",
      }}
    >
      {list.map((f, index) => (
        <div
          key={findingKey(f, index)}
          className="card"
          style={{
            cursor: "pointer",
            transition: "box-shadow 150ms ease, border-color 150ms ease",
          }}
          onClick={() => onPick({ type: "finding", data: f })}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "var(--mee-sh-2)";
            e.currentTarget.style.borderColor = "var(--mee-line-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "var(--mee-line)";
          }}
        >
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mee-line)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
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
            <div style={{ fontSize: 13.5, color: "var(--mee-ink)", lineHeight: 1.55 }}>
              {f.summary}
            </div>
          </div>
          <div style={{ padding: "12px 18px" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Datos · {f.data_points.length}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px" }}>
              {f.data_points.map((dp, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--mee-ink-3)" }}>
                    {METRIC_LABELS[dp.metric] || dp.metric}
                  </span>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 600 }}>
                    {fmtDataPoint(dp, cur)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              padding: "10px 18px",
              background: "var(--mee-surface-2)",
              borderTop: "1px solid var(--mee-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "0 0 var(--mee-r-lg) var(--mee-r-lg)",
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--mee-ink-3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
              }}
            >
              <Ic d={ICN.file} s={12} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.source_name}
              </span>
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--mee-accent)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Ficha
              <Ic d={ICN.arrowR} s={11} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
