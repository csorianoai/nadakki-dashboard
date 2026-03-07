"use client";

import { useState } from "react";
import type { Expediente } from "@/lib/api/sic";

interface PanelDecisionOverrideProps {
  expediente: Expediente;
  puedeOverride: boolean;
  onOverride: (decision: string, justificacion: string) => Promise<void>;
}

export function PanelDecisionOverride({
  expediente,
  puedeOverride,
  onOverride,
}: PanelDecisionOverrideProps) {
  const [decision, setDecision] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  const hayOverride = Boolean(expediente.decision_final_humana && expediente.decision_final_humana !== expediente.decision_actual);

  const handleSubmit = async () => {
    if (!decision.trim() || !justificacion.trim()) return;
    setEnviando(true);
    setExito(null);
    try {
      await onOverride(decision.trim(), justificacion.trim());
      setExito("Decisión registrada correctamente.");
      setDecision("");
      setJustificacion("");
    } catch {
      setExito(null);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500 block">Decisión IA</span>
          <span className="text-slate-200 font-medium">{expediente.decision_actual ?? "—"}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Confianza</span>
          <span className="text-slate-200 font-medium">{expediente.confianza_decision ?? "—"}</span>
        </div>
      </div>
      {expediente.decision_final_humana && (
        <div className="border-t border-slate-700/80 pt-2">
          <span className="text-slate-500 text-xs block">Decisión final</span>
          <span className="text-emerald-300 font-medium">{expediente.decision_final_humana}</span>
          {expediente.override_usuario && (
            <p className="text-slate-500 text-xs mt-1">Por: {expediente.override_usuario}</p>
          )}
          {hayOverride && expediente.override_justificacion && (
            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-200">
              Justificación override: {expediente.override_justificacion}
            </div>
          )}
        </div>
      )}
      {puedeOverride && !expediente.decision_final_humana && (
        <div className="border-t border-slate-700/80 pt-2 space-y-2">
          <label className="block text-slate-500 text-xs">Decisión final</label>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-xs"
          >
            <option value="">Seleccionar…</option>
            <option value="APROBADO">APROBADO</option>
            <option value="RECHAZADO">RECHAZADO</option>
          </select>
          <label className="block text-slate-500 text-xs">Justificación (obligatoria)</label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            placeholder="Justificación del override..."
            rows={3}
            className="w-full bg-slate-800/80 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-xs resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={enviando || !decision || !justificacion.trim()}
            className="w-full rounded px-3 py-1.5 bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Registrar decisión"}
          </button>
        </div>
      )}
      {puedeOverride && expediente.decision_final_humana && (
        <p className="text-slate-500 text-xs">Decisión ya registrada.</p>
      )}
      {!puedeOverride && (
        <p className="text-slate-500 text-xs">Sin permiso para registrar decisión (ver Controles del expediente).</p>
      )}
      {exito && (
        <div className="rounded border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
          {exito}
        </div>
      )}
    </div>
  );
}
