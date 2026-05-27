import GlassCard from "@/components/ui/GlassCard";
import { AmountDisplay, VarianceDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import type { BudgetVarianceReport } from "@/types/finanzas";

export function BudgetVariancePanel({ report }: { report: BudgetVarianceReport }) {
  const rows = [...report.rows, report.totals];
  return (
    <GlassCard hover={false} className="overflow-x-auto border border-white/10 p-4">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2">Categoría</th>
            <th className="px-3 py-2">Planificado</th>
            <th className="px-3 py-2">Comprometido</th>
            <th className="px-3 py-2">Facturado</th>
            <th className="px-3 py-2">Pagado</th>
            <th className="px-3 py-2">Variance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category} className="border-b border-white/5 text-zinc-200">
              <td className="px-3 py-3 font-medium">{row.category}</td>
              <td className="px-3 py-3"><AmountDisplay amount={row.planned_usd} /></td>
              <td className="px-3 py-3"><AmountDisplay amount={row.committed_usd} /></td>
              <td className="px-3 py-3"><AmountDisplay amount={row.invoiced_usd} /></td>
              <td className="px-3 py-3"><AmountDisplay amount={row.paid_usd} /></td>
              <td className="px-3 py-3"><VarianceDisplay pct={row.variance_pct} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}
