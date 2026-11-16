"use client";

/**
 * F4F-6 parte 4: senas o reservas del vehiculo con su estado (pasivo con el comprador). Clave de cache con tenant y
 * usuario, sin reutilizar entre sesiones. Si el backend aun no tiene la contabilidad fiscal activa lo dice.
 */
import { FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccessApiError, getAccessClientContext } from "@/lib/access/client";
import { decodeJWT } from "@/lib/auth/jwt-decode";
import { tokenStorage } from "@/lib/auth/token-storage";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { normalizaImporte } from "@/lib/dealer-management/vehicle-manual";
import {
  ESTADO_SENA, NO_DISPONIBLE, fetchSenas, mensajeSena, postSena, resolverSena,
} from "@/lib/dealer-management/senas";

const FIELD = "mt-1 min-h-11 w-full min-w-0 rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg";
const GENERICO = "No se pudo guardar la seña. Prueba de nuevo en unos minutos.";

const noActiva = (e: unknown) =>
  e instanceof AccessApiError && (e.status === 503 || e.status === 404 || e.reason_code === "ESQUEMA_FISCAL_NO_APLICADO");

type Clave = readonly string[];

function textoDeFalla(falla: unknown): string | null {
  if (!falla) return null;
  if (noActiva(falla)) return NO_DISPONIBLE;
  return falla instanceof AccessApiError ? (mensajeSena(falla.reason_code) ?? GENERICO) : GENERICO;
}

function SenaForm({ vehicleId, currency, queryKey }: { vehicleId: string; currency: string | null; queryKey: Clave }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: "", received_at: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const clave = useRef("");
  const alta = useMutation({
    mutationFn: () => {
      clave.current ||= `sena-${vehicleId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return postSena(vehicleId, { ...form, currency: currency ?? "" }, clave.current);
    },
    onSuccess: () => {
      clave.current = "";
      setForm({ amount: "", received_at: "", note: "" });
      void qc.invalidateQueries({ queryKey });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    alta.reset();
    if (!currency) return setError("Falta la moneda del concesionario.");
    if (normalizaImporte(form.amount) === null) return setError("Escribe el importe de la seña, mayor que cero.");
    if (!form.received_at) return setError("Indica la fecha en que se recibió la seña.");
    setError(null);
    alta.mutate();
  }
  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });
  const texto = error ?? textoDeFalla(alta.error);
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-3" data-testid="sena-form">
      <label className="block text-sm font-semibold text-nk-fg">
        Importe de la seña{currency ? ` (${currency})` : ""}
        <input name="deposit_amount" inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value)} className={FIELD} />
      </label>
      <label className="block text-sm font-semibold text-nk-fg">
        Fecha de recepción
        <input name="deposit_received_at" type="date" value={form.received_at} onChange={(e) => set("received_at", e.target.value)} className={FIELD} />
      </label>
      <label className="block text-sm font-semibold text-nk-fg">
        Nota (opcional)
        <input name="deposit_note" maxLength={500} value={form.note} onChange={(e) => set("note", e.target.value)} className={FIELD} />
      </label>
      <button type="submit" disabled={alta.isPending} className="min-h-11 rounded-full bg-brand-2 px-4 text-sm font-semibold text-white md:col-span-3">
        Registrar seña
      </button>
      {texto ? <p role="alert" data-testid="senas-error" className="text-sm text-nk-fg md:col-span-3">{texto}</p> : null}
    </form>
  );
}

/** La moneda funcional sale del tenant (nunca a mano). Solo se monta cuando la lista cargo. */
function SenaFormDelTenant(props: { vehicleId: string; queryKey: Clave }) {
  const currency = (localeDeTenant(useDealerManagementBranding().data).currency as string | null) ?? null;
  return <SenaForm {...props} currency={currency} />;
}

export function SenasPanel({ vehicleId, currency }: { vehicleId: string; currency?: string | null }) {
  const tenantId = getAccessClientContext()?.tenantId ?? "";
  const p = decodeJWT(tokenStorage.getAccessToken() ?? "") as { sub?: string; user_id?: string } | null;
  const queryKey = ["dealer-vehicle-deposits", tenantId, p?.sub ?? p?.user_id ?? "sin-identidad", vehicleId] as const;
  const qc = useQueryClient();
  const lista = useQuery({
    queryKey,
    queryFn: () => fetchSenas(vehicleId),
    enabled: vehicleId.length > 0 && tenantId.length > 0,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const resolver = useMutation({
    mutationFn: (v: { id: string; outcome: "ganada" | "devuelta" }) => resolverSena(vehicleId, v.id, v.outcome),
    onSuccess: () => void qc.invalidateQueries({ queryKey }),
  });

  // Sin permiso de ventas no se pinta nada (como las secciones de costos).
  if (lista.error instanceof AccessApiError && lista.error.status === 403) return null;
  const falla = textoDeFalla(resolver.error);

  return (
    <section data-testid="ficha-senas" className="max-w-full space-y-2 overflow-x-hidden rounded-r-sm border border-nk-border bg-nk-surface p-4">
      <h2 className="font-manrope text-lg font-bold text-nk-fg">Señas y reservas</h2>
      {lista.isPending ? (
        <p className="animate-pulse text-sm text-nk-fg-muted">Cargando señas…</p>
      ) : noActiva(lista.error) ? (
        <p data-testid="senas-no-disponible" className="text-sm text-nk-fg-muted">{NO_DISPONIBLE}</p>
      ) : lista.isError ? (
        <p role="alert" className="text-sm text-nk-fg">No se pudieron leer las señas de este vehículo.</p>
      ) : (
        <>
          {lista.data.length === 0 ? <p className="text-sm text-nk-fg-muted">Sin señas registradas.</p> : null}
          <ul className="space-y-1">
            {lista.data.map((s) => (
              <li key={s.id} data-testid="sena-item" className="text-sm text-nk-fg">
                {s.amount} {s.currency} · {s.received_at} · {ESTADO_SENA[s.status] ?? s.status}
                {s.status === "recibida" ? (
                  <span className="ml-2 space-x-2">
                    <button type="button" className="underline" onClick={() => resolver.mutate({ id: s.id, outcome: "ganada" })}>
                      Marcar ganada
                    </button>
                    <button type="button" className="underline" onClick={() => resolver.mutate({ id: s.id, outcome: "devuelta" })}>
                      Marcar devuelta
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {currency !== undefined ? (
            <SenaForm vehicleId={vehicleId} currency={currency} queryKey={queryKey} />
          ) : (
            <SenaFormDelTenant vehicleId={vehicleId} queryKey={queryKey} />
          )}
        </>
      )}
      {falla ? <p role="alert" className="text-sm text-nk-fg">{falla}</p> : null}
      <p className="text-xs text-nk-fg-muted">
        Una seña es una deuda con el comprador. Si la venta se concreta forma parte del cobro; si se cae y no se devuelve,
        se marca como ganada y va a resultado.
      </p>
    </section>
  );
}
