"use client";
import { useState } from "react";
import { useEstudioGenio, useInformeGenio } from "@/hooks/legal/useEstudioGenio";
import { descargarEstudio, errorGenio, noHabilitado, type Paquete } from "@/lib/legal/cases/estudio-genio-api";
import { EstudioGenioRevision, genioButton, genioField } from "./EstudioGenioRevision";
import { EstudioGenioCompras, useComprasGenio } from "./EstudioGenioCompras";
import m from "@/messages/es/legal-estudio-genio.json";
const phases = ["contexto", "estrategias", "simulacro", "evaluacion_cruzada"] as const;
const date = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("es") : m.noDate;
export function EstudioGenioPanel({ tenantId, caseId }: {
    tenantId: string;
    caseId: string;
}) {
    const q = useEstudioGenio(tenantId, caseId);
    const saldo = useComprasGenio(tenantId).data?.saldo;
    const [selected, setSelected] = useState("");
    const [paquete, setPaquete] = useState<Paquete>("completo");
    const [pedido, setPedido] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [notice, setNotice] = useState("");
    const [downloading, setDownloading] = useState(false);
    const studies = q.data?.estudios ?? [];
    const study = studies.find((s) => s.estudio_id === selected) ?? studies[0];
    const running = studies.some((s) => s.estado === "en_curso");
    const report = useInformeGenio(tenantId, caseId, study?.estado === "completado" ? study.estudio_id : undefined);
    const request = async () => {
        if (running || q.request.isPending)
            return;
        setError(null);
        setNotice("");
        try {
            const result = await q.request.mutateAsync({ paquete, ...(pedido.trim() ? { pedido: pedido.trim() } : {}) });
            setSelected(result.estudio_id);
            setNotice(result.ya_existia ? m.existing : m.requested);
        }
        catch (e) {
            setError(e);
        }
        finally {
            setConfirming(false);
        }
    };
    const download = async () => {
        if (!study || downloading)
            return;
        setDownloading(true);
        setError(null);
        try {
            await descargarEstudio(tenantId, caseId, study.estudio_id);
        }
        catch (e) {
            setError(e);
        }
        finally {
            setDownloading(false);
        }
    };
    if (q.isPending)
        return <p role="status">{m.loading}</p>;
    const sinSaldo = Boolean(saldo && !saldo[paquete]?.disponible);
    if (q.data?.habilitado === false || noHabilitado(q.error) || noHabilitado(error))
        return <div className="space-y-4"><section className="space-y-3 rounded border bg-white p-5 text-slate-900"><p role="status">{m.disabled}</p><p>{m.about}</p></section>
      <EstudioGenioCompras tenantId={tenantId}/></div>;
    if (!q.data || q.error)
        return <div role="alert">{errorGenio(q.error)} <button className={genioButton} onClick={() => void q.refetch()}>{m.retry}</button></div>;
    return <section aria-label={m.title} className="space-y-6 text-slate-900">
    <EstudioGenioCompras tenantId={tenantId}/>
    <div className="space-y-4 rounded border border-slate-300 bg-white p-4"><h2 className="text-xl font-semibold">{m.title}</h2><p>{m.about}</p>
      <fieldset disabled={running || q.request.isPending || confirming} className="grid gap-3 sm:grid-cols-2"><legend>{m.package}</legend>
        {(["completo", "esencial"] as const).map((value) => <label key={value} className={`cursor-pointer rounded border p-4 ${paquete === value ? "border-blue-700 bg-blue-50" : "border-slate-300"}`}>
          <input type="radio" name="paquete" value={value} checked={paquete === value} onChange={() => setPaquete(value)}/> {m.packages[value]}</label>)}
      </fieldset><label className="block">{m.pedido}<textarea className={genioField} value={pedido} disabled={running || confirming || q.request.isPending} onChange={(e) => setPedido(e.target.value)}/></label>
      {sinSaldo && <p role="status">{m.compras.sinSaldoPedir}</p>}
      <button type="button" className={genioButton} disabled={running || sinSaldo || q.request.isPending || confirming} onClick={() => { setError(null); setConfirming(true); }}>{study?.estado === "fallido" || study?.estado === "interrumpido" ? m.again : m.request}</button>
      {confirming && <div role="group" aria-label={m.confirmRequest} className="space-y-2 rounded border border-blue-500 bg-blue-50 p-3"><p>{m.confirmRequest}</p><p className="font-semibold">{m.packages[paquete]}</p>
        <button type="button" className={genioButton} disabled={running || q.request.isPending} onClick={() => void request()}>{q.request.isPending ? m.busy : m.confirm}</button>{" "}
        <button type="button" className={genioButton} disabled={q.request.isPending} onClick={() => setConfirming(false)}>{m.cancel}</button></div>}
    </div>{notice && <p role="status">{notice}</p>}{error && <p role="alert">{errorGenio(error)}</p>}
    {studies.length > 0 && <label className="block">{m.history}<select className={genioField} value={study?.estudio_id ?? ""} onChange={(e) => { setSelected(e.target.value); setError(null); }}>
      {studies.map((s) => <option key={s.estudio_id} value={s.estudio_id}>{date(s.iniciado)} · {m.packages[s.paquete]} · {m.states[s.estado]} · {s.revision ? `${m.decisions[s.revision.estado]}: ${s.revision.firmante}` : m.noSignature}</option>)}</select></label>}
    {study && <div className="space-y-4 rounded border bg-white p-4"><h3 className="font-semibold">{m.states[study.estado]}</h3>
      {study.estado === "en_curso" && <p role="status">{m.waiting}</p>}
      <ol className="grid gap-3 sm:grid-cols-4">{phases.map((phase) => {
                const arrived = study.fases?.find((f) => f.fase === phase);
                return <li key={phase} className={`rounded border p-3 ${arrived ? "border-green-700 bg-green-50" : "border-slate-300"}`}>
        <p className="font-semibold">{m.phases[phase]}</p><p>{arrived ? m.done : m.pending}</p>{arrived && <time dateTime={arrived.cuando}>{date(arrived.cuando)}</time>}</li>;
            })}</ol>
      {(study.estado === "fallido" || study.estado === "interrumpido") && <p role="alert">{study.motivo || m.noReason}</p>}
      {study.estado === "completado" && <>
        {report.isPending ? <p role="status">{m.loading}</p> : report.error ? <p role="alert">{errorGenio(report.error)} <button className={genioButton} onClick={() => void report.refetch()}>{m.retry}</button></p> : <iframe title={m.report} sandbox="" referrerPolicy="no-referrer" className="min-h-[650px] w-full border" srcDoc={`<style>body{font:16px/1.6 system-ui;color:#172033;background:white;margin:24px}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #cbd5e1;padding:8px}img{max-width:100%}</style>${report.data ?? ""}`}/>}
        <button type="button" className={genioButton} disabled={downloading} onClick={() => void download()}>{m.pdf}</button>
        <EstudioGenioRevision key={study.estudio_id} previous={study.revision} busy={q.review.isPending} onSave={(body) => q.review.mutateAsync({ estudioId: study.estudio_id, body })}/>
      </>}
    </div>}
  </section>;
}
