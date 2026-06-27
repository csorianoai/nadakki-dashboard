"use client";

import { useState } from "react";
import { toast } from "@/components/forge/ui/Toast";
import { useCreateHearing } from "@/hooks/legal/useHearings";
import { humanizeToken } from "@/lib/legal/hearings/hearings-format";
import type { HearingCreatePayload } from "@/lib/legal/hearings/hearings-types";

/**
 * Create-hearing dialog. Only `title` and `hearing_date` are required (the rest
 * are server-defaulted). tenant_id is NEVER part of the payload — the tenant
 * travels in X-Tenant-ID via the legal proxy.
 *
 * NOTE on hearing_date: the native datetime-local value is interpreted in the
 * browser timezone and converted to an ISO TIMESTAMPTZ via toISOString(). The
 * `timezone` field is sent separately (default from /config).
 */
type Props = {
  tenantId: string;
  open: boolean;
  onClose: () => void;
  hearingTypes: string[];
  defaultTimezone: string;
};

const fieldCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-violet-500";
const labelCls = "block text-sm font-medium text-zinc-200";

export function HearingCreateDialog({
  tenantId,
  open,
  onClose,
  hearingTypes,
  defaultTimezone,
}: Props) {
  const { mutateAsync, isPending } = useCreateHearing(tenantId);

  const [title, setTitle] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [hearingType, setHearingType] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [location, setLocation] = useState("");
  const [courtroom, setCourtroom] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [caseId, setCaseId] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const reset = () => {
    setTitle("");
    setHearingDate("");
    setHearingType("");
    setDurationMinutes("");
    setLocation("");
    setCourtroom("");
    setJudgeName("");
    setCaseId("");
    setExternalRef("");
    setNotes("");
  };

  const submit = async () => {
    if (!title.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }
    if (!hearingDate) {
      toast.error("La fecha de la audiencia es obligatoria.");
      return;
    }
    const iso = new Date(hearingDate).toISOString();
    const payload: HearingCreatePayload = {
      title: title.trim(),
      hearing_date: iso,
      timezone: defaultTimezone || undefined,
    };
    if (hearingType) payload.hearing_type = hearingType;
    if (durationMinutes.trim()) {
      const n = Number(durationMinutes);
      if (!Number.isNaN(n)) payload.duration_minutes = n;
    }
    if (location.trim()) payload.location = location.trim();
    if (courtroom.trim()) payload.courtroom = courtroom.trim();
    if (judgeName.trim()) payload.judge_name = judgeName.trim();
    if (caseId.trim()) payload.case_id = caseId.trim();
    if (externalRef.trim()) payload.external_ref = externalRef.trim();
    if (notes.trim()) payload.notes = notes.trim();

    try {
      await mutateAsync(payload);
      toast.success("Audiencia creada.");
      reset();
      onClose();
    } catch (e: unknown) {
      // 409 (external_ref duplicado) / 422 (validación) surface the backend message.
      const msg = e instanceof Error ? e.message : "No se pudo crear la audiencia.";
      toast.error(msg);
    }
  };

  return (
    <div
      id="hearing-create-dialog"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hearing-create-heading"
      aria-busy={isPending}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <h2 id="hearing-create-heading" className="text-lg font-semibold text-zinc-100">
          Nueva audiencia
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Solo el título y la fecha son obligatorios. El resto usa valores por defecto del servidor.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="h-title" className={labelCls}>
              Título *
            </label>
            <input
              id="h-title"
              type="text"
              className={fieldCls}
              value={title}
              disabled={isPending}
              aria-required="true"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="h-date" className={labelCls}>
                Fecha y hora *
              </label>
              <input
                id="h-date"
                type="datetime-local"
                className={fieldCls}
                value={hearingDate}
                disabled={isPending}
                aria-required="true"
                onChange={(e) => setHearingDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="h-type" className={labelCls}>
                Tipo
              </label>
              <select
                id="h-type"
                className={fieldCls}
                value={hearingType}
                disabled={isPending}
                onChange={(e) => setHearingType(e.target.value)}
              >
                <option value="">(Por defecto del servidor)</option>
                {hearingTypes.map((t) => (
                  <option key={t} value={t}>
                    {humanizeToken(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="h-duration" className={labelCls}>
                Duración (min)
              </label>
              <input
                id="h-duration"
                type="number"
                min={1}
                className={fieldCls}
                value={durationMinutes}
                disabled={isPending}
                placeholder="60"
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="h-case" className={labelCls}>
                Expediente (case_id)
              </label>
              <input
                id="h-case"
                type="text"
                className={fieldCls}
                value={caseId}
                disabled={isPending}
                onChange={(e) => setCaseId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="h-location" className={labelCls}>
                Ubicación
              </label>
              <input
                id="h-location"
                type="text"
                className={fieldCls}
                value={location}
                disabled={isPending}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="h-courtroom" className={labelCls}>
                Sala (courtroom)
              </label>
              <input
                id="h-courtroom"
                type="text"
                className={fieldCls}
                value={courtroom}
                disabled={isPending}
                onChange={(e) => setCourtroom(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="h-judge" className={labelCls}>
                Juez
              </label>
              <input
                id="h-judge"
                type="text"
                className={fieldCls}
                value={judgeName}
                disabled={isPending}
                onChange={(e) => setJudgeName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="h-ref" className={labelCls}>
                Referencia externa
              </label>
              <input
                id="h-ref"
                type="text"
                className={fieldCls}
                value={externalRef}
                disabled={isPending}
                onChange={(e) => setExternalRef(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="h-notes" className={labelCls}>
              Notas
            </label>
            <textarea
              id="h-notes"
              rows={3}
              className={`${fieldCls} resize-y`}
              value={notes}
              disabled={isPending}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800 disabled:opacity-60"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
            onClick={() => void submit()}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? "Creando…" : "Crear audiencia"}
          </button>
        </div>
      </div>
    </div>
  );
}
