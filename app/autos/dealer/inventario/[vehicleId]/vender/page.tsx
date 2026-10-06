"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { DEALER_REGISTER_CAPABILITY } from "@/lib/dealer/capabilities";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import {
  SALE_FORM_EMPTY,
  registerSale,
  validateSaleForm,
  type SaleForm,
  type SaleFormErrors,
} from "@/lib/dealer-management/vehicle-sale";

const FIELD = "mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg";

export default function DealerVehicleSalePage() {
  const params = useParams();
  const vehicleId = String(params?.vehicleId ?? "").trim();
  const tenantId = getAccessClientContext()?.tenantId ?? "";
  const access = useAccessEntitlementsBatch([DEALER_REGISTER_CAPABILITY]);
  const branding = useDealerManagementBranding();
  const locale = localeDeTenant(branding.data);
  const [form, setForm] = useState<SaleForm>(SALE_FORM_EMPTY);
  const [errors, setErrors] = useState<SaleFormErrors>({});
  const allowed = !access.error && access.data?.results?.[DEALER_REGISTER_CAPABILITY]?.allowed === true;

  const venta = useMutation({
    mutationFn: (payload: SaleForm) => registerSale(vehicleId, tenantId, payload, locale.currency as string),
    onSuccess: () => setForm(SALE_FORM_EMPTY),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    venta.reset();
    const found = validateSaleForm(form, locale.currency);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    venta.mutate(form);
  }

  const reason =
    venta.error instanceof AccessApiError ? (venta.error.reason_code ?? `HTTP_${venta.error.status}`) : "ERROR";

  return (
    <main className="max-w-full space-y-4 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Registrar venta</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Es la única forma de vender un vehículo: registra la venta, el ingreso y el costo en la contabilidad.
        </p>
      </header>

      {!vehicleId || !tenantId ? (
        <p role="alert" className="text-sm text-nk-fg-muted">Falta el vehículo o el concesionario para registrar la venta.</p>
      ) : access.isPending || access.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Cargando acceso…</p>
      ) : !allowed ? (
        <p role="alert" data-testid="venta-bloqueada" className="text-sm text-nk-fg">
          No tenés permiso para registrar ventas.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3 rounded-r-sm border border-nk-border bg-nk-surface p-4" data-testid="venta-form">
          <label className="block text-sm text-nk-fg">
            Precio de venta{locale.currency ? ` (${locale.currency})` : ""}
            <input
              name="sale_price_amount"
              inputMode="decimal"
              value={form.sale_price_amount}
              onChange={(e) => setForm({ ...form, sale_price_amount: e.target.value })}
              className={FIELD}
            />
            {errors.sale_price_amount ? <span role="alert" className="text-xs">{errors.sale_price_amount}</span> : null}
          </label>
          <label className="block text-sm text-nk-fg">
            Fecha y hora de la venta
            <input
              name="sold_at"
              type="datetime-local"
              value={form.sold_at}
              onChange={(e) => setForm({ ...form, sold_at: e.target.value })}
              className={FIELD}
            />
            {errors.sold_at ? <span role="alert" className="text-xs">{errors.sold_at}</span> : null}
          </label>
          {errors.currency ? <p role="alert" data-testid="venta-sin-moneda" className="text-sm text-nk-fg">{errors.currency}</p> : null}
          {venta.isError ? (
            <p role="alert" data-testid="venta-error" className="text-sm text-nk-fg">
              No se pudo registrar la venta. reason_code: <code>{reason}</code>
            </p>
          ) : null}
          {venta.isSuccess ? (
            <p role="status" data-testid="venta-ok" className="text-sm font-semibold text-nk-fg">Venta registrada.</p>
          ) : null}
          <button
            type="submit"
            disabled={venta.isPending}
            className="min-h-11 w-full rounded-full bg-brand-2 px-4 text-sm font-semibold text-white"
          >
            Registrar venta
          </button>
        </form>
      )}
      <Link href={`/autos/dealer/inventario/${encodeURIComponent(vehicleId)}`} className="text-sm underline">
        Volver al vehículo
      </Link>
    </main>
  );
}
