"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/fetch-client";
import { useTenant } from "@/contexts/TenantContext";

/** Límites medidos en services/marketing/ad_draft_rules.py (HEADLINES, DESCRIPTIONS, KEYWORDS, MATCH_TYPES). */
export const LIM = { titulos: [3, 15, 30], descripciones: [2, 4, 90], palabras: [1, 20] } as const;
export const CONCORDANCIAS = [
  { v: "EXACT", t: "Exacta" },
  { v: "PHRASE", t: "De frase" },
  { v: "BROAD", t: "Amplia" },
] as const;
/** Estados de ad_drafts_service.STATUSES. */
export const ESTADOS: Record<string, string> = {
  draft: "Borrador",
  submitted: "En revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  published: "Publicado (en pausa)",
  publish_failed: "Falló la publicación",
};

export interface Borrador {
  id: string;
  external_ref: string;
  customer_id: string;
  status: string;
  brief: Record<string, any>;
  plan: Record<string, any> | null;
  rejected_reason?: string | null;
}
interface Cuenta { customer_id: string; name: string | null; manager: boolean | null; readable: boolean }

const lineas = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const masLargo = (xs: string[]) => xs.reduce((m, x) => Math.max(m, x.length), 0);
const nuevaRef = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `ref-${Date.now()}-${Math.random()}`;
const MSG_ERROR = "No pudimos completar la acción con tus anuncios ahora. Inténtalo de nuevo en unos minutos.";

const FORM0 = { cuenta: "", nombre: "", url: "", presupuesto: "", titulos: "", descripciones: "", palabras: "", match: "PHRASE" };

function Contador({ n, lo, hi, largo, max, nombre }: { n: number; lo: number; hi: number; largo: number; max: number; nombre: string }) {
  const mal = (n > 0 && (n < lo || n > hi)) || largo > max;
  return (
    <span className={`text-xs ${mal ? "text-red-600" : "text-gray-500"}`}>
      {`${n} de ${lo} a ${hi} ${nombre} · más largo: ${largo}/${max}`}
    </span>
  );
}

