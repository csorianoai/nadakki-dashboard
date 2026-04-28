"use client";

import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import type { SavedScenario } from "@/lib/credit-hub/hooks/useScenarioStore";

interface Props {
  scenarios: SavedScenario[];
  title: string;
  clearLabel: string;
  removeLabel: string;
  columns: {
    name: string;
    price: string;
    down: string;
    term: string;
    payment: string;
    dti: string;
    ltv: string;
    roi: string;
    status: string;
  };
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function ScenarioComparison({ scenarios, title, clearLabel, removeLabel, columns, onRemove, onClearAll }: Props) {
  if (!scenarios.length) return null;

  return (
    <div className="rounded-2xl border border-forge-border bg-forge-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-forge-text">{title}</h3>
        <ForgeButton variant="secondary" size="sm" type="button" onClick={onClearAll}>
          {clearLabel}
        </ForgeButton>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-forge-border text-forge-text-muted">
              <th className="py-2 pr-2">{columns.name}</th>
              <th className="py-2 pr-2">{columns.price}</th>
              <th className="py-2 pr-2">{columns.down}</th>
              <th className="py-2 pr-2">{columns.term}</th>
              <th className="py-2 pr-2">{columns.payment}</th>
              <th className="py-2 pr-2">{columns.dti}</th>
              <th className="py-2 pr-2">{columns.ltv}</th>
              <th className="py-2 pr-2">{columns.roi}</th>
              <th className="py-2 pr-2">{columns.status}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.id} className="border-b border-forge-border/60 text-forge-text">
                <td className="py-2 pr-2 font-medium">{s.name}</td>
                <td className="py-2 pr-2 tabular-nums">{Math.round(s.inputs.vehiclePrice).toLocaleString("es-DO")}</td>
                <td className="py-2 pr-2 tabular-nums">{Math.round(s.inputs.downPayment).toLocaleString("es-DO")}</td>
                <td className="py-2 pr-2">{s.inputs.termMonths}</td>
                <td className="py-2 pr-2 tabular-nums">{Math.round(s.result.estimatedPayment).toLocaleString("es-DO")}</td>
                <td className="py-2 pr-2 tabular-nums">{s.result.dti.toFixed(1)}%</td>
                <td className="py-2 pr-2 tabular-nums">{s.result.ltv.toFixed(1)}%</td>
                <td className="py-2 pr-2 tabular-nums">{s.result.grossROI.toFixed(1)}</td>
                <td className="py-2 pr-2">{s.result.badge.label}</td>
                <td className="py-2">
                  <ForgeButton variant="ghost" size="sm" type="button" onClick={() => onRemove(s.id)}>
                    {removeLabel}
                  </ForgeButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
