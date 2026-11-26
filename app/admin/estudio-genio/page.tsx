"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { apiFetch } from "@/lib/api/fetch-client";

/**
 * Compras del Estudio Genio de todos los despachos (solo superadmin de la plataforma; /admin ya va
 * envuelto en SoloSuperadminDePlataforma). Aqui se confirman las transferencias al ver el deposito.
 * Las acciones solo funcionan desde el despacho propio de Nadakki (platform-ops): en el modo
 * supervision de otro despacho el backend no admite escrituras.
 */
type Compra = {
  compra_id: string; tenant_id: string; despacho: string; despacho_nombre?: string; paquete: string;
  cantidad: number; monto_usd: number; metodo: string; estado: string; referencia?: string | null;
  comprobante?: string | null; motivo?: string | null; created_at: string;
};
const ESTADOS = ["pendiente", "confirmada", "rechazada", "cancelada"] as const;
const usd = (n: number) => `US$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
const base = "/api/legal/cases/estudio-genio";

async function leer(res: Response): Promise<any> {
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!res.ok) {
    const d = body?.detail;
    throw new Error(typeof d === "string" ? d : `Error ${res.status}`);
  }
  return body;
}

export default function AdminEstudioGenioPage() {
  const { tenantId } = useTenant();
  const [estado, setEstado] = useState<(typeof ESTADOS)[number]>("pendiente");
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState("");
  const headers = useCallback(() => ({ "X-Tenant-ID": (tenantId ?? "").trim(), Accept: "application/json" }), [tenantId]);

  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const r = await leer(await apiFetch(`${base}/admin/compras?estado=${estado}`, { headers: headers() }));
      setCompras(r?.compras ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar"); }
    finally { setCargando(false); }
  }, [estado, headers]);
  useEffect(() => { void cargar(); }, [cargar]);

  const actuar = async (c: Compra, accion: "confirmar" | "rechazar") => {
    const motivo = (motivos[c.compra_id] ?? "").trim();
    if (accion === "rechazar" && !motivo) { setError("Escribe el motivo del rechazo."); return; }
    const texto = accion === "confirmar"
      ? `¿Confirmas que recibiste ${usd(c.monto_usd)} de ${c.despacho_nombre || c.despacho} (referencia ${c.referencia || "—"})?`
      : `¿Rechazas la compra de ${c.despacho_nombre || c.despacho}? Motivo: ${motivo}`;
    if (!window.confirm(texto)) return;
    setOcupado(c.compra_id); setError(""); setAviso("");
    try {
      await leer(await apiFetch(`${base}/compras/${encodeURIComponent(c.tenant_id)}/${encodeURIComponent(c.compra_id)}/${accion}`, {
        method: "POST", headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(accion === "rechazar" ? { motivo } : {}),
      }));
      setAviso(accion === "confirmar" ? "Compra confirmada: el despacho ya tiene el saldo." : "Compra rechazada.");
      await cargar();
    } catch (e) {
      const m = e instanceof Error ? e.message : "No se pudo completar";
      setError(m === "Vista de solo lectura" ? "Estás en modo supervisión de otro despacho. Vuelve al despacho de Nadakki para confirmar." : m);
    } finally { setOcupado(""); }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Estudio Genio: compras de los despachos</h1>
      <p className="text-sm text-slate-300">Confirma una transferencia solo después de verla en el banco. Los pagos con tarjeta se confirman solos.</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Estado{" "}
          <select className="rounded border border-slate-600 bg-slate-900 p-1" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button type="button" className="rounded border border-slate-500 px-3 py-1 text-sm" onClick={() => void cargar()}>Actualizar</button>
      </div>
      {aviso && <p role="status" className="text-emerald-300">{aviso}</p>}
      {error && <p role="alert" className="text-rose-300">{error}</p>}
      {cargando ? <p role="status">Cargando…</p> : compras.length === 0 ? <p>No hay compras en estado «{estado}».</p> : (
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-700">
            <th className="p-2">Fecha</th><th className="p-2">Despacho</th><th className="p-2">Paquete</th><th className="p-2">Monto</th>
            <th className="p-2">Método</th><th className="p-2">Referencia</th><th className="p-2">Acción</th></tr></thead>
          <tbody>{compras.map((c) => (
            <tr key={c.compra_id} className="border-b border-slate-800 align-top">
              <td className="p-2">{new Date(c.created_at).toLocaleString("es")}</td>
              <td className="p-2">{c.despacho_nombre || c.despacho}</td>
              <td className="p-2">{c.paquete} × {c.cantidad}</td>
              <td className="p-2">{usd(c.monto_usd)}</td>
              <td className="p-2">{c.metodo}</td>
              <td className="p-2">{c.referencia || "—"}{c.comprobante ? <><br />{c.comprobante}</> : null}{c.motivo ? <><br />Motivo: {c.motivo}</> : null}</td>
              <td className="space-y-1 p-2">{c.estado === "pendiente" && c.metodo === "transferencia" ? <>
                <button type="button" disabled={ocupado === c.compra_id} className="mr-2 rounded border border-emerald-500 px-2 py-1" onClick={() => void actuar(c, "confirmar")}>Confirmar</button>
                <input aria-label={`Motivo del rechazo de ${c.despacho}`} placeholder="Motivo del rechazo" className="rounded border border-slate-600 bg-slate-900 p-1"
                  value={motivos[c.compra_id] ?? ""} onChange={(e) => setMotivos((m) => ({ ...m, [c.compra_id]: e.target.value }))} />
                <button type="button" disabled={ocupado === c.compra_id} className="ml-2 rounded border border-rose-500 px-2 py-1" onClick={() => void actuar(c, "rechazar")}>Rechazar</button>
              </> : c.estado === "pendiente" ? "Se confirma solo al cobrar la tarjeta" : "—"}</td>
            </tr>))}</tbody>
        </table>)}
    </main>
  );
}
