"use client";

import { Select } from "@/components/forge";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { SEGMENT_DICTIONARY } from "@/lib/credit-hub/segment/segment-dictionary";
import { useDealerWizard } from "@/components/forge/credit-hub/dealer/DealerWizardProvider";

/**
 * Optional LATAM segment capture — additive fields for future segmented-report.
 * [NEEDS-HUMAN] when backend contract for segment payload is finalized.
 */
export function WizardSegmentPanel() {
  const { formData, updateField } = useDealerWizard();

  return (
    <div
      className="ch-card"
      style={{ padding: 16, marginTop: 20, border: "1px dashed var(--ch-line-2)" }}
      data-testid="wizard-segment-panel"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <h3 className="ch-serif" style={{ margin: 0, fontSize: 16 }}>
          Segmento LATAM (opcional)
        </h3>
        <DataTruthBadge level="ROADMAP" />
      </div>
      <p style={{ fontSize: 12, color: "var(--ch-text-3)", margin: "0 0 14px", lineHeight: 1.45 }}>
        Alimenta reportes segmentados cuando el backend publique segmented-report. No bloquea el envío.
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        <Select
          label="Zona de residencia"
          value={formData.segment_zone ?? ""}
          onChange={(e) => updateField("segment_zone", e.target.value)}
          options={[
            { value: "", label: "— Seleccionar —" },
            ...SEGMENT_DICTIONARY.zone.map((z) => ({ value: z.value, label: z.label })),
          ]}
        />
        <Select
          label="Tipo de vehículo (segmento)"
          value={formData.segment_vehicle_type ?? ""}
          onChange={(e) => updateField("segment_vehicle_type", e.target.value)}
          options={[
            { value: "", label: "— Seleccionar —" },
            ...SEGMENT_DICTIONARY.vehicle_type.map((v) => ({ value: v.value, label: v.label })),
          ]}
        />
      </div>
    </div>
  );
}
