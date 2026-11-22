"use client";

import { useEffect, useRef, useState } from "react";
import { addCaseActor, type AddActorBody } from "@/lib/legal/cases/legal-cases-api";
import { mensajeDeError } from "@/lib/legal/cases/mensajes-error";

/** Papeles procesales ofrecidos al agregar una parte (subconjunto del CHECK del backend). */
export const PAPELES: { value: string; label: string }[] = [
  { value: "contraparte", label: "Contraparte (la otra parte del litigio)" },
  { value: "abogado_contraparte", label: "Abogado de la contraparte" },
  { value: "cliente", label: "Otro cliente representado" },
  { value: "querellante", label: "Querellante" },
  { value: "imputado", label: "Imputado" },
  { value: "tribunal", label: "Tribunal" },
  { value: "alguacil", label: "Alguacil" },
  { value: "testigo", label: "Testigo" },
  { value: "perito", label: "Perito" },
  { value: "ministerio_publico", label: "Ministerio Público" },
  { value: "otro", label: "Otro interviniente" },
];

const input =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

type Props = { tenantId: string; caseId: string; onDone: () => void; onCancel: () => void };

/** Formulario para agregar una parte a un expediente ya creado. Confirma solo tras el 201. */
export function AddPartyForm({ tenantId, caseId, onDone, onCancel }: Props) {
  const [f, setF] = useState<AddActorBody>({ role: "contraparte", actor_kind: "persona_juridica", full_name: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  useEffect(() => nombreRef.current?.focus(), []);

  const set = <K extends keyof AddActorBody>(k: K, v: AddActorBody[K]) => setF((x) => ({ ...x, [k]: v }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (f.full_name.trim().length < 2) {
      setError("Escribe el nombre de la parte.");
      nombreRef.current?.focus();
      return;
    }
    setEnviando(true);
    try {
      await addCaseActor(tenantId, caseId, f);
      setOk(`${f.full_name.trim()} quedó agregada al expediente.`);
      onDone();
    } catch (err) {
      setError(mensajeDeError(err, "parte"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} aria-labelledby="titulo-agregar-parte" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4" data-testid="form-agregar-parte">
      <h3 id="titulo-agregar-parte" className="text-sm font-semibold text-slate-900">Agregar parte</h3>
      <label className="block text-sm font-medium text-slate-700">
        Nombre completo o razón social *
        <input ref={nombreRef} required value={f.full_name} onChange={(e) => set("full_name", e.target.value)} className={input} maxLength={255} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Tipo de persona *
          <select value={f.actor_kind} onChange={(e) => set("actor_kind", e.target.value as AddActorBody["actor_kind"])} className={input}>
            <option value="persona_fisica">Persona física</option>
            <option value="persona_juridica">Persona jurídica (empresa)</option>
            <option value="institucion">Institución</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Papel procesal *
          <select value={f.role} onChange={(e) => set("role", e.target.value)} className={input}>
            {PAPELES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Identificación (cédula, RNC o pasaporte)
          <input value={f.identification_number ?? ""} onChange={(e) => set("identification_number", e.target.value)} className={input} maxLength={64} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Correo electrónico
          <input type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} className={input} maxLength={255} />
        </label>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {ok ? <p role="status" className="text-sm text-emerald-700">{ok}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
          {enviando ? "Guardando…" : "Guardar parte"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Cancelar</button>
      </div>
    </form>
  );
}
