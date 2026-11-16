"use client";

/**
 * Registro de agentes (GET /api/v1/system/agents/summary): solo para platform_superadmin. El hook vive aquí, en
 * componentes que solo se montan para el superadmin; el resto de usuarios no lo llama ni ve su aviso.
 */
import { createContext, useContext, type ReactNode } from "react";
import { useAgentRegistrySummary, type AgentRegistrySummaryState } from "@/app/hooks/useAgentRegistrySummary";
import { AgentRegistryStatHome } from "@/components/agent-registry/AgentRegistryStatHome";

const Ctx = createContext<AgentRegistrySummaryState | null>(null);

export function RegistroAgentesProvider({ children }: { children: ReactNode }) {
  const reg = useAgentRegistrySummary();
  return <Ctx.Provider value={reg}>{children}</Ctx.Provider>;
}

export function AvisoRegistroAgentes() {
  const reg = useContext(Ctx);
  if (!reg) return null;
  return (
    <>
      {reg.available && <span className="text-xs text-gray-500">Agent Registry</span>}
      {!reg.loading && !reg.available && (
        <span className="text-xs text-amber-400/90" title={reg.tooltip}>
          Agent Registry unavailable
        </span>
      )}
    </>
  );
}

export function EstadisticaAgentes() {
  const reg = useContext(Ctx);
  if (!reg) return null;
  return <AgentRegistryStatHome loading={reg.loading} available={reg.available} summary={reg.summary} tooltip={reg.tooltip} />;
}
