"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getApplicationNotes,
  isBankExperienceEndpointUnavailable,
  postApplicationNote,
  type NoteCategory,
} from "@/lib/credit-hub/api/bankExperienceClient";
import { initialsFromName, noteCategoryMeta } from "@/lib/credit-hub/bank/bankExperienceHelpers";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

const CATEGORIES: NoteCategory[] = ["GENERAL", "RIESGO", "COMPLIANCE", "SEGUIMIENTO"];

function formatNoteDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function InternalNotesTab({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<NoteCategory>("GENERAL");
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["app-notes", apiTenantId, applicationId],
    queryFn: () => getApplicationNotes({ tenantId: apiTenantId!, applicationId }),
    enabled: !!apiTenantId,
    retry: false,
  });

  if (q.error instanceof CHApiError && isBankExperienceEndpointUnavailable(q.error)) return null;

  const notes = [...(q.data?.notes ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const add = async () => {
    const body = text.trim();
    if (!apiTenantId || !body) return;
    setSaving(true);
    try {
      await postApplicationNote({ tenantId: apiTenantId, applicationId, category, text: body });
      setText("");
      void qc.invalidateQueries({ queryKey: ["app-notes", apiTenantId, applicationId] });
      forgeToast.success("Nota agregada");
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo agregar la nota");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ch-card p-4" data-testid="internal-notes-tab">
      <h3 className="ch-serif" style={{ margin: "0 0 12px", fontSize: 16 }}>
        Notas internas
      </h3>
      <p style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginBottom: 14 }}>
        Cuaderno del equipo bancario. Solo visible para analistas y supervisores.
      </p>

      <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
        {q.isLoading ? <p className="text-sm text-forgeGray-500">Cargando notas…</p> : null}
        {notes.length === 0 && !q.isLoading ? (
          <p className="text-sm text-forgeGray-500">Sin notas internas aún.</p>
        ) : null}
        {notes.map((note) => {
          const meta = noteCategoryMeta(note.category);
          const initials = note.author_initials ?? initialsFromName(note.author_name);
          return (
            <div
              key={note.id}
              className="flex gap-3 rounded-lg border border-forgeGray-100 p-3"
              data-testid={`note-${note.id}`}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: "var(--ch-surface-2)", color: "var(--ch-text-2)" }}
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{note.author_name}</span>
                  <span
                    className="rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ background: meta.bg, color: meta.color }}
                    data-testid={`note-category-${note.category}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs text-forgeGray-500">{formatNoteDate(note.created_at)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{note.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-forgeGray-100 pt-4">
        <label className="mb-1 block text-xs font-medium text-forgeGray-600">Nueva nota</label>
        <textarea
          className="ch-input mb-2 w-full"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe una nota interna…"
          data-testid="note-input"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="ch-input ch-input-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as NoteCategory)}
            data-testid="note-category-select"
            aria-label="Categoría"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {noteCategoryMeta(c).label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ch-btn ch-btn-primary ch-btn-sm"
            disabled={saving || !text.trim()}
            onClick={() => void add()}
            data-testid="note-add-btn"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Probe whether notes endpoint exists (for tab gating). */
export function useNotesEndpointAvailable(applicationId: string) {
  const { apiTenantId } = useTenant();
  const q = useQuery({
    queryKey: ["app-notes-probe", apiTenantId, applicationId],
    queryFn: () => getApplicationNotes({ tenantId: apiTenantId!, applicationId }),
    enabled: !!apiTenantId,
    retry: false,
    staleTime: 60_000,
  });
  if (q.error instanceof CHApiError && isBankExperienceEndpointUnavailable(q.error)) {
    return { available: false, isLoading: q.isLoading };
  }
  return { available: !q.error || q.isSuccess, isLoading: q.isLoading };
}
