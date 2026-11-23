"use client";

import { useState } from "react";
import { patchCaseFacts } from "@/lib/legal/cases/legal-cases-api";
import { LegalApiHttpError } from "@/lib/legal/parse-api-error";

const campo =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

/**
 * Hechos del caso (QA 23-nov-2026): las estrategias y los escritos con IA los
 * necesitan, y después de crear el expediente no había dónde escribirlos.
 * Cada cambio pide un motivo y queda en la línea de tiempo.
 */
export function CaseFactsCard({
  tenantId,
  caseId,
  description,
  onSaved,
}: {
  tenantId: string;
  caseId: string;
  description?: string | null;
  onSaved?: () => void;
}) {
  const actual = (description ?? "").trim();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(actual);
  const [motivo, setMotivo] = useState(actual ? "" : "Se registran los hechos del caso");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (texto.trim().length < 20) {
      setError("Escribe al menos una o dos frases con los hechos (20 caracteres o más).");
      return;
    }
    if (motivo.trim().length < 5) {
      setError("Indica el motivo del cambio (queda en la línea de tiempo).");
      return;
    }
    setGuardando(true);
    try {
      await patchCaseFacts(tenantId, caseId, texto.trim(), motivo.trim());
      setEditando(false);
      onSaved?.();
    } catch (err) {
      const http = err instanceof LegalApiHttpError ? err : null;
      setError(
        http?.status === 403
          ? "Tu rol no permite cambiar los hechos de este expediente."
          : http
            ? http.detail || `No se pudo guardar (HTTP ${http.status}).`
            : "No hubo respuesta del servidor. No se guardó nada.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-labelledby="hechos-del-caso" className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="hechos-del-caso" className="text-sm font-semibold text-forgeGray-900">Hechos del caso</h2>
        {!editando ? (
          <button
            type="button"
            onClick={() => {
              setTexto(actual);
              setEditando(true);
            }}
            className="rounded-forge-sm border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50"
          >
            {actual ? "Editar" : "Escribir los hechos"}
          </button>
        ) : null}
      </div>
      {!editando ? (
        actual ? (
          <p className="mt-2 whitespace-pre-line text-sm text-forgeGray-800">{actual}</p>
        ) : (
          <p className="mt-2 text-sm text-amber-800">
            Aún no hay hechos. Sin ellos, las estrategias con IA no se pueden generar.
          </p>
        )
      ) : (
        <form onSubmit={guardar} className="mt-2 space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            Hechos
            <textarea className={campo} rows={5} maxLength={8000} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Motivo del cambio
            <input className={campo} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </label>
          {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
          <div className="flex gap-2">
            <button type="submit" disabled={guardando} className="rounded-forge-sm bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {guardando ? "Guardando…" : "Guardar hechos"}
            </button>
            <button type="button" onClick={() => setEditando(false)} className="rounded-forge-sm border border-slate-300 bg-white px-3 py-1.5 text-xs">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
