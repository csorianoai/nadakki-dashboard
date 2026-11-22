"use client";

import { useState } from "react";
import { putCaseRepresentation, REPRESENTACIONES, type Representacion } from "@/lib/legal/cases/legal-cases-api";
import { mensajeDeError } from "@/lib/legal/cases/mensajes-error";

export const ETIQUETA_REPRESENTACION: Record<Representacion, string> = {
  demandante: "Demandante",
  demandado: "Demandado",
  tercero_interviniente: "Tercero interviniente",
  querellante: "Querellante",
  imputado: "Imputado",
  otro: "Otro",
  desconocido: "Aún no se sabe",
};

type Props = { tenantId: string; caseId: string; clientRoles: string[] | undefined; onSaved: () => void };

/** «¿A quién representa el despacho?»: postura procesal del cliente en este expediente. */
export function CaseRepresentationCard({ tenantId, caseId, clientRoles, onSaved }: Props) {
  const actual = (clientRoles ?? []).find((r): r is Representacion => (REPRESENTACIONES as readonly string[]).includes(r)) ?? null;
  const [valor, setValor] = useState<Representacion | "">(actual ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!valor) return;
    setGuardando(true);
    setError(null);
    try {
      await putCaseRepresentation(tenantId, caseId, valor);
      onSaved();
    } catch (e) {
      setError(mensajeDeError(e, "representacion"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-labelledby="titulo-representacion" className="rounded-xl border border-slate-200 bg-white p-4" data-testid="representacion">
      <h2 id="titulo-representacion" className="text-sm font-semibold text-slate-900">¿A quién representa el despacho?</h2>
      {actual && actual !== "desconocido" ? (
        <p className="mt-1 text-sm text-slate-700">Representamos a la parte <strong>{ETIQUETA_REPRESENTACION[actual].toLowerCase()}</strong>.</p>
      ) : (
        <p className="mt-1 text-sm text-amber-800">Sin confirmar. Hasta definirlo no se deben calcular plazos de defensa ni de acción.</p>
      )}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-sm font-medium text-slate-700">
          Postura del cliente
          <select value={valor} onChange={(e) => setValor(e.target.value as Representacion)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
            <option value="" disabled>Elegir…</option>
            {REPRESENTACIONES.map((r) => <option key={r} value={r}>{ETIQUETA_REPRESENTACION[r]}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => void guardar()} disabled={!valor || valor === actual || guardando}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
