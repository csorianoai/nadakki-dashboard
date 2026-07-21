"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getFinancingLead } from "@/lib/autos-portal/api";
import { forgeDealerApplicationDetailHref } from "@/lib/credit-hub/dealerRoutes";
import { fmtRD } from "@/lib/format";
import type { FinancingLead, FinancingLeadStatus } from "@/types/autos";
import { cn } from "@/lib/utils";

function statusClass(status: FinancingLeadStatus): string {
  switch (status) {
    case "PENDING":
      return "text-yellow-700 bg-yellow-100";
    case "FINANCED":
      return "text-green-700 bg-green-100";
    case "REJECTED":
      return "text-red-700 bg-red-100";
    case "EXPIRED":
      return "text-gray-700 bg-gray-100";
    default:
      return "text-gray-700 bg-gray-100";
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

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = String(params?.id ?? "");
  const [lead, setLead] = useState<FinancingLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLead = async () => {
      try {
        const data = await getFinancingLead(leadId);
        if (!cancelled) {
          setLead(data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setLead(null);
          setError("Solicitud no encontrada.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (leadId) {
      void fetchLead();
    } else {
      setLoading(false);
      setError("ID de solicitud inválido.");
    }

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-[22px] py-8">
        <p className="text-nk-fg-muted">Cargando…</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="mx-auto max-w-2xl px-[22px] py-8">
        <p className="text-red-700">{error ?? "No encontrado"}</p>
        <Link href="/autos/dashboard/mis-leads" className="mt-4 inline-block text-brand underline">
          Volver a mis solicitudes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-[22px] py-8">
      <Link href="/autos/dashboard/mis-leads" className="text-sm font-medium text-brand underline">
        ← Mis solicitudes
      </Link>

      <h1 className="mt-4 font-manrope text-2xl font-extrabold text-nk-fg">{lead.vehicle_name}</h1>

      <div className="mt-2">
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-xs font-bold",
            statusClass(lead.status),
          )}
        >
          {statusLabel(lead.status)}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-r border border-nk-border bg-nk-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">Precio vehículo</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{fmtRD(lead.vehicle_price)}</p>
        </div>
        <div className="rounded-r border border-nk-border bg-nk-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">Monto solicitado</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{fmtRD(lead.requested_amount)}</p>
        </div>
        <div className="rounded-r border border-nk-border bg-nk-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">Enganche</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{fmtRD(lead.down_payment)}</p>
        </div>
        <div className="rounded-r border border-nk-border bg-nk-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">Plazo</p>
          <p className="mt-1 text-lg font-bold">{lead.term_months} meses</p>
        </div>
        <div className="rounded-r border border-nk-border bg-nk-surface p-4 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-nk-fg-muted">Fecha de solicitud</p>
          <p className="mt-1 font-medium">
            {new Date(lead.created_at).toLocaleString("es-DO")}
          </p>
        </div>
      </div>

      {lead.credit_hub_application_id ? (
        <div className="mt-6 rounded-r border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Credit Hub</p>
          <Link
            href={forgeDealerApplicationDetailHref(lead.credit_hub_application_id)}
            className="mt-2 inline-block text-sm font-medium text-blue-700 underline"
          >
            Ver solicitud en Credit Hub
          </Link>
        </div>
      ) : null}
    </div>
  );
}
