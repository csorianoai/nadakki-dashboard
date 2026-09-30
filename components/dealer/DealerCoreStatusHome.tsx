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
import { COPY_ESTADO_MODULO, estadoDeModulo } from "@/lib/dealer-management/estado-modulo";
import type { EntitlementDecision } from "@/types/entitlements";

const ACTION_CAPS = DEALER_CORE_STATUS_ROWS.map((row) => row.actionCapability);

export function DealerCoreStatusHome() {
  const context = getAccessClientContext();
  const readiness = useAccessReadiness();
  const batch = useAccessEntitlementsBatch([...ACTION_CAPS]);
  const [upgradeFor, setUpgradeFor] = useState<EntitlementDecision | null>(null);

  if (!context?.tenantId) {
    return (
      <section
        role="alert"
        data-testid="dealer-core-status-error"
        data-reason-code="TENANT_NOT_FOUND"
        className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
      >
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Aún no podemos mostrar tus módulos</h2>
        <p className="mt-1 text-sm text-nk-fg-muted">
          {COPY_ESTADO_MODULO.segun_onboarding.detalle}
        </p>
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
        <h2 className="font-manrope text-lg font-bold text-nk-fg">
          No pudimos cargar esta información
        </h2>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Vuelve a intentarlo en unos minutos.
        </p>
      </section>
    );
  }

  const entries = readiness.data?.entries ?? [];
  const byKey = new Map(entries.map((e) => [e.capability_key, e]));

  return (
    <div className="max-w-full space-y-3 overflow-x-hidden" data-testid="dealer-core-status-ready">
      {DEALER_CORE_STATUS_ROWS.map((row) => {
        const entry = byKey.get(row.readinessKey) ?? null;
        const item = batch.data?.results?.[row.actionCapability] ?? null;
        const derived = deriveDealerCoreUiState({
          accessError: false,
          readinessKey: row.readinessKey,
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
            key={row.name}
            data-testid="dealer-core-card"
            data-core-name={row.name}
            data-core-state={derived.state}
            data-readiness-key={row.readinessKey}
            data-action-capability={row.actionCapability}
            data-reason-code={derived.reason_code ?? ""}
            className="max-w-full overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4"
          >
            {/* Vocabulario unico: Activo / Según avance del onboarding / No
                incluido en tu plan. Los data-* conservan el detalle tecnico
                para auditoria; en pantalla no hay jerga. */}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-manrope text-base font-bold text-nk-fg">{row.name}</h2>
              <p className="text-xs font-semibold text-nk-fg-muted">
                {derived.state === "READY"
                  ? COPY_ESTADO_MODULO.activo.etiqueta
                  : COPY_ESTADO_MODULO[
                      estadoDeModulo({
                        allowed: false,
                        reason_code: derived.reason_code,
                      }) as "segun_onboarding" | "fuera_del_plan"
                    ].etiqueta}
              </p>
            </div>
            <p className="mt-2 text-sm text-nk-fg-muted break-words">
              {derived.state === "READY"
                ? COPY_ESTADO_MODULO.activo.detalle
                : COPY_ESTADO_MODULO[
                    estadoDeModulo({
                      allowed: false,
                      reason_code: derived.reason_code,
                    }) as "segun_onboarding" | "fuera_del_plan"
                  ].detalle}
            </p>
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
