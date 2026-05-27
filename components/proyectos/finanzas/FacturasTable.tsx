"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/forge";
import { AmountDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import { FinanzasStatusBadge } from "@/components/proyectos/finanzas/StatusBadge";
import type { Factura } from "@/types/finanzas";

export function FacturasTable({
  rows,
  onView,
  onApprove,
  onReject,
}: {
  rows: Factura[];
  onView: (f: Factura) => void;
  onApprove: (f: Factura) => void;
  onReject: (f: Factura) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-[900px] w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-3">Número</th>
            <th className="px-4 py-3">Contratista</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Monto</th>
            <th className="px-4 py-3">Validación</th>
            <th className="px-4 py-3">Pago</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-mono text-xs">{f.numero_factura}</td>
              <td className="px-4 py-3">{f.contratista_nombre}</td>
              <td className="px-4 py-3 text-zinc-400">{f.fecha_emision}</td>
              <td className="px-4 py-3"><AmountDisplay amount={f.monto_total_usd} /></td>
              <td className="px-4 py-3"><FinanzasStatusBadge status={f.validation_status} /></td>
              <td className="px-4 py-3"><FinanzasStatusBadge status={f.payment_status} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onView(f)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {f.validation_status === "needs_pm_review" || f.validation_status === "received" ? (
                    <>
                      <Button type="button" variant="secondary" size="sm" onClick={() => onApprove(f)}>
                        Aprobar
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => onReject(f)}>
                        Rechazar
                      </Button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
