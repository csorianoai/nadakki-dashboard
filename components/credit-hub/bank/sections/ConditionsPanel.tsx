"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  getApplicationConditions,
  isBankExperienceEndpointUnavailable,
  patchApplicationConditions,
  type ApplicationCondition,
} from "@/lib/credit-hub/api/bankExperienceClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

function formatValidity(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ConditionsPanel({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ApplicationCondition[]>([]);
  const [newText, setNewText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["app-conditions", apiTenantId, applicationId],
    queryFn: () => getApplicationConditions({ tenantId: apiTenantId!, applicationId }),
    enabled: !!apiTenantId,
    retry: false,
  });

  const conditions = useMemo(() => {
    if (dirty) return draft;
    return q.data?.conditions ?? [];
  }, [dirty, draft, q.data?.conditions]);

  if (q.error instanceof CHApiError && isBankExperienceEndpointUnavailable(q.error)) return null;

  const validLabel = formatValidity(q.data?.valid_until);

  const toggleStatus = (id: string) => {
    const next = conditions.map((c) =>
      c.id === id
        ? { ...c, status: c.status === "satisfied" ? "pending" : "satisfied" }
        : c,
    );
    setDraft(next);
    setDirty(true);
  };

  const addCondition = () => {
    const text = newText.trim();
    if (!text) return;
    const next = [...conditions, { id: `local-${Date.now()}`, text, status: "pending" }];
    setDraft(next);
    setNewText("");
    setDirty(true);
  };

  const save = async () => {
    if (!apiTenantId) return;
    setSaving(true);
    try {
      await patchApplicationConditions({ tenantId: apiTenantId, applicationId, conditions });
      setDirty(false);
      void qc.invalidateQueries({ queryKey: ["app-conditions", apiTenantId, applicationId] });
      forgeToast.success("Condiciones actualizadas");
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudieron guardar las condiciones");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ch-card p-4" data-testid="conditions-panel">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="ch-serif" style={{ margin: 0, fontSize: 16 }}>
            Condiciones de la oferta
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ch-text-3)" }}>
            Gestiona estipulaciones y vigencia de la contraoferta.
          </p>
        </div>
        {validLabel ? (
          <span
            className="rounded px-2 py-1 text-xs font-semibold"
            style={{ background: "var(--ch-info-soft)", color: "var(--ch-info-text)" }}
            data-testid="offer-validity"
          >
            Vigente hasta {validLabel}
          </span>
        ) : null}
      </div>

      {q.isLoading ? <p className="text-sm text-forgeGray-500">Cargando condiciones…</p> : null}
      {conditions.length === 0 && !q.isLoading ? (
        <p className="text-sm text-forgeGray-500">Sin condiciones registradas.</p>
      ) : null}

      <ul className="mb-3 space-y-2">
        {conditions.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={c.status === "satisfied"}
              onChange={() => toggleStatus(c.id)}
              aria-label={`Marcar condición: ${c.text}`}
              data-testid={`condition-check-${c.id}`}
            />
            <span style={{ opacity: c.status === "satisfied" ? 0.65 : 1 }}>{c.text}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-forgeGray-100 pt-3">
        <input
          className="ch-input ch-input-sm min-w-[200px] flex-1"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Nueva condición…"
          data-testid="condition-input"
        />
        <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={addCondition}>
          Agregar
        </button>
        {dirty ? (
          <button
            type="button"
            className="ch-btn ch-btn-primary ch-btn-sm"
            disabled={saving}
            onClick={() => void save()}
            data-testid="conditions-save-btn"
          >
            Guardar
          </button>
        ) : null}
      </div>
    </div>
  );
}
