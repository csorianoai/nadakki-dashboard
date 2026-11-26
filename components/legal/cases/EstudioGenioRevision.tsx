"use client";
import { useState } from "react";
import { errorGenio, type Correccion, type Firma, type Revision } from "@/lib/legal/cases/estudio-genio-api";
import m from "@/messages/es/legal-estudio-genio.json";
export const genioField = "block w-full rounded border border-slate-400 bg-white p-2 text-slate-900";
export const genioButton = "rounded border border-blue-700 bg-white px-4 py-2 font-medium text-blue-800 disabled:opacity-50";
export function EstudioGenioRevision({ previous, busy, onSave }: {
    previous?: Revision;
    busy: boolean;
    onSave: (body: Firma) => Promise<unknown>;
}) {
    const [firmante, setFirmante] = useState(previous?.firmante ?? "");
    const [colegiatura, setColegiatura] = useState(previous?.colegiatura ?? "");
    const [notas, setNotas] = useState(previous?.notas ?? "");
    const [correcciones, setCorrecciones] = useState<Correccion[]>(previous?.correcciones ?? []);
    const [pending, setPending] = useState<Firma["decision"] | null>(null);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const valid = () => Boolean(firmante.trim()) && correcciones.every((c) => c.texto.trim());
    const confirm = (decision: Firma["decision"]) => { setError(""); setSaved(false); if (!valid())
        setError(m.required);
    else
        setPending(decision); };
    const save = async () => {
        if (!pending || busy || !valid())
            return;
        try {
            await onSave({ decision: pending, firmante: firmante.trim(), colegiatura: colegiatura.trim() || undefined, notas: notas.trim() || undefined,
                correcciones: correcciones.map((c) => ({ tema: c.tema, texto: c.texto.trim() })) });
            setPending(null);
            setSaved(true);
        }
        catch (e) {
            setPending(null);
            setError(errorGenio(e));
        }
    };
    return <section className="space-y-4 rounded border border-slate-300 bg-white p-4 text-slate-900">
    <h3 className="font-semibold">{m.reviewTitle}</h3><p className="rounded bg-blue-50 p-3 text-sm">{m.reviewNotice}</p>
    {previous && <div className="space-y-1 border-l-4 border-blue-600 pl-3"><p>{m.decisions[previous.estado]} · {previous.firmante} · {previous.fecha ? new Date(previous.fecha).toLocaleString("es") : m.noDate}</p>
      {previous.colegiatura && <p>{m.license}: {previous.colegiatura}</p>}{previous.notas && <p>{previous.notas}</p>}
      <ul>{previous.correcciones?.map((c, i) => <li key={i}>{m.topics[c.tema as keyof typeof m.topics] ?? m.topics.otro}: {c.texto}</li>)}</ul></div>}
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-3">
      <fieldset disabled={busy || Boolean(pending)} className="space-y-3">
        <label className="block">{m.signer}<input className={genioField} value={firmante} required onChange={(e) => setFirmante(e.target.value)}/></label>
        <label className="block">{m.license}<input className={genioField} value={colegiatura} onChange={(e) => setColegiatura(e.target.value)}/></label>
        <label className="block">{m.notes}<textarea className={genioField} value={notas} onChange={(e) => setNotas(e.target.value)}/></label>
        {correcciones.map((c, i) => <div key={i} className="grid gap-2 rounded border p-3 sm:grid-cols-2">
          <label>{m.topic}<select className={genioField} value={c.tema} onChange={(e) => setCorrecciones((rows) => rows.map((r, n) => n === i ? { ...r, tema: e.target.value } : r))}>
            {Object.entries(m.topics).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>{m.correction}<textarea className={genioField} value={c.texto} required onChange={(e) => setCorrecciones((rows) => rows.map((r, n) => n === i ? { ...r, texto: e.target.value } : r))}/></label>
          <button type="button" className={genioButton} onClick={() => setCorrecciones((rows) => rows.filter((_, n) => n !== i))}>{m.removeCorrection}</button></div>)}
        <button type="button" className={genioButton} onClick={() => setCorrecciones((rows) => [...rows, { tema: "otro", texto: "" }])}>{m.addCorrection}</button>
        <div className="flex flex-wrap gap-3"><button type="button" className={genioButton} onClick={() => confirm("aprobado")}>{m.approve}</button>
          <button type="button" className={genioButton} onClick={() => confirm("rechazado")}>{m.reject}</button></div>
      </fieldset>
      {pending && <div role="group" aria-label={m.confirmReview} className="space-y-2 rounded border border-blue-500 bg-blue-50 p-3">
        <p>{m.confirmReview}</p><p>{m.decisions[pending]} · {firmante}</p>
        <button type="button" className={genioButton} disabled={busy} onClick={() => void save()}>{busy ? m.busy : m.confirm}</button>{" "}
        <button type="button" className={genioButton} disabled={busy} onClick={() => setPending(null)}>{m.cancel}</button></div>}
    </form>{error && <p role="alert">{error}</p>}{saved && <p role="status">{m.saved}</p>}
  </section>;
}
