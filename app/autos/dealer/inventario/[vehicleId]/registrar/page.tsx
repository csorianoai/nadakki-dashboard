"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { UpgradeModal } from "@/components/dealer/UpgradeModal";
import {
  postVehicleAcquisition,
  postVehicleCost,
} from "@/lib/dealer/vehicle-economics-write";
import { DEALER_REGISTER_CAPABILITY } from "@/lib/dealer/capabilities";
import type { EntitlementDecision } from "@/types/entitlements";
import { REASON_CODE_INFO } from "@/types/entitlements";

function asDecision(query: ReturnType<typeof useAccessEntitlementsBatch>): EntitlementDecision {
  if (query.error instanceof AccessApiError) {
    return {
      allowed: false,
      reason_code: (query.error.reason_code as EntitlementDecision["reason_code"]) || "DEFAULT_DENY",
    };
  }
  const item = query.data?.results?.[DEALER_REGISTER_CAPABILITY];
  if (!item) return { allowed: false, reason_code: "DEFAULT_DENY" };
  return {
    allowed: item.allowed === true,
    reason_code: (item.reason_code as EntitlementDecision["reason_code"]) || "DEFAULT_DENY",
  };
}

function fieldClass() {
  return "mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg";
}

export default function DealerVehicleRegisterPage() {
  const params = useParams();
  const vehicleId = String(params?.vehicleId ?? "").trim();
  const tenantId = getAccessClientContext()?.tenantId ?? "";
  const access = useAccessEntitlementsBatch([DEALER_REGISTER_CAPABILITY]);
  const decision = asDecision(access);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [busy, setBusy] = useState<"acquisition" | "cost" | null>(null);
  const [ack, setAck] = useState<string | null>(null);
  const [formError, setFormError] = useState<{ reason_code: string; status?: number } | null>(null);

  async function run(kind: "acquisition" | "cost", job: () => Promise<unknown>) {
    setBusy(kind);
    setAck(null);
    setFormError(null);
    try {
      const body = await job();
      const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
      const id = rec && typeof rec.id === "string" ? rec.id : null;
      setAck(id ? `${kind} ${id}` : kind);
    } catch (error) {
      if (error instanceof AccessApiError) {
        setFormError({ reason_code: error.reason_code ?? `HTTP_${error.status}`, status: error.status });
      } else {
        setFormError({ reason_code: "DEFAULT_DENY" });
      }
    } finally {
      setBusy(null);
    }
  }

  function onAcquisition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vehicleId || !tenantId) return;
    const data = new FormData(event.currentTarget);
    const supplier = String(data.get("supplier_reference") ?? "").trim();
    void run("acquisition", () =>
      postVehicleAcquisition(vehicleId, tenantId, {
        acquisition_mode_code: String(data.get("acquisition_mode_code") ?? "").trim(),
        acquired_at: String(data.get("acquired_at") ?? "").trim(),
        country_code: String(data.get("country_code") ?? "").trim(),
        supplier_reference: supplier || null,
      }),
    );
  }

  function onCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vehicleId || !tenantId) return;
    const data = new FormData(event.currentTarget);
    const reverses = String(data.get("reverses_entry_id") ?? "").trim();
    void run("cost", () =>
      postVehicleCost(vehicleId, tenantId, {
        cost_type: String(data.get("cost_type") ?? "").trim(),
        amount: String(data.get("amount") ?? "").trim(),
        currency: String(data.get("currency") ?? "").trim(),
        incurred_at: String(data.get("incurred_at") ?? "").trim(),
        reverses_entry_id: reverses || null,
      }),
    );
  }

  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg break-words">Registrar economía</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Adquisición, coste y venta. Los códigos salen de lo que escriba el operador; no hay catálogo inventado.
        </p>
      </header>

      {!vehicleId ? (
        <p role="alert" className="text-sm text-nk-fg-muted" data-testid="dealer-register-empty">
          Falta el identificador del vehículo.
        </p>
      ) : access.isPending || access.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted" data-testid="dealer-register-loading">
          Cargando acceso…
        </p>
      ) : access.error instanceof AccessApiError ? (
        <section
          role="alert"
          data-testid="dealer-register-error"
          data-reason-code={access.error.reason_code ?? ""}
          data-http-status={String(access.error.status)}
          className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
        >
          <h2 className="font-manrope text-lg font-bold text-nk-fg">No se pudo verificar el acceso</h2>
          <p className="mt-1 text-sm text-nk-fg-muted">
            reason_code: <code>{access.error.reason_code ?? `HTTP_${access.error.status}`}</code>
          </p>
        </section>
      ) : !decision.allowed ? (
        <section
          role="alert"
          data-testid="dealer-register-blocked"
          data-reason-code={decision.reason_code}
          data-allowed="false"
          className="rounded-r-sm border border-nk-border bg-nk-surface p-4"
        >
          <h2 className="font-manrope text-lg font-bold text-nk-fg">
            {REASON_CODE_INFO[decision.reason_code]?.title ?? decision.reason_code}
          </h2>
          <p className="mt-1 text-sm text-nk-fg-muted">
            {REASON_CODE_INFO[decision.reason_code]?.description ?? "Esta superficie no está disponible."}
          </p>
          {REASON_CODE_INFO[decision.reason_code]?.action_required === "upgrade_plan" ||
          decision.reason_code === "UPGRADE_REQUIRED" ? (
            <button
              type="button"
              className="mt-3 min-h-11 w-full rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-semibold text-nk-fg"
              onClick={() => setUpgradeOpen(true)}
            >
              Ver planes publicados
            </button>
          ) : null}
          {upgradeOpen ? <UpgradeModal decision={decision} onClose={() => setUpgradeOpen(false)} /> : null}
        </section>
      ) : !tenantId ? (
        <p role="alert" className="text-sm text-nk-fg-muted">
          Falta el tenant para registrar.
        </p>
      ) : (
        <div data-testid="dealer-register-ready" className="space-y-6">
          {formError ? (
            <p role="alert" data-testid="dealer-register-post-error" className="text-sm text-nk-fg">
              reason_code: <code>{formError.reason_code}</code>
            </p>
          ) : null}
          {ack ? (
            <p data-testid="dealer-register-ack" className="text-sm text-nk-fg">
              {ack}
            </p>
          ) : null}

          <form onSubmit={onAcquisition} className="space-y-3 rounded-r-sm border border-nk-border bg-nk-surface p-4">
            <h2 className="font-manrope text-lg font-bold text-nk-fg">Adquisición</h2>
            <label className="block text-sm text-nk-fg">
              acquisition_mode_code
              <input name="acquisition_mode_code" required className={fieldClass()} />
            </label>
            <label className="block text-sm text-nk-fg">
              acquired_at
              <input name="acquired_at" type="datetime-local" required className={fieldClass()} />
            </label>
            <label className="block text-sm text-nk-fg">
              country_code
              <input name="country_code" required maxLength={2} className={fieldClass()} />
            </label>
            <label className="block text-sm text-nk-fg">
              supplier_reference
              <input name="supplier_reference" className={fieldClass()} />
            </label>
            <button
              type="submit"
              disabled={busy != null}
              className="min-h-11 w-full rounded-full bg-brand-2 px-4 text-sm font-semibold text-white"
            >
              Registrar adquisición
            </button>
          </form>

          <form onSubmit={onCost} className="space-y-3 rounded-r-sm border border-nk-border bg-nk-surface p-4">
            <h2 className="font-manrope text-lg font-bold text-nk-fg">Coste</h2>
            <label className="block text-sm text-nk-fg">
              cost_type
              <input name="cost_type" required className={fieldClass()} />
            </label>
            <label className="block text-sm text-nk-fg">
              amount
              <input name="amount" required className={fieldClass()} />
            </label>
            <label className="block text-sm text-nk-fg">
              currency
              <input name="currency" required maxLength={3} className={fieldClass()} />
            </label>
            <label className="block text-sm text-nk-fg">
              incurred_at
              <input name="incurred_at" type="datetime-local" required className={fieldClass()} />
            </label>
            <label className="block text-sm text-nk-fg">
              reverses_entry_id
              <input name="reverses_entry_id" className={fieldClass()} />
            </label>
            <button
              type="submit"
              disabled={busy != null}
              className="min-h-11 w-full rounded-full bg-brand-2 px-4 text-sm font-semibold text-white"
            >
              Registrar coste
            </button>
          </form>

          <section className="space-y-2 rounded-r-sm border border-nk-border bg-nk-surface p-4">
            <h2 className="font-manrope text-lg font-bold text-nk-fg">Venta</h2>
            <p className="text-sm text-nk-fg-muted">
              La venta se registra solo desde su pantalla: la moneda es la del concesionario y de ahí salen el ingreso y el costo contables.
            </p>
            <Link
              href={`/autos/dealer/inventario/${encodeURIComponent(vehicleId)}/vender`}
              data-testid="dealer-register-vender"
              className="inline-flex min-h-11 items-center rounded-full bg-brand-2 px-4 text-sm font-semibold text-white"
            >
              Registrar venta
            </Link>
          </section>
        </div>
      )}
    </main>
  );
}
