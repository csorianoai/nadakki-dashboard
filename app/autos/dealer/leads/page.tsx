"use client";

import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccPage } from "@/components/dcc/DccPage";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { AuthContext } from "@/lib/auth/auth-context";
import { formatEntero } from "@/lib/dcc/formato";
import { detalleDeError, esUuid, fetchLeadsPagina, textoLeads, type LeadDealer } from "@/lib/dcc/inicio";
import { marcaDesdeBranding } from "@/lib/dcc/marca";
import { selectedDealerIdentity } from "@/lib/dealer/access-context";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { formateaFecha } from "@/lib/dealer-management/formato";

const EVIDENCIA = "GET /api/v1/autos/tenants/{tenant_uuid}/dealers/{dealer_id}/leads";
const POR_PAGINA = 20;

const ESTADO: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  negotiating: "En negociación",
  won: "Ganado",
  lost: "Perdido",
  archived: "Archivado",
};
const PRIORIDAD: Record<string, string> = { low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente" };

function es403(error: unknown): string | null {
  const rec = error && typeof error === "object" ? (error as { status?: unknown; reason_code?: unknown }) : null;
  if (!rec || rec.status !== 403) return null;
  return typeof rec.reason_code === "string" ? rec.reason_code : "FORBIDDEN";
}

/**
 * Leads del dealer desde el backend (misma ruta y mismos estados que el
 * Command Center). Sin datos de ejemplo: si no hay leads, se dice.
 */
export default function DealerLeadsPage() {
  const formato = marcaDesdeBranding(useDealerManagementBranding().data).formato;
  // Igual que el Command Center: el tenant de la ruta es el UUID de /auth/me.
  const tenantUuid = useContext(AuthContext)?.tenant?.id ?? null;
  const dealerId = selectedDealerIdentity()?.dealerId ?? null;
  const [pagina, setPagina] = useState(1);

  const q = useQuery({
    queryKey: ["dcc-leads", tenantUuid, dealerId, pagina],
    queryFn: () => fetchLeadsPagina(tenantUuid as string, dealerId as string, pagina, POR_PAGINA),
    enabled: Boolean(dealerId) && esUuid(tenantUuid),
    retry: false,
  });
  const fmt = (n: number) => formatEntero(n, formato) ?? String(n);
  const fecha = (iso: string | null) => formateaFecha(iso, formato);

  let cuerpo: React.ReactNode;
  if (!dealerId) {
    cuerpo = <DccEstado estado="vacio" detalle="Tu usuario no tiene un concesionario resuelto." />;
  } else if (!esUuid(tenantUuid)) {
    cuerpo = <DccEstado estado="error" detalle="No pudimos identificar tu concesionario en la sesión. Cerrá sesión y volvé a ingresar." />;
  } else if (q.isPending) {
    cuerpo = <DccEstado estado="cargando" />;
  } else if (q.isError) {
    const motivo = es403(q.error);
    cuerpo = motivo ? (
      <DccEstado estado="bloqueado" detalle="Tu usuario no tiene permiso para ver los leads. Pedile acceso al administrador de tu concesionario." />
    ) : (
      <DccEstado estado="error" detalle={`${EVIDENCIA} → ${detalleDeError(q.error)}`} onReintentar={() => void q.refetch()} />
    );
  } else if (q.data.total === 0) {
    cuerpo = (
      <p data-testid="leads-vacio" className={`text-sm ${DCC_CLASSES.muted}`}>
        Todavía no hay leads.
      </p>
    );
  } else {
    const { leads, total, hasNext } = q.data;
    cuerpo = (
      <div className="flex flex-col gap-4">
        <p data-testid="leads-total" className="text-sm font-semibold text-[var(--dcc-fg)]">
          {textoLeads(total, fmt)} en total
        </p>
        <ul className="divide-y divide-[var(--dcc-border)]">
          {leads.map((lead) => (
            <FilaLead key={lead.id} lead={lead} fecha={fecha(lead.created_at)} />
          ))}
        </ul>
        {pagina > 1 || hasNext ? (
          <div className="flex items-center gap-4 text-sm">
            <button type="button" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)} className={`${DCC_CLASSES.link} disabled:opacity-40`}>
              ← Anterior
            </button>
            <span className={DCC_CLASSES.muted}>Página {fmt(pagina)}</span>
            <button type="button" disabled={!hasNext} onClick={() => setPagina((p) => p + 1)} className={`${DCC_CLASSES.link} disabled:opacity-40`}>
              Siguiente →
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <DccPage titulo="Leads">
      <DccSeccion titulo="Leads del concesionario" icono={Users} testId="dcc-seccion-leads">
        {cuerpo}
      </DccSeccion>
    </DccPage>
  );
}

function FilaLead({ lead, fecha }: { lead: LeadDealer; fecha: string | null }) {
  const contacto = [lead.buyer_phone, lead.buyer_email].filter(Boolean).join(" · ");
  const etiquetas = [
    lead.status ? (ESTADO[lead.status] ?? lead.status) : null,
    lead.priority ? `Prioridad ${(PRIORIDAD[lead.priority] ?? lead.priority).toLowerCase()}` : null,
    lead.finance_interested ? "Interesado en financiamiento" : null,
    lead.source ? `Origen: ${lead.source}` : null,
  ].filter(Boolean);
  return (
    <li data-testid="lead-fila" className="py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-[var(--dcc-fg)]">{lead.buyer_name || "Sin nombre"}</p>
        {fecha ? <p className={`text-xs ${DCC_CLASSES.subtle}`}>{fecha}</p> : null}
      </div>
      {contacto ? <p className={`text-sm ${DCC_CLASSES.muted}`}>{contacto}</p> : null}
      {lead.buyer_message ? <p className="mt-1 text-sm text-[var(--dcc-fg)]">{lead.buyer_message}</p> : null}
      {etiquetas.length ? <p className={`mt-1 text-xs ${DCC_CLASSES.subtle}`}>{etiquetas.join(" · ")}</p> : null}
    </li>
  );
}
