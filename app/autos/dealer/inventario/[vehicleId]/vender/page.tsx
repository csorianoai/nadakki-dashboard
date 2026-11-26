"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { DetalleTecnico } from "../../DetalleTecnico";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { DEALER_REGISTER_CAPABILITY } from "@/lib/dealer/capabilities";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import {
  saleFormNuevo,
  ahoraLocal,
  registerSale,
  validateSaleForm,
  validateSaleVat,
  validateCompradorYPago,
  COMPRADOR_Y_PAGO_EMPTY,
  type CompradorYPago,
  SALE_VAT_MESSAGES,
  type SaleForm,
  type SaleFormErrors,
} from "@/lib/dealer-management/vehicle-sale";
import {
  VENTA_FISCAL_EMPTY, BASE_IVA_TEXTO, mensajeVenta, validateVentaFiscal, type VentaFiscalForm,
} from "@/lib/dealer-management/venta-fiscal";
import { decodeJWT } from "@/lib/auth/jwt-decode";
import { tokenStorage } from "@/lib/auth/token-storage";
import { fetchCompra } from "../vehicle-purchase-read";
import { VentaFiscalFields } from "./VentaFiscalFields";
import { CompradorYPagoFields } from "./CompradorYPagoFields";
import { PasosDeTarea, avisarProgreso } from "@/lib/dealer/pasos-tarea";
import { despuesDeVender, pasosVenta } from "@/lib/dealer/pasos-vehiculo";

const FIELD = "mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg";

export default function DealerVehicleSalePage() {
  const params = useParams();
  const vehicleId = String(params?.vehicleId ?? "").trim();
  const context = getAccessClientContext();
  const tenantId = context?.tenantId ?? "";
  const access = useAccessEntitlementsBatch([DEALER_REGISTER_CAPABILITY]);
  const branding = useDealerManagementBranding();
  const locale = localeDeTenant(branding.data);
  const [form, setForm] = useState<SaleForm>(() => saleFormNuevo());
  const [fiscal, setFiscal] = useState<VentaFiscalForm>(VENTA_FISCAL_EMPTY);
  const [pago, setPago] = useState<CompradorYPago>(COMPRADOR_Y_PAGO_EMPTY);
  const [errors, setErrors] = useState<SaleFormErrors & Record<string, string>>({});
  const allowed = !access.error && access.data?.results?.[DEALER_REGISTER_CAPABILITY]?.allowed === true;

  const identity = decodeJWT(tokenStorage.getAccessToken() ?? "") as { sub?: string; user_id?: string } | null;
  const purchase = useQuery({
    queryKey: ["sale-purchase", tenantId, identity?.sub ?? identity?.user_id ?? "sin-identidad", vehicleId],
    queryFn: () => fetchCompra(vehicleId),
    enabled: Boolean(tenantId && vehicleId && allowed),
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });
  const country = purchase.data?.country_code?.toUpperCase() ??
    /-(AR|DO)$/i.exec(locale.locale)?.[1].toUpperCase() ??
    (locale.currency === "ARS" ? "AR" : locale.currency === "DOP" ? "DO" : null);
  const saleFiscal = country === "DO" ? { ...fiscal, vat_rate: "18" } : fiscal;

  const venta = useMutation({
    mutationFn: (payload: SaleForm) => registerSale(vehicleId, tenantId, payload, locale.currency as string, saleFiscal, pago),
    onSuccess: () => {
      avisarProgreso("venta");
      setForm(saleFormNuevo());
      setFiscal(VENTA_FISCAL_EMPTY);
      setPago(COMPRADOR_Y_PAGO_EMPTY);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    venta.reset();
    if (purchase.isPending || purchase.isError || !allowed) return;
    const found: Record<string, string> = { ...validateSaleForm(form, locale.currency), ...validateVentaFiscal(saleFiscal), ...validateSaleVat(saleFiscal, country), ...validateCompradorYPago(pago) };
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    venta.mutate(form);
  }

  // Los pasos avanzan con lo que el usuario va completando; se valida igual que al enviar.
  const errPrecio = validateSaleForm(form, locale.currency);
  const pasos = pasosVenta({
    precioYFecha: !errPrecio.sale_price_amount && !errPrecio.sold_at,
    comprador: Boolean(pago.buyer_contact_id),
    formaDePago: Boolean(pago.payment_method),
    fiscal: purchase.isSuccess &&
      Object.keys({ ...validateVentaFiscal(saleFiscal), ...validateSaleVat(saleFiscal, country) }).length === 0,
    impuesto: country === "DO" ? "ITBIS" : "IVA",
    registrada: venta.isSuccess,
  });

  const baseDevuelta = (venta.data as { fiscal?: { vat_base?: string } } | undefined)?.fiscal?.vat_base ?? null;
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
          No tienes permiso para registrar ventas.
        </p>
      ) : (
        <>
        <PasosDeTarea titulo="Registrar la venta" pasos={pasos} final="Listo: la venta quedó registrada en la contabilidad." />
        {venta.isSuccess ? (
          <nav aria-label="Qué sigue después de la venta" data-testid="venta-que-sigue" className="space-y-2 rounded-r-sm border border-nk-border bg-nk-surface p-4">
            <h2 className="text-base font-semibold text-nk-fg">Qué sigue</h2>
            <ul className="flex flex-col gap-2">
              {despuesDeVender(vehicleId).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-11 w-full items-center rounded-full border border-nk-border px-4 text-sm font-semibold text-nk-fg sm:w-auto">
                    {l.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
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
              max={ahoraLocal()}
              value={form.sold_at}
              onChange={(e) => setForm({ ...form, sold_at: e.target.value })}
              className={FIELD}
            />
            {errors.sold_at ? <span role="alert" className="text-xs">{errors.sold_at}</span> : null}
          </label>
          <VentaFiscalFields
            value={saleFiscal}
            country={country}
            onChange={setFiscal}
            errors={errors}
            baseIva={baseDevuelta ? (BASE_IVA_TEXTO[baseDevuelta] ?? baseDevuelta) : null}
          />
          <CompradorYPagoFields value={pago} onChange={setPago} errors={errors} />
          {purchase.isPending ? <p role="status">Consultando el país de la compra…</p> : null}
          {purchase.isError ? <p role="alert">No se pudo consultar la compra. Intenta de nuevo antes de vender.</p> : null}
          {errors.currency ? <p role="alert" data-testid="venta-sin-moneda" className="text-sm text-nk-fg">{errors.currency}</p> : null}
          {venta.isError ? (
            <p role="alert" data-testid="venta-error" className="text-sm text-nk-fg">
              {SALE_VAT_MESSAGES[reason] ?? mensajeVenta(reason) ?? "No se pudo registrar la venta. Prueba de nuevo en unos minutos; si sigue igual, avisa a soporte."}
              <DetalleTecnico>
                <code>{reason}</code>
              </DetalleTecnico>
            </p>
          ) : null}
          {venta.isSuccess ? (
            <p role="status" data-testid="venta-ok" className="text-sm font-semibold text-nk-fg">Venta registrada.</p>
          ) : null}
          <button
            type="submit"
            disabled={venta.isPending || purchase.isPending || purchase.isError}
            className="min-h-11 w-full rounded-full bg-brand-2 px-4 text-sm font-semibold text-white"
          >
            Registrar venta
          </button>
        </form>
        </>
      )}
      <Link href={`/autos/dealer/inventario/${encodeURIComponent(vehicleId)}`} className="text-sm underline">
        Volver al vehículo
      </Link>
    </main>
  );
}
