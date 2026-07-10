"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { CHApiError } from "@/lib/credit-hub/api/client";
import {
  fulfillOfferCondition,
  getOfferConditions,
  isBankExperienceEndpointUnavailable,
  putOfferConditions,
  type OfferCondition,
} from "@/lib/credit-hub/api/bankExperienceClient";
import { usePrimaryOfferId } from "@/lib/credit-hub/hooks/usePrimaryOfferId";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

function formatValidity(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function slugKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48) || `cond_${Date.now()}`;
}

export function ConditionsPanel({ applicationId }: { applicationId: string }) {
  const { apiTenantId } = useTenant();
  const qc = useQueryClient();
  const { offerId } = usePrimaryOfferId(applicationId);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [fulfillingIndex, setFulfillingIndex] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["offer-conditions", apiTenantId, applicationId, offerId],
    queryFn: () =>
      getOfferConditions({ tenantId: apiTenantId!, applicationId, offerId: offerId!, actorRole: "bank_analyst" }),
    enabled: !!apiTenantId && !!offerId,
    retry: false,
  });

  const conditions = useMemo(() => q.data?.conditions ?? [], [q.data?.conditions]);

  if (!offerId && !q.isLoading) return null;
  if (q.error instanceof CHApiError && isBankExperienceEndpointUnavailable(q.error)) return null;

  const validLabel = formatValidity(q.data?.valid_until ?? q.data?.expires_at);

  const toggleMet = async (index: number, met: boolean) => {
    if (!apiTenantId || !offerId) return;
    setFulfillingIndex(index);
    try {
      await fulfillOfferCondition({
        tenantId: apiTenantId,
        applicationId,
        offerId,
        index,
        met,
      });
      void qc.invalidateQueries({ queryKey: ["offer-conditions", apiTenantId, applicationId, offerId] });
      forgeToast.success(met ? "Condición cumplida" : "Condición marcada pendiente");
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo actualizar la condición");
    } finally {
      setFulfillingIndex(null);
    }
  };

  const addCondition = async () => {
    const label = newText.trim();
    if (!apiTenantId || !offerId || !label) return;
    setSaving(true);
    try {
      const next: OfferCondition[] = [
        ...conditions,
        { key: slugKey(label), label_es: label, met: false, detail: null },
      ];
      await putOfferConditions({ tenantId: apiTenantId, applicationId, offerId, conditions: next });
      setNewText("");
      void qc.invalidateQueries({ queryKey: ["offer-conditions", apiTenantId, applicationId, offerId] });
      forgeToast.success("Condición agregada");
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo agregar la condición");
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
        {conditions.map((c, index) => (
          <li key={c.key} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={c.met}
              disabled={fulfillingIndex === index}
              onChange={() => void toggleMet(index, !c.met)}
              aria-label={`Marcar condición: ${c.label_es}`}
              data-testid={`condition-check-${c.key}`}
            />
            <span style={{ opacity: c.met ? 0.65 : 1 }}>{c.label_es}</span>
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
        <button
          type="button"
          className="ch-btn ch-btn-secondary ch-btn-sm"
          disabled={saving || !newText.trim()}
          onClick={() => void addCondition()}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
