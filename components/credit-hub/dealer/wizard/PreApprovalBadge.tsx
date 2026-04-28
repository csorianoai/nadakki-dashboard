import type { PreApprovalResult } from "@/lib/credit/simulation/preapproval-base";

interface Props {
  result: PreApprovalResult;
}

const colorMap = {
  emerald: "bg-emerald-500/10 border-emerald-500/40 text-emerald-300",
  amber: "bg-amber-500/10 border-amber-500/40 text-amber-300",
  rose: "bg-rose-500/10 border-rose-500/40 text-rose-300",
} as const;

export function PreApprovalBadge({ result }: Props) {
  const tone = result.badge.color as keyof typeof colorMap;

  return (
    <div
      role="status"
      data-testid="preapproval-badge"
      className={`flex flex-col gap-2 rounded-xl border p-4 ${colorMap[tone]}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{result.badge.icon}</span>
        <span className="text-base font-semibold">Pre-evaluación: {result.badge.label}</span>
      </div>
      <ul className="space-y-1 text-xs">
        {result.reasons.map((r, i) => (
          <li key={i}>• {r}</li>
        ))}
      </ul>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs tabular-nums">
        <div>DTI: {result.dti.toFixed(1)}%</div>
        <div>Cuota: {result.estimatedPayment.toFixed(0)}</div>
        <div>Capacidad: {result.paymentCapacity.toFixed(0)}</div>
      </div>
    </div>
  );
}
