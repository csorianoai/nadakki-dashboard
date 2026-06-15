"use client";

import { CardHeader } from "../CardHeader";
import { ICN, Ic } from "../Icons";
import { getPipelineFromSnapshot } from "../../lib/snapshot-helpers";
import type { SnapshotPayload } from "../../lib/types";

interface ValidationSectionProps {
  snapshot: SnapshotPayload;
  onValidate: () => void;
  validating?: boolean;
}

export function ValidationSection({ snapshot, onValidate, validating }: ValidationSectionProps) {
  const findings = snapshot.findings;
  const counsel = findings.filter((f) => f.requires_counsel_review);
  const lowConf = findings.filter((f) => f.confidence === "bajo");
  const pipeline = getPipelineFromSnapshot(snapshot);
  const pipelineDetail =
    pipeline.length > 0
      ? pipeline.map((p) => p.label).join(" · ")
      : "Pipeline no disponible en metadata";

  const checks = [
    {
      ok: pipeline.length > 0,
      label: "Pipeline de agentes completado sin errores",
      detail: pipelineDetail,
    },
    {
      ok: counsel.length === 0,
      label: "Revisión legal de hallazgos sensibles",
      detail: counsel.length
        ? `${counsel.length} hallazgos requieren revisión de cumplimiento legal`
        : "Sin hallazgos que requieran revisión legal",
    },
    {
      ok: lowConf.length === 0,
      label: "Sin hallazgos de confianza baja sin validar",
      detail: lowConf.length
        ? `${lowConf.length} hallazgo de fuente nivel 3 (estimado) por confirmar`
        : "Todos los hallazgos en confianza media o alta",
    },
    {
      ok: true,
      label: "Fuentes primarias citadas y trazables",
      detail: `${snapshot.sources_summary.by_level["1"] ?? 0} de ${snapshot.sources_summary.total} fuentes son nivel 1 (oficiales)`,
    },
  ];
  const pending = checks.filter((c) => !c.ok).length;

  return (
    <div
      className="fade"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 14,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card">
          <CardHeader
            eyebrow="Estado de validación"
            title="Lista de verificación previa a aprobación"
            sub={
              pending
                ? `${pending} ítem(s) requieren atención`
                : "Todos los controles superados"
            }
          />
          <div>
            {checks.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "24px 1fr",
                  gap: 12,
                  padding: "14px 18px",
                  borderTop: i ? "1px solid var(--mee-line)" : "none",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    marginTop: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: c.ok ? "var(--mee-pos-soft)" : "var(--mee-warn-soft)",
                    color: c.ok ? "var(--mee-pos)" : "var(--mee-warn)",
                  }}
                >
                  <Ic d={c.ok ? ICN.check : ICN.alert} s={12} w={2.4} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: "var(--mee-ink-3)", marginTop: 2 }}>
                    {c.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {pipeline.length > 0 ? (
          <div className="card">
            <CardHeader
              eyebrow="Procedencia"
              title="Pipeline de agentes"
              sub="Trazabilidad de la generación del reporte"
            />
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${pipeline.length}, 1fr)` }}>
              {pipeline.map((p, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 18px",
                    borderLeft: i ? "1px solid var(--mee-line)" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: "var(--mee-surface-2)",
                        color: "var(--mee-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ic d={ICN.bot} s={14} />
                    </div>
                    <Ic
                      d={ICN.check}
                      s={14}
                      w={2.4}
                      style={{ color: "var(--mee-pos)", marginLeft: "auto" }}
                    />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.label}</div>
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: "var(--mee-ink-3)", marginTop: 3 }}
                  >
                    {p.duration_s}s
                    {p.sources ? ` · ${p.sources} fuentes` : ""}
                    {p.findings ? ` · ${p.findings} hallazgos` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="card" style={{ position: "sticky", top: 0 }}>
        <div style={{ padding: 18 }}>
          <div className="eyebrow">Decisión humana</div>
          <div className="serif" style={{ fontSize: 19, marginTop: 8, lineHeight: 1.3 }}>
            Este reporte está pendiente de revisión.
          </div>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--mee-ink-3)",
              lineHeight: 1.55,
              marginTop: 8,
            }}
          >
            Al validar, el reporte queda inmutable y disponible para exportación a PDF y para el
            comité de crédito. La acción queda registrada en auditoría con tu usuario y marca de
            tiempo.
          </p>
          {pending > 0 ? (
            <div
              style={{
                display: "flex",
                gap: 9,
                padding: "11px 13px",
                background: "var(--mee-warn-soft)",
                borderRadius: 7,
                marginTop: 14,
                fontSize: 12,
                color: "var(--mee-warn)",
                lineHeight: 1.45,
              }}
            >
              <Ic d={ICN.alert} s={15} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>
                {pending} ítem(s) abiertos. Puedes validar igual dejando una nota, o resolver antes.
              </span>
            </div>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 14, height: 38 }}
            onClick={onValidate}
            disabled={validating}
          >
            <Ic d={ICN.shieldCheck} s={15} />
            {validating ? "Validando…" : "Validar reporte"}
          </button>
          <button type="button" className="btn btn-secondary" style={{ width: "100%", marginTop: 8 }}>
            <Ic d={ICN.download} s={14} />
            Exportar borrador PDF
          </button>
          <button type="button" className="btn btn-ghost" style={{ width: "100%", marginTop: 4 }}>
            Devolver al pipeline
          </button>
        </div>
      </div>
    </div>
  );
}
