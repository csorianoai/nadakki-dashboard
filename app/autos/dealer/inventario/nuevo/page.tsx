"use client";

/**
 * Alta manual de vehiculo. Antes de esta pantalla el unico camino era
 * "Publicar" con IA y fotos, y el backend de fotos no existe: un dealer no
 * podia cargar una unidad a mano.
 *
 * El dealer sale de `selectedDealerIdentity`, la MISMA lectura que usa la lista
 * para pintar el CTA: un dealer sin unidad organizativa (Mapaal) entra, y la
 * unidad la resuelve el backend. Si aqui se exigiera el contexto "ready", la
 * lista ofreceria un enlace a una puerta cerrada.
 *
 * El frontend no concede: sin dealer o sin la clave de escritura
 * en el batch de entitlements no se pinta el formulario, y cargando o con
 * error tampoco (fail-closed). El 403 del backend sigue siendo la autoridad.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccessApiError } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { resolveDealerAccessContext, selectedDealerIdentity } from "@/lib/dealer/access-context";
import { VehicleManualForm } from "@/components/dealer-management/VehicleManualForm";
import {
  VEHICLE_INITIAL_STATUS,
  VEHICLE_WRITE_CAPABILITY,
  vehicleIdFrom,
  type VehicleManualForm as VehicleForm,
} from "@/lib/dealer-management/vehicle-manual";
import { DetalleTecnico } from "../DetalleTecnico";
import { createVehiclePurchase, type PurchaseForm } from "@/lib/dealer-management/vehicle-purchase";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { ContactoSelector } from "@/app/autos/dealer/contactos/ContactoSelector";
import type { SellerSelectorProps } from "@/components/dealer-management/VehiclePurchaseSection";

function VendedorSelector({ value, onChange }: SellerSelectorProps) {
  const [nombre, setNombre] = useState("");
  return <div>
    <ContactoSelector rol="vendedor" onSelect={(contacto) => { onChange(contacto.id); setNombre(contacto.display_name); }} />
    {value && nombre && <p role="status">Vendedor seleccionado: {nombre}</p>}
  </div>;
}
const renderVendedor = (props: SellerSelectorProps) => <VendedorSelector {...props} />;

type Operation = { signature: string; key: string; tenantId: string; dealerId: string; vehicle: VehicleForm; purchase: PurchaseForm; currency: string; completed: boolean };

export default function DealerVehicleNuevoPage() {
  const router = useRouter();
  const context = selectedDealerIdentity();
  const branding = useDealerManagementBranding();
  const configuredCurrency = localeDeTenant(branding.data).currency;
  const functionalCurrency = !branding.isLoading && !branding.isPending && !branding.error && branding.data?.tenant_id === context?.tenantId && configuredCurrency && /^[A-Z]{3}$/.test(configuredCurrency) ? configuredCurrency : null;
  const access = useAccessEntitlementsBatch([VEHICLE_WRITE_CAPABILITY, "autos.purchases.register"]);
  const decision = access.data?.results[VEHICLE_WRITE_CAPABILITY];
  const allowed = !access.isLoading && !access.error && decision?.allowed === true && access.data?.results["autos.purchases.register"]?.allowed === true;

  const [busy, setBusy] = useState(false);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [ack, setAck] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [formKey, setFormKey] = useState(0);
  // El ref es un cerrojo sincrónico: dos handlers en el mismo render no pueden enviar dos POST.
  const inFlight = useRef(false);
  const operation = useRef<Operation | null>(null);

  async function onSubmit(form: VehicleForm, purchase?: PurchaseForm, retry = false) {
    if (!context || !purchase || !functionalCurrency || !allowed || inFlight.current || completed || (uncertain && !retry)) return;
    const signature = JSON.stringify([context.tenantId, context.dealerId, form, purchase, functionalCurrency]);
    if (retry) {
      // Un reintento ambiguo nunca cambia payload, identidad, moneda ni clave.
      if (!operation.current || operation.current.tenantId !== context.tenantId || operation.current.dealerId !== context.dealerId || operation.current.currency !== functionalCurrency) return;
    } else if (operation.current?.signature !== signature) {
      if (typeof globalThis.crypto?.randomUUID !== "function") { setReasonCode("SECURE_UUID_UNAVAILABLE"); return; }
      operation.current = { signature, key: globalThis.crypto.randomUUID(), tenantId: context.tenantId, dealerId: context.dealerId, vehicle: form, purchase, currency: functionalCurrency, completed: false };
    }
    const op = operation.current;
    if (!op || op.completed) return;
    inFlight.current = true;
    setBusy(true);
    setReasonCode(null);
    setAck(null);
    try {
      const body = await createVehiclePurchase(context, op.vehicle, op.purchase, op.currency, op.key);
      op.completed = true; setCompleted(true); setUncertain(false);
      const id = vehicleIdFrom(body);
      if (id) {
        setAck(`Vehículo creado: ${id}`);
        router.push(`/autos/dealer/inventario/${encodeURIComponent(id)}`);
        return;
      }
      setAck("Vehículo creado. No pudimos abrir su ficha; búscalo en el inventario.");
    } catch (error) {
      setUncertain(!(error instanceof AccessApiError) || error.status >= 500);
      if (error instanceof AccessApiError) {
        setReasonCode(error.reason_code ?? `HTTP_${error.status}`);
      } else {
        setReasonCode("PURCHASE_OUTCOME_UNKNOWN");
      }
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }

  return (
    <main className="max-w-full space-y-5 overflow-x-hidden">
      <header>
        <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Nuevo vehículo</h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Carga manual. Se crea como borrador y no se publica hasta que lo pases a disponible.
        </p>
        <Link
          href="/autos/dealer/inventario"
          className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-brand-2 underline"
        >
          Volver al inventario
        </Link>
      </header>

      {!context ? (
        <div role="alert" data-testid="nuevo-sin-contexto" className="rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg">
          No puedes cargar vehículos todavía: no pudimos identificar tu concesionario.
          <DetalleTecnico>
            <code>{resolveDealerAccessContext().reason_code}</code>
          </DetalleTecnico>
        </div>
      ) : access.isLoading ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Verificando acceso…</p>
      ) : !allowed ? (
        <div
          role="alert"
          data-testid="nuevo-bloqueado"
          data-allowed="false"
          data-reason-code={
            access.error instanceof AccessApiError
              ? (access.error.reason_code ?? `HTTP_${access.error.status}`)
              : (decision?.reason_code ?? "DEFAULT_DENY")
          }
          className="rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg"
        >
          Tu usuario no puede cargar vehículos. Si crees que es un error, pide a quien administra tu cuenta que
          revise tus permisos.
          <DetalleTecnico>
            <code>
              {access.error instanceof AccessApiError
                ? (access.error.reason_code ?? `HTTP_${access.error.status}`)
                : (decision?.reason_code ?? "DEFAULT_DENY")}
            </code>
          </DetalleTecnico>
        </div>
      ) : !functionalCurrency ? (
        <p role="alert">No se pudo confirmar la moneda funcional de tu concesionario. Configúrala o espera a que termine de cargar antes de registrar una compra.</p>
      ) : (
        <fieldset disabled={busy || uncertain || completed}>
        <VehicleManualForm
          key={formKey}
          withPurchase
          sellerSelector={renderVendedor}
          status={VEHICLE_INITIAL_STATUS}
          busy={busy || uncertain || completed}
          errorReasonCode={reasonCode}
          ack={ack}
          onSubmit={onSubmit}
        />
        </fieldset>
      )}
      {uncertain && <div>
        <p>El resultado de la compra no está confirmado. No registres otra compra para reemplazarla; verifica el inventario. Un reintento conserva la operación original.</p>
        <button type="button" disabled={busy || !functionalCurrency || !allowed} onClick={() => { const op = operation.current; if (op) void onSubmit(op.vehicle, op.purchase, true); }}>Reintentar la misma compra</button>
      </div>}
      {completed && <button type="button" onClick={() => { operation.current = null; setCompleted(false); setAck(null); setReasonCode(null); setFormKey((n) => n + 1); }}>Registrar otra compra</button>}
    </main>
  );
}
