"use client";

import { ChevronDown } from "lucide-react";

const AGENT_LABELS: Record<string, string> = {
  chat_asesor_legal: "Laboral senior",
  analizador_riesgo_contractual: "Riesgo contractual",
  validador_amlkyc: "AML/KYC",
  calculador_plazos_procesales: "Plazos procesales",
  validador_citas_legales: "Validador de citas",
  verificador_prescripcion: "Prescripción",
};

type Props = {
  agentId: string;
  onAgentChange: (id: string) => void;
  recentCount: number;
  onOpenRecent: () => void;
};

export function ResearchTopBar({ agentId, onAgentChange, recentCount, onOpenRecent }: Props) {
  return (
    <header className="lr-topbar" data-noprint>
      <h1 className="lr-topbar-title">Investigación legal</h1>
      <div className="lr-topbar-divider" aria-hidden />
      <div className="lr-agent-select">
        <span className="lr-agent-dot" aria-hidden />
        <span>Agente ·</span>
        <select
          id="legal-agent-select"
          aria-label="Seleccionar agente legal"
          value={agentId}
          onChange={(e) => onAgentChange(e.target.value)}
        >
          {Object.entries(AGENT_LABELS).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
          {!AGENT_LABELS[agentId] ? <option value={agentId}>{agentId}</option> : null}
        </select>
        <ChevronDown size={14} strokeWidth={1.9} aria-hidden />
      </div>
      <button type="button" className="lr-recent-btn" onClick={onOpenRecent}>
        Consultas recientes · {recentCount}
      </button>
    </header>
  );
}
