"use client";

import { useMemo, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import { patchApplicationFields } from "@/lib/credit-hub/api/operationalClient";
import {
  APPLICATION_FIELD_LABELS,
  buildFieldsPatch,
  extractEditFormFromRaw,
  isApplicationEditable,
  type ApplicationEditFormValues,
} from "@/lib/credit-hub/operational/application-edit";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

const LOCKED_HINT = "No modificable después de creada";

function Field({
  label,
  value,
  locked,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  locked?: boolean;
  editing: boolean;
  onChange?: (v: string) => void;
}) {
  if (editing && !locked) {
    return (
      <div>
        <label className="ch-eyebrow">{label}</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--ch-border)", background: "var(--ch-surface)" }}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  }
  return (
    <div title={locked ? LOCKED_HINT : undefined}>
      <dt className="ch-eyebrow">{label}</dt>
      <dd style={{ opacity: locked && editing ? 0.55 : 1 }}>{value || "—"}</dd>
    </div>
  );
}

export function ApplicationEditPanel({
  application,
  tenantId,
  onSaved,
}: {
  application: CreditApplication;
  tenantId: string;
  onSaved: () => void;
}) {
  const displayStatus = application.display_status ?? null;
  const editable = isApplicationEditable(displayStatus);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const initial = useMemo(() => extractEditFormFromRaw(application.raw), [application.raw]);
  const [form, setForm] = useState<ApplicationEditFormValues>(initial);

  if (!editable) return null;

  const patch = (key: keyof ApplicationEditFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const changes = buildFieldsPatch(initial, form);
    if (Object.keys(changes).length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await patchApplicationFields({ tenantId, applicationId: application.application_id, fields: changes });
      forgeToast.success("Cambios guardados correctamente");
      setEditing(false);
      onSaved();
    } catch (err) {
      const msg = err instanceof CHApiError ? err.detail : err instanceof Error ? err.message : "Error al guardar";
      forgeToast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ch-card mb-4 p-4" data-testid="application-edit-panel">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 17 }}>
          Datos editables
        </h2>
        {!editing ? (
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" data-testid="edit-application-btn" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Editar solicitud
          </button>
        ) : (
          <div className="flex gap-2">
            <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" disabled={saving} onClick={() => void handleSave()}>
              <Save className="h-3.5 w-3.5" aria-hidden />
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              className="ch-btn ch-btn-ghost ch-btn-sm"
              disabled={saving}
              onClick={() => {
                setForm(initial);
                setEditing(false);
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancelar
            </button>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-3 md:grid-cols-2" style={{ fontSize: 13 }}>
        <Field label={APPLICATION_FIELD_LABELS.applicant_phone!} value={form.applicant_phone} editing={editing} onChange={(v) => patch("applicant_phone", v)} />
        <Field label={APPLICATION_FIELD_LABELS.applicant_email!} value={form.applicant_email} editing={editing} onChange={(v) => patch("applicant_email", v)} />
        <Field label={APPLICATION_FIELD_LABELS.applicant_address!} value={form.applicant_address} editing={editing} onChange={(v) => patch("applicant_address", v)} />
        <Field label={APPLICATION_FIELD_LABELS.applicant_sector!} value={form.applicant_sector} editing={editing} onChange={(v) => patch("applicant_sector", v)} />
        <Field label={APPLICATION_FIELD_LABELS.applicant_city!} value={form.applicant_city} editing={editing} onChange={(v) => patch("applicant_city", v)} />
        <Field label={APPLICATION_FIELD_LABELS.applicant_province!} value={form.applicant_province} editing={editing} onChange={(v) => patch("applicant_province", v)} />
        <Field label={APPLICATION_FIELD_LABELS.employer_name!} value={form.employer_name} editing={editing} onChange={(v) => patch("employer_name", v)} />
        <Field label={APPLICATION_FIELD_LABELS.employment_position!} value={form.employment_position} editing={editing} onChange={(v) => patch("employment_position", v)} />
        <Field label={APPLICATION_FIELD_LABELS.employment_tenure_months!} value={form.employment_tenure_months} editing={editing} onChange={(v) => patch("employment_tenure_months", v)} />
        <Field label={APPLICATION_FIELD_LABELS.monthly_income!} value={form.monthly_income} editing={editing} onChange={(v) => patch("monthly_income", v)} />
        <Field label={APPLICATION_FIELD_LABELS.down_payment!} value={form.down_payment} editing={editing} onChange={(v) => patch("down_payment", v)} />
        <Field label={APPLICATION_FIELD_LABELS.desired_term_months!} value={form.desired_term_months} editing={editing} onChange={(v) => patch("desired_term_months", v)} />
        <Field label={APPLICATION_FIELD_LABELS.applicant_identification!} value={application.applicant_name} locked editing={editing} />
        <Field label={APPLICATION_FIELD_LABELS.vehicle_vin!} value={application.vehicle_vin ?? ""} locked editing={editing} />
      </dl>

      {editing ? (
        <div className="mt-3">
          <label className="ch-eyebrow">{APPLICATION_FIELD_LABELS.personal_references}</label>
          <textarea
            className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2 font-mono text-xs"
            style={{ borderColor: "var(--ch-border)", background: "var(--ch-surface)" }}
            value={form.personal_references_json}
            onChange={(e) => patch("personal_references_json", e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
