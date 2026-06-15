"use client";

import { CardHeader } from "../CardHeader";
import { CatChip, ConfChip, LevelChip } from "../Chips";
import { Donut, StackBar } from "../Charts";
import { ICN, Ic } from "../Icons";
import { findingKey } from "../../lib/snapshot-helpers";
import type { DrawerPick, Finding, SourcesSummary } from "../../lib/types";

interface SourcesSummaryProps {
  summary: SourcesSummary;
  findings: Finding[];
  onPick: (pick: DrawerPick) => void;
}

export function SourcesSummary({ summary, findings, onPick }: SourcesSummaryProps) {
  const levelSeg = [
    { label: "Nivel 1", value: summary.by_level["1"] || 0, color: "var(--mee-info)" },
    { label: "Nivel 2", value: summary.by_level["2"] || 0, color: "var(--mee-tier3)" },
    { label: "Nivel 3", value: summary.by_level["3"] || 0, color: "var(--mee-ink-4)" },
  ];
  const confDonut = [
    { label: "Alta", value: summary.by_confidence.alto || 0, color: "var(--mee-conf-alto)" },
    { label: "Media", value: summary.by_confidence.medio || 0, color: "var(--mee-conf-medio)" },
    { label: "Baja", value: summary.by_confidence.bajo || 0, color: "var(--mee-conf-bajo)" },
  ];

  return (
    <div
      className="fade"
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 14,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card">
          <CardHeader
            eyebrow="Calidad de evidencia"
            title="Confianza"
            sub={`${summary.total} fuentes totales`}
          />
          <div
            style={{
              padding: "16px 18px",
              display: "flex",
              gap: 18,
              alignItems: "center",
            }}
          >
            <Donut
              data={confDonut}
              size={132}
              thickness={18}
              centerValue={summary.total}
              centerLabel="fuentes"
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
              {confDonut.map((d, i) => (
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
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 2,
                        background: d.color,
                      }}
                    />
                    {d.label}
                  </span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <CardHeader eyebrow="Jerarquía" title="Nivel de fuente" />
          <div style={{ padding: "16px 18px" }}>
            <StackBar segments={levelSeg} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {levelSeg.map((d, i) => (
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
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 2,
                        background: d.color,
                      }}
                    />
                    {d.label}
                  </span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                background: "var(--mee-surface-2)",
                borderRadius: 6,
                fontSize: 11.5,
                color: "var(--mee-ink-3)",
                lineHeight: 1.5,
              }}
            >
              Nivel 1 = fuente oficial primaria (BCRD, SB). Nivel 3 = estimación interna, requiere
              validación.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <CardHeader
          eyebrow="Trazabilidad"
          title="Fuentes citadas"
          sub="Cada hallazgo enlaza a su fuente"
        />
        <table className="t">
          <thead>
            <tr>
              <th>Fuente</th>
              <th>Nivel</th>
              <th>Confianza</th>
              <th>Categoría</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f, index) => (
              <tr
                key={findingKey(f, index)}
                className="click"
                onClick={() => onPick({ type: "finding", data: f })}
              >
                <td style={{ maxWidth: 320 }}>
                  <span style={{ fontWeight: 500 }}>{f.source_name}</span>
                </td>
                <td>
                  <LevelChip level={f.source_level} />
                </td>
                <td>
                  <ConfChip value={f.confidence} />
                </td>
                <td>
                  <CatChip category={f.category} />
                </td>
                <td className="num">
                  <Ic d={ICN.external} s={13} style={{ color: "var(--mee-ink-4)" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
