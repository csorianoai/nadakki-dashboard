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

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccessApiError } from "@/lib/access/client";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { resolveDealerAccessContext, selectedDealerIdentity } from "@/lib/dealer/access-context";
import { VehicleManualForm } from "@/components/dealer-management/VehicleManualForm";
import {
  VEHICLE_INITIAL_STATUS,
  VEHICLE_WRITE_CAPABILITY,
  createVehicleManual,
  vehicleIdFrom,
  type VehicleManualForm as VehicleForm,
} from "@/lib/dealer-management/vehicle-manual";
import { DetalleTecnico } from "../DetalleTecnico";

function nuevaIdempotencyKey(): string | undefined {
  const api = typeof globalThis.crypto === "undefined" ? null : globalThis.crypto;
  return typeof api?.randomUUID === "function" ? api.randomUUID() : undefined;
}

export default function DealerVehicleNuevoPage() {
  const router = useRouter();
  const context = selectedDealerIdentity();
  const access = useAccessEntitlementsBatch([VEHICLE_WRITE_CAPABILITY]);
  const decision = access.data?.results[VEHICLE_WRITE_CAPABILITY];
  const allowed = !access.isLoading && !access.error && decision?.allowed === true;

  const [busy, setBusy] = useState(false);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [ack, setAck] = useState<string | null>(null);

  async function onSubmit(form: VehicleForm) {
    if (!context) return;
    setBusy(true);
    setReasonCode(null);
    setAck(null);
    try {
      const body = await createVehicleManual(context, form, nuevaIdempotencyKey());
      const id = vehicleIdFrom(body);
      if (id) {
        setAck(`Vehículo creado: ${id}`);
        router.push(`/autos/dealer/inventario/${encodeURIComponent(id)}`);
        return;
      }
      setAck("Vehículo creado. No pudimos abrir su ficha; buscalo en el inventario.");
    } catch (error) {
      if (error instanceof AccessApiError) {
        setReasonCode(error.reason_code ?? `HTTP_${error.status}`);
      } else {
        setReasonCode("DEFAULT_DENY");
      }
    } finally {
      setBusy(false);
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
          No podés cargar vehículos todavía: no pudimos identificar tu concesionario.
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
          Tu usuario no puede cargar vehículos. Si creés que es un error, pedile a quien administra tu cuenta que
          revise tus permisos.
          <DetalleTecnico>
            <code>
              {access.error instanceof AccessApiError
                ? (access.error.reason_code ?? `HTTP_${access.error.status}`)
                : (decision?.reason_code ?? "DEFAULT_DENY")}
            </code>
          </DetalleTecnico>
        </div>
      ) : (
        <VehicleManualForm
          status={VEHICLE_INITIAL_STATUS}
          busy={busy}
          errorReasonCode={reasonCode}
          ack={ack}
          onSubmit={onSubmit}
        />
      )}
    </main>
  );
}
