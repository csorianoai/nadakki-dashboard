"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch-client";
import { AccessApiError, accessApiErrorFromHttp, getAccessClientContext } from "@/lib/access/client";
import { fechaSinZona } from "./ficha-interna";

type Compra = {
  acquisition: null | { mode: string; acquired_on: string | null; country_code: string; seller_contact_id: string | null; fx: null | { rate: string; source: string; detail: string | null; as_of: string } };
  cost: null | { currency: string; amount: string; paid_total: string };
  payments: { id: string; method: string; amount: string; currency: string; check_number: string | null; check_bank: string | null; check_cash_date: string | null; detail: string | null; voided: boolean }[];
  engine_number?: string | null;
};
async function leer<T>(path: string): Promise<T> {
  const r = await apiFetch(path, { cache: "no-store" });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw accessApiErrorFromHttp(r.status, body, path);
  return body as T;
}
function VendedorRegistrado({ id, tenant }: { id: string; tenant: string }) {
  const q = useQuery({ queryKey: ["f4c-vendedor", tenant, id], queryFn: () => leer<{ display_name: string; dni: string | null; cuit: string | null }>(`/api/v1/autos/contacts/${encodeURIComponent(id)}`), retry: false, gcTime: 0 });
  if (q.isPending) return <p role="status">Cargando vendedor…</p>;
  if (q.error) return <p role="alert">No se pudo consultar el vendedor. Revisa tus permisos de contactos.</p>;
  // El backend decide la máscara según el actor. No se decide ni se reconstruye en el cliente.
  return <div aria-label="Vendedor"><h3>Vendedor</h3><p>{q.data.display_name}</p><p>DNI: {q.data.dni ?? "—"}</p><p>CUIT: {q.data.cuit ?? "—"}</p><a href="/autos/dealer/contactos" className="underline">Gestionar contactos</a></div>;
}
/** Montar solo con acceso a costos; el servidor vuelve a comprobar la capacidad del actor. */
export function CompraRegistrada({ vehicleId }: { vehicleId: string }) {
  const tenant = getAccessClientContext()?.tenantId ?? "";
  const q = useQuery({ queryKey: ["f4c-compra", tenant, vehicleId], queryFn: () => leer<Compra>(`/api/v1/autos/vehicles/${encodeURIComponent(vehicleId)}/purchase`), enabled: !!tenant && !!vehicleId, retry: false, gcTime: 0 });
  if (!tenant) return null;
  if (q.isPending) return <p role="status">Cargando compra registrada…</p>;
  if (q.error instanceof AccessApiError && q.error.status === 403) return null;
  if (q.error) return <p role="alert">No se pudo leer la compra registrada. Verifica que el esquema de compra esté disponible.</p>;
  const c = q.data;
  if (!c?.acquisition) return <p>No hay adquisición registrada.</p>;
  const a = c.acquisition;
  return <section aria-label="Compra registrada" className="space-y-3 rounded border border-nk-border bg-nk-surface p-4 text-nk-fg">
    <h2 className="text-lg font-bold">Compra registrada</h2>
    <p>Fecha: {fechaSinZona(a.acquired_on) ?? "Sin registrar"}</p><p>Modo: {a.mode}</p><p>País: {a.country_code}</p>
    {c.cost && <p>Costo: {c.cost.amount} {c.cost.currency}. Pagado: {c.cost.paid_total} {c.cost.currency}</p>}
    <h3>Pagos</h3><ul>{c.payments.map((p) => <li key={p.id}>{p.method}: {p.amount} {p.currency}{p.voided ? " (anulado)" : ""}{p.check_number ? ` · Cheque ${p.check_number}` : ""}{p.check_bank ? ` · ${p.check_bank}` : ""}{p.check_cash_date ? ` · Cobro ${fechaSinZona(p.check_cash_date)}` : ""}{p.detail ? ` · ${p.detail}` : ""}</li>)}</ul>
    {a.fx && <p>Tipo de cambio: {a.fx.rate} · Fuente: {a.fx.source}{a.fx.detail ? ` · ${a.fx.detail}` : ""} · Fecha: {fechaSinZona(a.fx.as_of)}</p>}
    {/* La clave se omite en el servidor sin autos.engine_number.view. No basta autos.costs.view. */}
    {c.engine_number != null && <p>Número de motor: {c.engine_number}</p>}
    {a.seller_contact_id && <VendedorRegistrado id={a.seller_contact_id} tenant={tenant} />}
    <p>Documentación informativa: disponible cuando exista un endpoint de recepción del checklist. No bloquea la venta.</p>
  </section>;
}
