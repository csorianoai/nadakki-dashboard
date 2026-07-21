"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listFinancingLeads } from "@/lib/autos-portal/api";
import { fmtRD } from "@/lib/format";
import type { FinancingLead, FinancingLeadStatus } from "@/types/autos";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 30_000;

function statusClass(status: FinancingLeadStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500 text-white";
    case "FINANCED":
      return "bg-green-600 text-white";
    case "REJECTED":
      return "bg-red-600 text-white";
    case "EXPIRED":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

function statusLabel(status: FinancingLeadStatus): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "FINANCED":
      return "Financiado";
    case "REJECTED":
      return "Rechazado";
    case "EXPIRED":
      return "Expirado";
    default:
      return status;
  }
}

export default function MisLeadsPage() {
  const [leads, setLeads] = useState<FinancingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLeads = async () => {
      try {
        const data = await listFinancingLeads();
        if (!cancelled) {
          setLeads(data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar tus solicitudes.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchLeads();
    const interval = window.setInterval(() => {
      void fetchLeads();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-[22px] py-8">
        <p className="text-nk-fg-muted">Cargando solicitudes…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-[22px] py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">
            Mis Solicitudes de Financiamiento
          </h1>
          <p className="mt-1 text-sm text-nk-fg-muted">
            Historial de solicitudes y estado en Credit Hub
          </p>
        </div>
        <Link href="/autos/vehiculos" className="text-sm font-medium text-brand underline">
          Explorar vehículos
        </Link>
      </div>

      {error ? (
        <p className="rounded-r border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {!error && leads.length === 0 ? (
        <div className="rounded-r border border-nk-border bg-nk-surface p-8 text-center">
          <p className="text-nk-fg-muted">Sin solicitudes aún.</p>
          <Link
            href="/autos/vehiculos"
            className="mt-4 inline-block font-medium text-brand underline"
          >
            Buscar vehículos
          </Link>
        </div>
      ) : null}

      {leads.length > 0 ? (
        <div className="overflow-x-auto rounded-r border border-nk-border bg-nk-surface shadow-nk-sm">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-nk-border bg-nk-surface-2 text-left">
                <th className="p-3 font-semibold text-nk-fg">Vehículo</th>
                <th className="p-3 font-semibold text-nk-fg">Fecha</th>
                <th className="p-3 font-semibold text-nk-fg">Monto</th>
                <th className="p-3 font-semibold text-nk-fg">Estado</th>
                <th className="p-3 font-semibold text-nk-fg">Acción</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.lead_id} data-testid="lead-row" className="border-b border-nk-border last:border-b-0 hover:bg-nk-surface-2/60">
                  <td className="p-3 font-medium text-nk-fg">{lead.vehicle_name}</td>
                  <td className="p-3 text-nk-fg-muted">
                    {new Date(lead.created_at).toLocaleDateString("es-DO")}
                  </td>
                  <td className="p-3 tabular-nums">{fmtRD(lead.requested_amount)}</td>
                  <td className="p-3">
                    <span
                      data-testid="lead-status"
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                        statusClass(lead.status),
                      )}
                    >
                      {statusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/autos/dashboard/mis-leads/${encodeURIComponent(lead.lead_id)}`}
                      className="font-medium text-brand underline"
                    >
                      Ver detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
