"use client";

import { useState } from "react";
import Link from "next/link";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { useAccessEntitlementsBatch, useAccessReadiness } from "@/lib/access/hooks";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import {
  DEALER_CORE_STATUS_ROWS,
  deriveDealerCoreUiState,
} from "@/lib/dealer/core-status";
import type { EntitlementDecision } from "@/types/entitlements";

const CORE_KEYS = DEALER_CORE_STATUS_ROWS.map((row) => row.capability);

export function DealerCoreStatusHome() {
  const context = getAccessClientContext();
  const readiness = useAccessReadiness();
  const batch = useAccessEntitlementsBatch([...CORE_KEYS]);
  const [upgradeFor, setUpgradeFor] = useState<EntitlementDecision | null>(null);

  if (!context?.tenantId) {
    return (
      <section
        role="alert"
        data-testid="dealer-core-status-error"
        data-reason-code="TENANT_NOT_FOUND"
        className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
      >
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Sin tenant</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">No hay contexto de tenant para leer readiness.</p>
      </section>
    );
  }

  const loading =
    readiness.isPending ||
    readiness.isLoading ||
    batch.isPending ||
    batch.isLoading;
  const accessError =
    readiness.error instanceof AccessApiError ||
    batch.error instanceof AccessApiError ||
    Boolean(readiness.error) ||
    Boolean(batch.error);

  if (loading) {
    return (
      <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-core-status-loading">
        Cargando estado de cores…
      </p>
    );
  }

  if (accessError) {
    const err =
      readiness.error instanceof AccessApiError
        ? readiness.error
        : batch.error instanceof AccessApiError
          ? batch.error
          : null;
    return (
      <section
        role="alert"
        data-testid="dealer-core-status-error"
        data-reason-code={err?.reason_code ?? "DEFAULT_DENY"}
        data-http-status={err ? String(err.status) : undefined}
        className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
      >
        <h2 className="font-manrope text-lg font-bold text-nk-fg">No se pudo cargar el estado</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">
          {err?.reason_code ?? "Error al leer readiness o entitlements."}
        </p>
      </section>
    );
  }

  const entries = readiness.data?.entries ?? [];
  const byKey = new Map(entries.map((e) => [e.capability_key, e]));

  return (
    <div className="max-w-full space-y-3 overflow-x-hidden" data-testid="dealer-core-status-ready">
      {DEALER_CORE_STATUS_ROWS.map((row) => {
        const entry = byKey.get(row.capability) ?? null;
        const item = batch.data?.results?.[row.capability] ?? null;
        const derived = deriveDealerCoreUiState({
          accessError: false,
          entry,
          batch: item,
        });
        const upgradeDecision: EntitlementDecision | null =
          derived.action === "upgrade"
            ? {
                allowed: false,
                reason_code: (derived.reason_code as EntitlementDecision["reason_code"]) || "UPGRADE_REQUIRED",
              }
            : null;
        return (
          <article
            key={row.capability}
            data-testid="dealer-core-card"
            data-core-name={row.name}
            data-core-state={derived.state}
            data-reason-code={derived.reason_code ?? ""}
            className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-manrope text-base font-bold text-nk-fg">{row.name}</h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">{derived.state}</p>
            </div>
            <p className="mt-2 text-sm text-nk-fg-muted break-words">{derived.reason}</p>
            {derived.reason_code ? (
              <p className="mt-1 text-xs font-semibold text-nk-fg">
                reason_code: <code>{derived.reason_code}</code>
              </p>
            ) : null}
            {entry ? (
              <p className="mt-1 text-xs text-nk-fg-muted">
                readiness: {entry.status}
                {entry.is_usable ? " · usable" : " · no usable"}
              </p>
            ) : (
              <p className="mt-1 text-xs text-nk-fg-muted">readiness: sin entrada para esta capability</p>
            )}
            {derived.action === "open" ? (
              <Link
                href={row.href}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-2 underline"
              >
                Abrir
              </Link>
            ) : null}
            {derived.action === "upgrade" && upgradeDecision ? (
              <button
                type="button"
                className="mt-3 min-h-11 w-full rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-semibold text-nk-fg"
                onClick={() => setUpgradeFor(upgradeDecision)}
              >
                Ver planes publicados
              </button>
            ) : null}
            {derived.action === "contact_admin" ? (
              <p className="mt-3 text-sm text-nk-fg">Contacta a tu administrador para desbloquear.</p>
            ) : null}
          </article>
        );
      })}
      {upgradeFor ? <UpgradeModal decision={upgradeFor} onClose={() => setUpgradeFor(null)} /> : null}
    </div>
  );
}
