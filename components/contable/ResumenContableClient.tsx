"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Loader2,
  BookOpen,
  CalendarRange,
  FilePenLine,
  BookMarked,
  Scale,
  TrendingUp,
  PieChart,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  ContableApiError,
  getBalanceComprobacion,
  listAsientos,
  listPeriodos,
} from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { PeriodoStatusBadge } from "@/components/contable/ContableBadges";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import type { AsientoContable, BalanceComprobacionReport, PeriodoContable } from "@/types/contable";
import { cn } from "@/lib/utils";

function fmt(n: number): string {
  return n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const QUICK_LINKS = [
  { href: "/contable/plan-cuentas", label: "Plan de Cuentas", icon: BookOpen },
  { href: "/contable/periodos", label: "Períodos", icon: CalendarRange },
  { href: "/contable/asientos/nuevo", label: "Nuevo Asiento", icon: FilePenLine },
  { href: "/contable/libro-mayor", label: "Libro Mayor", icon: BookMarked },
  { href: "/contable/balance-comprobacion", label: "Balance", icon: Scale },
  { href: "/contable/estado-resultados", label: "Estado Resultados", icon: TrendingUp },
  { href: "/contable/situacion-financiera", label: "Situación Financiera", icon: PieChart },
  { href: "/contable/monitor-gastos", label: "Monitor Gastos", icon: AlertTriangle },
  { href: "/contable/agente-ia", label: "Consultor IA", icon: Sparkles },
] as const;

// Generate simple sparkline data from a single value (simulated trend)
function sparklineData(value: number): { v: number }[] {
  const points = 7;
  return Array.from({ length: points }, (_, i) => ({
    v: value * (0.85 + Math.sin(i * 0.8) * 0.15),
  }));
}

export function ResumenContableClient() {
  const tenantId = useContableTenantId();
  const [loading, setLoading] = useState(true);
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [asientos, setAsientos] = useState<AsientoContable[]>([]);
  const [balance, setBalance] = useState<BalanceComprobacionReport | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const [pers, asts] = await Promise.all([
        listPeriodos(tenantId, year),
        listAsientos(tenantId).catch(() => [] as AsientoContable[]),
      ]);
      setPeriodos(pers);
      setAsientos(asts);

      // Try to get balance from the first period
      const openPeriod = pers.find((p) => p.status === "open") ?? pers[0];
      if (openPeriod) {
        try {
          setBalance(await getBalanceComprobacion(tenantId, openPeriod.id));
        } catch {
          // Balance may not be available
        }
      }
    } catch (e) {
      toast.error("Error cargando resumen", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const postedAsientos = asientos.filter((a) => a.status === "posted");
  const last5 = postedAsientos.slice(-5).reverse();
  const currentPeriod = periodos.find((p) => p.status === "open");

  // Derive KPIs from balance data
  const totalDebe = balance?.totals?.total_debe ?? 0;
  const totalHaber = balance?.totals?.total_haber ?? 0;
  const ingresoRows = balance?.rows?.filter((r) => r.tipo_cuenta === "ingreso") ?? [];
  const gastoRows = balance?.rows?.filter((r) => r.tipo_cuenta === "gasto") ?? [];
  const totalIngresos = ingresoRows.reduce((s, r) => s + Math.abs(r.saldo), 0);
  const totalGastos = gastoRows.reduce((s, r) => s + Math.abs(r.saldo), 0);
  const utilidadNeta = totalIngresos - totalGastos;

  if (loading) {
    return (
      <ContablePageShell title="Resumen Contable" description="Cargando..." icon={<LayoutDashboard className="h-10 w-10" />}>
        <div className="flex items-center gap-2 py-8 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando resumen...
        </div>
      </ContablePageShell>
    );
  }

  return (
    <ContablePageShell
      title="Resumen Contable"
      description="Vista general del módulo contable con KPIs y accesos rápidos."
      icon={<LayoutDashboard className="h-10 w-10" aria-hidden />}
    >
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ingresos del período", value: totalIngresos, color: "emerald" },
          { label: "Gastos del período", value: totalGastos, color: "rose" },
          { label: "Utilidad neta", value: utilidadNeta, color: "indigo" },
          { label: "Total debe", value: totalDebe, color: "amber" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={cn(
              "rounded-xl border bg-white/[0.02] p-4",
              color === "emerald" && "border-emerald-500/20",
              color === "rose" && "border-rose-500/20",
              color === "indigo" && "border-indigo-500/20",
              color === "amber" && "border-amber-500/20",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</p>
            <p className={cn(
              "mt-1 font-mono text-xl font-bold",
              color === "emerald" && "text-emerald-200",
              color === "rose" && "text-rose-200",
              color === "indigo" && "text-indigo-200",
              color === "amber" && "text-amber-200",
            )}>
              {fmt(value)}
            </p>
            <div className="mt-2 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData(value)}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={
                      color === "emerald" ? "#10b981" :
                      color === "rose" ? "#ef4444" :
                      color === "indigo" ? "#6366f1" :
                      "#f59e0b"
                    }
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Current period status */}
      {currentPeriod && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Período contable actual</p>
              <p className="text-sm font-bold text-white">{currentPeriod.label}</p>
              <p className="text-xs text-zinc-400">{currentPeriod.fecha_inicio} — {currentPeriod.fecha_fin}</p>
            </div>
            <PeriodoStatusBadge status={currentPeriod.status} />
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Last 5 posted asientos */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-sm font-bold text-white">Últimos asientos posteados</h3>
          {last5.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay asientos posteados aún.</p>
          ) : (
            <div className="space-y-2">
              {last5.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                  <div>
                    <p className="text-xs font-mono text-emerald-200">
                      {a.numero_asiento ?? a.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-zinc-400">{a.fecha} — {a.descripcion}</p>
                  </div>
                  <p className="text-xs font-mono text-white">{fmt(a.total_debe_base)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-sm font-bold text-white">Accesos rápidos</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-lg border border-white/5 px-3 py-2.5 text-xs text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-4 w-4 text-emerald-400" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ContablePageShell>
  );
}
