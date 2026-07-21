"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import { listFinancingLeads } from "@/lib/autos-portal/api";
import {
  commissionsToCsv,
  filterCommissionsByDateRange,
  filterCommissionsByDealer,
  financingLeadToCommissionRow,
} from "@/lib/autos-portal/commission-calc";
import type { CommissionRow } from "@/lib/autos-portal/admin-types";
import { COMMISSION_RATE } from "@/lib/autos-portal/admin-types";
import { fmtRD } from "@/lib/format";
import { Button } from "@/components/ui/button";

function parseDateInput(value: string): number | null {
  if (!value) return null;
  const t = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(t) ? null : t;
}

function endOfDayMs(value: string): number | null {
  const start = parseDateInput(value);
  if (start == null) return null;
  return start + 86_399_999;
}

export function CommissionTracker() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dealerFilter, setDealerFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const leads = await listFinancingLeads();
      const financed = leads.filter((l) => l.status === "FINANCED");
      setRows(
        financed.map((l) =>
          financingLeadToCommissionRow(l, l.tenant_id.slice(0, 8)),
        ),
      );
      setDemoMode(false);
    } catch {
      setRows([]);
      setDemoMode(true);
      toast.error("No se pudieron cargar comisiones — backend leads no disponible");
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    let out = filterCommissionsByDateRange(
      rows,
      parseDateInput(startDate),
      endOfDayMs(endDate),
    );
    out = filterCommissionsByDealer(out, dealerFilter.trim() || null);
    return out;
  }, [rows, startDate, endDate, dealerFilter]);

  const totalCommission = useMemo(
    () => filtered.reduce((s, r) => s + r.commission_amount, 0),
    [filtered],
  );

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("Sin datos para exportar");
      return;
    }
    const csv = commissionsToCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "autos-commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">Comisiones (solo lectura)</h2>
        <DemoModeBadge visible={demoMode} />
        <span className="text-xs text-gray-500">
          Tasa MVP: {(COMMISSION_RATE * 100).toFixed(0)}% del monto solicitado · leads FINANCED
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          aria-label="Desde"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          aria-label="Hasta"
        />
        <input
          type="text"
          value={dealerFilter}
          onChange={(e) => setDealerFilter(e.target.value)}
          placeholder="Dealer ID"
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
        <Button type="button" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? "Cargando…" : "Buscar"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <p className="mb-3 text-sm font-semibold text-gray-700">
        Total comisión filtrada: {fmtRD(totalCommission)}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-2">Lead ID</th>
              <th className="p-2">Vehículo</th>
              <th className="p-2">Monto</th>
              <th className="p-2">Comisión</th>
              <th className="p-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  {loading ? "Cargando…" : "Sin deals financiados en el rango"}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.lead_id} className="border-b last:border-0">
                  <td className="p-2 font-mono text-xs">{c.lead_id}</td>
                  <td className="p-2">{c.vehicle_name}</td>
                  <td className="p-2 tabular-nums">{fmtRD(c.requested_amount)}</td>
                  <td className="p-2 tabular-nums font-semibold text-green-700">
                    {fmtRD(c.commission_amount)}
                  </td>
                  <td className="p-2 text-gray-600">
                    {new Date(c.created_at).toLocaleDateString("es-DO")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
