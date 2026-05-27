import GlassCard from "@/components/ui/GlassCard";
import { AmountDisplay, VarianceDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import type { FinanceOverviewKpis } from "@/types/finanzas";

const KPI_DEFS: { key: keyof FinanceOverviewKpis; label: string; isVariance?: boolean }[] = [
  { key: "presupuesto_total_usd", label: "Presupuesto total" },
  { key: "capex_aprobado_usd", label: "CAPEX aprobado" },
  { key: "opex_aprobado_usd", label: "OPEX aprobado" },
  { key: "comprometido_usd", label: "Comprometido" },
  { key: "facturado_usd", label: "Facturado" },
  { key: "pagado_usd", label: "Pagado" },
  { key: "saldo_pendiente_usd", label: "Saldo pendiente" },
  { key: "variance_pct", label: "Variance", isVariance: true },
];

export function FinanceOverviewCards({ kpis }: { kpis: FinanceOverviewKpis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_DEFS.map(({ key, label, isVariance }) => (
        <GlassCard key={key} hover={false} className="border border-white/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-2 text-xl">
            {isVariance ? (
              <VarianceDisplay pct={kpis[key] as number} />
            ) : (
              <AmountDisplay amount={kpis[key] as number} emphasize />
            )}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
