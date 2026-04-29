import type { DecisionBlock } from "@/lib/legal-api";

export function DecisionBadge({ decision }: { decision: DecisionBlock }) {
  const config = {
    aprobar: { color: "bg-green-100 text-green-900 border-green-300", label: "Aprobar" },
    rechazar: { color: "bg-red-100 text-red-900 border-red-300", label: "Rechazar" },
    revision: { color: "bg-amber-100 text-amber-900 border-amber-300", label: "Requiere revisión" },
  } as const;
  const c = config[decision.accion];
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${c.color}`}
    >
      {c.label} · confianza {Math.round(decision.confianza * 100)}%
    </span>
  );
}