export default function AnunciosClient() {
  const { tenantId } = useTenant();
  const [items, setItems] = useState<Borrador[] | null>(null);
  const [errorLista, setErrorLista] = useState(false);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [form, setForm] = useState(FORM0);
  const [editando, setEditando] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const ref = useRef(nuevaRef());
  const base = tenantId ? `/api/v1/tenants/${encodeURIComponent(tenantId)}/google-ads` : "";

  const cargar = useCallback(async () => {
    if (!base) return;
    try {
      const r = await apiFetch(`${base}/ad-drafts`, { headers: { Accept: "application/json" } });
      const b = r.ok ? await r.json().catch(() => null) : null;
      if (Array.isArray(b?.data)) { setItems(b.data); setErrorLista(false); } else setErrorLista(true);
    } catch { setErrorLista(true); }
  }, [base]);

  useEffect(() => {
    setItems(null); setCuentas([]); setForm(FORM0); setEditando(null); setMsg(null);
    if (!base) return;
    cargar();
    (async () => {
      try {
        const r = await apiFetch(`${base}/accounts`, { headers: { Accept: "application/json" } });
        const l = r.ok ? (await r.json().catch(() => null))?.data?.accounts : null;
        if (Array.isArray(l)) setCuentas(l.filter((c: Cuenta) => c.readable === true && c.manager === false && /^\d{10}$/.test(String(c.customer_id))));
      } catch { /* sin cuentas: el selector queda vacío y se avisa */ }
    })();
  }, [base, cargar]);

  const set = (k: keyof typeof FORM0) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const tit = lineas(form.titulos), des = lineas(form.descripciones), kws = lineas(form.palabras);

  function editar(d: Borrador) {
    setEditando(d.id); setMsg(null);
    setForm({
      cuenta: d.customer_id, nombre: d.brief?.name ?? "", url: d.brief?.final_url ?? "",
      presupuesto: d.brief?.daily_budget != null ? String(d.brief.daily_budget) : "",
      titulos: (d.plan?.headlines ?? []).join("\n"), descripciones: (d.plan?.descriptions ?? []).join("\n"),
      palabras: (d.plan?.keywords ?? []).map((k: any) => k.text).join("\n"), match: d.plan?.keywords?.[0]?.match_type ?? "PHRASE",
    });
  }

  async function guardar() {
    const brief = { customer_id: form.cuenta, final_url: form.url.trim(), daily_budget: Number(form.presupuesto), name: form.nombre.trim() };
    const plan = { headlines: tit, descriptions: des, keywords: kws.map((text) => ({ text, match_type: form.match })) };
    setMsg(null);
    try {
      const r = await apiFetch(editando ? `${base}/ad-drafts/${encodeURIComponent(editando)}` : `${base}/ad-drafts`, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(editando ? { brief, plan } : { external_ref: ref.current, brief, plan }),
      });
      if (!r.ok) return setMsg(MSG_ERROR);
      setMsg(editando ? "Borrador actualizado." : "Borrador guardado.");
      setForm(FORM0); setEditando(null); ref.current = nuevaRef();
      await cargar();
    } catch { setMsg(MSG_ERROR); }
  }

  const campo = "border rounded px-2 py-1 w-full text-sm dark:bg-gray-900";
  const puede = form.cuenta && form.url && Number(form.presupuesto) > 0 && tit.length && des.length && kws.length;

  return (
    <div className="space-y-8">
      <section aria-label="Borradores">
        <h2 className="text-xl font-semibold mb-2">Tus borradores</h2>
        {items === null && !errorLista && <p className="text-sm text-gray-500">Cargando tus borradores…</p>}
        {errorLista && <p className="text-sm text-red-600">No pudimos cargar tus borradores ahora. Inténtalo de nuevo en unos minutos.</p>}
        {items?.length === 0 && <p className="text-sm">Todavía no hay borradores de anuncios.</p>}
        {!!items?.length && (
          <ul className="divide-y border rounded">
            {items.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <p className="font-medium">{d.brief?.name || "Sin nombre"}</p>
                  {d.status === "rejected" && d.rejected_reason && <p className="text-xs text-red-600">Motivo: {d.rejected_reason}</p>}
                </div>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs">{ESTADOS[d.status] ?? d.status}</span>
                {(d.status === "draft" || d.status === "rejected") && (
                  <button className="text-blue-600 hover:underline" onClick={() => editar(d)}>Editar</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Formulario" className="space-y-3">
        <h2 className="text-xl font-semibold">{editando ? "Editar borrador" : "Nuevo borrador"}</h2>
        <label className="block text-sm">Cuenta de Google Ads
          <select className={campo} value={form.cuenta} onChange={set("cuenta")}>
            <option value="">Elige una cuenta</option>
            {cuentas.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.name || c.customer_id} ({c.customer_id})</option>)}
          </select>
        </label>
        <label className="block text-sm">Nombre
          <input className={campo} value={form.nombre} onChange={set("nombre")} />
        </label>
        <label className="block text-sm">Página de destino (https://)
          <input className={campo} value={form.url} onChange={set("url")} />
        </label>
        <label className="block text-sm">Presupuesto diario
          <input className={campo} type="number" min="0" value={form.presupuesto} onChange={set("presupuesto")} />
        </label>
        <p className="text-xs text-gray-500">Hay un tope definido por el administrador; si lo superas, el envío a revisión te lo indicará.</p>
        <label className="block text-sm">Títulos (uno por línea, máx. 30 caracteres)
          <textarea className={campo} rows={4} value={form.titulos} onChange={set("titulos")} />
        </label>
        <Contador n={tit.length} lo={LIM.titulos[0]} hi={LIM.titulos[1]} largo={masLargo(tit)} max={LIM.titulos[2]} nombre="títulos" />
        <label className="block text-sm">Descripciones (una por línea, máx. 90 caracteres)
          <textarea className={campo} rows={3} value={form.descripciones} onChange={set("descripciones")} />
        </label>
        <Contador n={des.length} lo={LIM.descripciones[0]} hi={LIM.descripciones[1]} largo={masLargo(des)} max={LIM.descripciones[2]} nombre="descripciones" />
        <label className="block text-sm">Palabras clave (una por línea)
          <textarea className={campo} rows={3} value={form.palabras} onChange={set("palabras")} />
        </label>
        <p className="text-xs text-gray-500">{kws.length} de {LIM.palabras[0]} a {LIM.palabras[1]} palabras clave</p>
        <label className="block text-sm">Concordancia
          <select className={campo} value={form.match} onChange={set("match")}>
            {CONCORDANCIAS.map((c) => <option key={c.v} value={c.v}>{c.t}</option>)}
          </select>
        </label>
        {msg && <p role="status" className="text-sm">{msg}</p>}
        <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50" disabled={!puede} onClick={guardar}>
          Guardar borrador
        </button>
        {editando && <button className="ml-3 text-sm underline" onClick={() => { setEditando(null); setForm(FORM0); }}>Cancelar edición</button>}
      </section>
    </div>
  );
}
