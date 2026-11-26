"use client";
import { useState } from "react";
import { errorGenio, type Correccion, type Firma, type Revision } from "@/lib/legal/cases/estudio-genio-api";
import m from "@/messages/es/legal-estudio-genio.json";
import { genioButton, genioCard, genioField, genioLabel, genioPrimary, genioTitulo } from "./estudio-genio/estilo";
export { genioButton, genioField };
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
    return <section className={`${genioCard} space-y-5`}>
    <h3 className={genioTitulo}>{m.reviewTitle}</h3><p className="rounded-lg border-l-2 border-[#B58A3C] bg-[#F5F7FA] px-4 py-3 text-sm text-[#3B4558]">{m.reviewNotice}</p>
    {previous && <div className={`space-y-1 border-l-2 pl-4 text-sm ${previous.estado === "aprobado" ? "border-[#2F6B4F]" : "border-[#8E2C3A]"}`}><p>{m.decisions[previous.estado]} · {previous.firmante} · {previous.fecha ? new Date(previous.fecha).toLocaleString("es") : m.noDate}</p>
      {previous.colegiatura && <p>{m.license}: {previous.colegiatura}</p>}{previous.notas && <p>{previous.notas}</p>}
      <ul>{previous.correcciones?.map((c, i) => <li key={i}>{m.topics[c.tema as keyof typeof m.topics] ?? m.topics.otro}: {c.texto}</li>)}</ul></div>}
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-3">
      <fieldset disabled={busy || Boolean(pending)} className="space-y-3">
        <label className={genioLabel}>{m.signer}<input className={genioField} value={firmante} required onChange={(e) => setFirmante(e.target.value)}/></label>
        <label className={genioLabel}>{m.license}<input className={genioField} value={colegiatura} onChange={(e) => setColegiatura(e.target.value)}/></label>
        <label className={genioLabel}>{m.notes}<textarea className={genioField} value={notas} onChange={(e) => setNotas(e.target.value)}/></label>
        {correcciones.map((c, i) => <div key={i} className="grid gap-3 rounded-xl border border-[#E3E7EE] bg-[#F5F7FA] p-4 sm:grid-cols-[200px_1fr_auto] sm:items-end">
          <label className={genioLabel}>{m.topic}<select className={genioField} value={c.tema} onChange={(e) => setCorrecciones((rows) => rows.map((r, n) => n === i ? { ...r, tema: e.target.value } : r))}>
            {Object.entries(m.topics).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className={genioLabel}>{m.correction}<textarea className={genioField} value={c.texto} required onChange={(e) => setCorrecciones((rows) => rows.map((r, n) => n === i ? { ...r, texto: e.target.value } : r))}/></label>
          <button type="button" className={genioButton} onClick={() => setCorrecciones((rows) => rows.filter((_, n) => n !== i))}>{m.removeCorrection}</button></div>)}
        <button type="button" className={genioButton} onClick={() => setCorrecciones((rows) => [...rows, { tema: "otro", texto: "" }])}>{m.addCorrection}</button>
        <div className="flex flex-wrap gap-3"><button type="button" className={genioPrimary} onClick={() => confirm("aprobado")}>{m.approve}</button>
          <button type="button" className={genioButton} onClick={() => confirm("rechazado")}>{m.reject}</button></div>
      </fieldset>
      {pending && <div role="group" aria-label={m.confirmReview} className="space-y-3 rounded-xl border border-[#B58A3C] bg-[#FBF7EE] p-4">
        <p>{m.confirmReview}</p><p>{m.decisions[pending]} · {firmante}</p>
        <button type="button" className={genioPrimary} disabled={busy} onClick={() => void save()}>{busy ? m.busy : m.confirm}</button>{" "}
        <button type="button" className={genioButton} disabled={busy} onClick={() => setPending(null)}>{m.cancel}</button></div>}
    </form>{error && <p role="alert" className="text-sm font-medium text-[#8E2C3A]">{error}</p>}{saved && <p role="status" className="text-sm font-medium text-[#2F6B4F]">{m.saved}</p>}
  </section>;
}
