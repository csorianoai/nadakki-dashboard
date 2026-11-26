"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comprar, errorGenio, listCompras, verificarCompra, type Metodo, type Paquete } from "@/lib/legal/cases/estudio-genio-api";
import { genioButton, genioField } from "./EstudioGenioRevision";
import m from "@/messages/es/legal-estudio-genio.json";
const c = m.compras;
/** Acceso al navegador en un solo lugar (las pruebas lo sustituyen: jsdom no deja redefinir location). */
export const navegador = {
    url: () => window.location.href,
    search: () => window.location.search,
    ir: (url: string) => window.location.assign(url),
};
/** US$1.500 como en los textos del panel ("es" no agrupa los miles de 4 cifras). */
const usd = (n: number) => `US$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
export function useComprasGenio(tenantId: string) {
    return useQuery({ queryKey: ["legal_estudio_compras", tenantId], queryFn: () => listCompras(tenantId), enabled: Boolean(tenantId), retry: false });
}
export function EstudioGenioCompras({ tenantId }: { tenantId: string }) {
    const client = useQueryClient();
    const q = useComprasGenio(tenantId);
    const [abierto, setAbierto] = useState(false);
    const [paquete, setPaquete] = useState<Paquete>("esencial");
    const [cantidad, setCantidad] = useState(1);
    const [metodo, setMetodo] = useState<Metodo | "">("");
    const [referencia, setReferencia] = useState("");
    const [comprobante, setComprobante] = useState("");
    const [aviso, setAviso] = useState("");
    const [error, setError] = useState("");
    const verificado = useRef(false);
    const refrescar = () => Promise.all([client.invalidateQueries({ queryKey: ["legal_estudio_compras", tenantId] }),
        client.invalidateQueries({ queryKey: ["legal_estudio_genio", tenantId] })]);
    const compra = useMutation({ mutationFn: () => comprar(tenantId, {
            paquete, cantidad, metodo: metodo as Metodo,
            ...(metodo === "transferencia" ? { referencia: referencia.trim(), ...(comprobante.trim() ? { comprobante: comprobante.trim() } : {}) } : {}),
            ...(metodo === "stripe" ? { url_retorno: navegador.url().split("?")[0] } : {}),
        }) });
    useEffect(() => {
        if (verificado.current || typeof window === "undefined")
            return;
        const params = new URLSearchParams(navegador.search());
        const id = params.get("compra"), pago = params.get("pago");
        if (!id || !pago)
            return;
        verificado.current = true;
        if (pago !== "ok") { setAviso(c.pagoCancelado); return; }
        verificarCompra(tenantId, id).then((r) => { setAviso(r.estado === "confirmada" ? c.pagoOk : c.pagoPendiente); void refrescar(); })
            .catch((e) => setError(errorGenio(e)));
    }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps
    const metodos = useMemo(() => q.data?.metodos_disponibles ?? [], [q.data]);
    useEffect(() => { if (!metodo && metodos.length) setMetodo(metodos[0]); }, [metodos, metodo]);
    const precio = q.data?.precios_usd?.[paquete] ?? 0;
    const enviar = async () => {
        setError(""); setAviso("");
        if (metodo === "transferencia" && !referencia.trim()) { setError(c.referenciaFalta); return; }
        try {
            const r = await compra.mutateAsync();
            if (metodo === "stripe" && r.url_pago) { navegador.ir(r.url_pago); return; }
            setAviso(c.recibida); setAbierto(false); setReferencia(""); setComprobante(""); void refrescar();
        } catch (e) { setError(errorGenio(e)); }
    };
    if (q.isPending)
        return <p role="status">{m.loading}</p>;
    if (q.error || !q.data)
        return <p role="alert">{errorGenio(q.error)}</p>;
    const saldo = q.data.saldo;
    return <section aria-label={c.title} className="space-y-4 rounded border border-slate-300 bg-white p-4 text-slate-900">
    <h2 className="text-lg font-semibold">{c.title}</h2>
    <ul className="grid gap-2 sm:grid-cols-2">{(["completo", "esencial"] as const).map((p) => {
            const s = saldo?.[p];
            const texto = s?.disponibles == null ? (s?.disponible ? c.prueba : c.sinSaldo) : s.disponibles > 0 ? c.disponibles.replace("{n}", String(s.disponibles)) : c.sinSaldo;
            return <li key={p} className="rounded border p-3"><span className="font-semibold">{m.packages[p].split(" · ")[0]}</span>: {texto}</li>;
        })}</ul>
    {aviso && <p role="status">{aviso}</p>}{error && <p role="alert">{error}</p>}
    {!abierto ? <button type="button" className={genioButton} onClick={() => setAbierto(true)}>{c.comprar}</button> :
            metodos.length === 0 ? <p role="status">{c.sinMetodos}</p> :
                <div role="group" aria-label={c.comprar} className="space-y-3 rounded border border-blue-500 bg-blue-50 p-3">
        <label className="block">{c.paquete}<select className={genioField} value={paquete} onChange={(e) => setPaquete(e.target.value as Paquete)}>
          {(["completo", "esencial"] as const).map((p) => <option key={p} value={p}>{m.packages[p]}</option>)}</select></label>
        <label className="block">{c.cantidad}<input type="number" min={1} max={50} className={genioField} value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}/></label>
        <p className="font-semibold">{c.total}: {usd(precio * cantidad)}</p>
        <fieldset className="space-y-1"><legend>{c.metodo}</legend>{metodos.map((x) => <label key={x} className="mr-4">
          <input type="radio" name="metodo" value={x} checked={metodo === x} onChange={() => setMetodo(x)}/> {c[x]}</label>)}</fieldset>
        {metodo === "transferencia" && <>
          <p className="whitespace-pre-line rounded bg-white p-2 text-sm">{q.data.datos_transferencia}</p>
          <label className="block">{c.referencia}<input className={genioField} value={referencia} onChange={(e) => setReferencia(e.target.value)}/></label>
          <label className="block">{c.comprobante}<input className={genioField} value={comprobante} onChange={(e) => setComprobante(e.target.value)}/></label>
        </>}
        <button type="button" className={genioButton} disabled={compra.isPending || !metodo} onClick={() => void enviar()}>
          {compra.isPending ? m.busy : metodo === "stripe" ? c.pagar : c.registrar}</button>{" "}
        <button type="button" className={genioButton} disabled={compra.isPending} onClick={() => setAbierto(false)}>{m.cancel}</button>
      </div>}
    <h3 className="font-semibold">{c.lista}</h3>
    {q.data.compras.length === 0 ? <p>{c.sinCompras}</p> : <ul className="space-y-1 text-sm">{q.data.compras.map((x) =>
            <li key={x.compra_id}>{new Date(x.created_at).toLocaleDateString("es")} · {m.packages[x.paquete].split(" · ")[0]} × {x.cantidad} · {usd(x.monto_usd)} · {c[x.metodo]} · {c.estados[x.estado]}{x.motivo ? ` (${x.motivo})` : ""}</li>)}</ul>}
  </section>;
}
