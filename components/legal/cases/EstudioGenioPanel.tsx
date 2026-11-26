"use client";
import { useState } from "react";
import { useEstudioGenio, useInformeGenio } from "@/hooks/legal/useEstudioGenio";
import { descargarEstudio, errorGenio, noHabilitado, type Paquete } from "@/lib/legal/cases/estudio-genio-api";
import { EstudioGenioRevision } from "./EstudioGenioRevision";
import { MuestraGenio } from "./estudio-genio/MuestraGenio";
import { CabeceraGenio, genioButton, genioCard, genioField, genioLabel, genioPrimary, genioTitulo } from "./estudio-genio/estilo";
import { EstudioGenioCompras, useComprasGenio } from "./EstudioGenioCompras";
import m from "@/messages/es/legal-estudio-genio.json";
const phases = ["contexto", "estrategias", "simulacro", "evaluacion_cruzada", "profundidad"] as const;
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
        return <p role="status" className="p-6 text-[#3B4558]">{m.loading}</p>;
    const sinSaldo = Boolean(saldo && !saldo[paquete]?.disponible);
    const cabecera = <CabeceraGenio titulo={m.title} texto={m.about}/>;
    if (q.data?.habilitado === false || noHabilitado(q.error) || noHabilitado(error))
        return <div className="space-y-6">{cabecera}<section className={genioCard}><p role="status" className="font-medium">{m.disabled}</p></section>
      <MuestraGenio/>
      <EstudioGenioCompras tenantId={tenantId}/></div>;
    if (!q.data || q.error)
        return <div className="space-y-6">{cabecera}<div role="alert" className={`${genioCard} flex flex-wrap items-center gap-3 text-[#8E2C3A]`}>{errorGenio(q.error)} <button className={genioButton} onClick={() => void q.refetch()}>{m.retry}</button></div></div>;
    const partes = (p: Paquete) => m.packages[p].split(" · ");
    return <section aria-label={m.title} className="space-y-6 text-[#17233A]">
    {cabecera}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
      <div className={`${genioCard} space-y-5`}>
        <h2 className={genioTitulo}>{m.request}</h2>
        <fieldset disabled={running || q.request.isPending || confirming} className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">{m.package}</legend>
          {(["completo", "esencial"] as const).map((value) => {
                const [nombre, detalle, precio] = partes(value);
                const elegido = paquete === value;
                const oscuro = value === "completo";
                return <label key={value} className={`relative cursor-pointer rounded-xl border p-5 transition-shadow ${oscuro ? "border-[#22324D] bg-[#17233A] text-white" : "border-[#E3E7EE] bg-white text-[#17233A]"} ${elegido ? "ring-2 ring-[#B58A3C] ring-offset-2" : "hover:shadow-[0_12px_28px_-18px_rgba(23,35,58,0.55)]"}`}>
              <input type="radio" name="paquete" value={value} checked={elegido} onChange={() => setPaquete(value)} aria-label={m.packages[value]} className="sr-only"/>
              <span className={`block text-sm font-medium ${oscuro ? "text-[#D9BC82]" : "text-[#8A6A2C]"}`}>{nombre}</span>
              <span className="mt-2 block font-display text-[2rem] font-semibold leading-none">{precio}</span>
              <span className={`mt-3 block text-sm ${oscuro ? "text-slate-300" : "text-[#3B4558]"}`}>{detalle}</span>
              {elegido && <span aria-hidden className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#B58A3C]"/>}
            </label>;
            })}
        </fieldset>
        <label className={genioLabel}>{m.pedido}<textarea rows={3} className={genioField} value={pedido} disabled={running || confirming || q.request.isPending} onChange={(e) => setPedido(e.target.value)}/></label>
        {sinSaldo && <p role="status" className="text-sm font-medium text-[#8E2C3A]">{m.compras.sinSaldoPedir}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={genioPrimary} disabled={running || sinSaldo || q.request.isPending || confirming} onClick={() => { setError(null); setConfirming(true); }}>{study?.estado === "fallido" || study?.estado === "interrumpido" ? m.again : m.request}</button>
          {notice && <p role="status" className="text-sm font-medium text-[#2F6B4F]">{notice}</p>}
        </div>
        {confirming && <div role="group" aria-label={m.confirmRequest} className="space-y-3 rounded-xl border border-[#B58A3C] bg-[#FBF7EE] p-4"><p className="text-sm text-[#3B4558]">{m.confirmRequest}</p><p className="font-display text-lg font-semibold">{m.packages[paquete]}</p>
          <div className="flex flex-wrap gap-3"><button type="button" className={genioPrimary} disabled={running || q.request.isPending} onClick={() => void request()}>{q.request.isPending ? m.busy : m.confirm}</button>
          <button type="button" className={genioButton} disabled={q.request.isPending} onClick={() => setConfirming(false)}>{m.cancel}</button></div></div>}
        {error && <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{errorGenio(error)}</p>}
      </div>
      <EstudioGenioCompras tenantId={tenantId}/>
    </div>
    {studies.length > 0 && <label className={`${genioLabel} max-w-xl`}>{m.history}<select className={genioField} value={study?.estudio_id ?? ""} onChange={(e) => { setSelected(e.target.value); setError(null); }}>
      {studies.map((s) => <option key={s.estudio_id} value={s.estudio_id}>{date(s.iniciado)} · {m.packages[s.paquete]} · {m.states[s.estado]} · {s.revision ? `${m.decisions[s.revision.estado]}: ${s.revision.firmante}` : m.noSignature}</option>)}</select></label>}
    {study && <div className={`${genioCard} space-y-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className={genioTitulo}>{m.states[study.estado]}</h3>
        {study.estado === "en_curso" && <p role="status" className="text-sm text-[#3B4558]">{m.waiting}</p>}</div>
      <ol className="grid gap-4 sm:grid-cols-5">{phases.map((phase, i) => {
                const arrived = study.fases?.find((f) => f.fase === phase);
                return <li key={phase} className="relative pt-5">
          <span aria-hidden className={`absolute left-0 right-0 top-[9px] h-px ${i === 0 ? "left-1/2" : ""} ${i === phases.length - 1 ? "right-1/2" : ""} bg-[#E3E7EE]`}/>
          <span aria-hidden className={`absolute left-1/2 top-0 h-[19px] w-[19px] -translate-x-1/2 rounded-full border-2 ${arrived ? "border-[#B58A3C] bg-[#B58A3C]" : "border-[#C9CFDA] bg-white"}`}/>
          <div className="mt-3 text-center"><p className="font-semibold">{m.phases[phase]}</p><p className={`text-sm ${arrived ? "text-[#2F6B4F]" : "text-slate-500"}`}>{arrived ? m.done : m.pending}</p>
          {arrived && <time dateTime={arrived.cuando} className="block text-xs text-slate-500">{date(arrived.cuando)}</time>}</div></li>;
            })}</ol>
      {(study.estado === "fallido" || study.estado === "interrumpido") && <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{study.motivo || m.noReason}</p>}
      {study.estado === "completado" && <>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3E7EE] pt-5"><h3 className={genioTitulo}>{m.report}</h3>
          <button type="button" className={genioPrimary} disabled={downloading} onClick={() => void download()}>{m.pdf}</button></div>
        {report.isPending ? <p role="status">{m.loading}</p> : report.error ? <p role="alert" className="text-[#8E2C3A]">{errorGenio(report.error)} <button className={genioButton} onClick={() => void report.refetch()}>{m.retry}</button></p> : <iframe title={m.report} sandbox="" referrerPolicy="no-referrer" className="min-h-[720px] w-full rounded-xl border border-[#E3E7EE] bg-white shadow-[0_24px_48px_-32px_rgba(23,35,58,0.45)]" srcDoc={`<style>${CSS_INFORME}</style>${report.data ?? ""}`}/>}
        <EstudioGenioRevision key={study.estudio_id} previous={study.revision} busy={q.review.isPending} onSave={(body) => q.review.mutateAsync({ estudioId: study.estudio_id, body })}/>
      </>}
    </div>}
  </section>;
}

/** El informe se lee como un escrito: serif en títulos, márgenes amplios, tablas sobrias. */
const CSS_INFORME = "body{font:16px/1.65 -apple-system,'Segoe UI',system-ui,sans-serif;color:#17233A;background:#fff;margin:0;padding:40px 48px;max-width:920px}"
    + "h1,h2,h3{font-family:Georgia,'Times New Roman',serif;color:#17233A;line-height:1.25}h1{font-size:28px;margin:0 0 6px}"
    + "h2{font-size:21px;margin:32px 0 10px;padding-top:18px;border-top:1px solid #E3E7EE}h3{font-size:17px}"
    + ".estado{color:#8A6A2C;font-weight:600}.aviso{background:#F5F7FA;border-left:3px solid #B58A3C;padding:12px 16px}"
    + "table{border-collapse:collapse;width:100%;font-size:14px}th{background:#F5F7FA;text-align:left;font-weight:600}"
    + "td,th{border:1px solid #E3E7EE;padding:8px 10px;vertical-align:top}li{margin:4px 0}";
