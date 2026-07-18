"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LeadPriorityBadge } from "@/components/dealer/LeadPriorityBadge";
import { LeadSignalsList } from "@/components/dealer/LeadSignalsList";
import { getVehicleThumb, type DealerLead } from "@/lib/dealer/leads-mock";
import { cn } from "@/lib/utils";

export function LeadCard({
  lead,
  onContact,
  onMarkContacted,
}: {
  lead: DealerLead;
  onContact: () => void;
  onMarkContacted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const vehicle = getVehicleThumb(lead.vehicleId);
  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <article className="rounded-r-sm border border-nk-border bg-nk-surface p-4">
      <div className="flex flex-wrap items-start gap-4">
        <LeadPriorityBadge score={lead.score} tier={lead.tier} />

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-2/15 text-sm font-bold text-brand-2">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-manrope text-base font-bold text-nk-fg">{lead.name}</h3>
            <span className="text-sm text-nk-fg-muted">{lead.phone}</span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            {vehicle ? (
              <div
                className="h-10 w-14 shrink-0 rounded-r-sm"
                style={{ background: vehicle.grad }}
                aria-hidden
              />
            ) : null}
            <span className="text-sm font-medium text-nk-fg">{lead.vehicleName}</span>
          </div>

          <div className="mt-3">
            <LeadSignalsList signals={lead.signals} />
          </div>

          <p className="mt-2 text-xs text-nk-fg-subtle">Última actividad: {lead.lastActivity}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onContact}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white"
        >
          Contactar WhatsApp
        </button>
        {lead.status !== "contacted" ? (
          <button
            type="button"
            onClick={onMarkContacted}
            className="rounded-full border border-nk-border px-4 py-2 text-sm font-semibold text-nk-fg-muted"
          >
            Marcar contactado
          </button>
        ) : (
          <span className="rounded-full bg-nk-surface-2 px-4 py-2 text-sm text-nk-fg-muted">
            Contactado
          </span>
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-2"
        >
          Ver más
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded ? (
        <div className={cn("mt-4 space-y-4 border-t border-nk-border pt-4")}>
          <div>
            <h4 className="text-xs font-bold uppercase text-nk-fg-subtle">Historial</h4>
            <ol className="mt-2 space-y-2">
              {lead.interactions.map((i) => (
                <li key={i.id} className="text-sm text-nk-fg-muted">
                  {new Date(i.at).toLocaleString("es-DO")} — {i.action}
                </li>
              ))}
              {lead.interactions.length === 0 ? (
                <li className="text-sm text-nk-fg-subtle">Sin interacciones registradas</li>
              ) : null}
            </ol>
          </div>
          {lead.aiSuggestion ? (
            <div className="rounded-r-sm bg-brand-2/5 p-3 text-sm text-nk-fg">
              <span className="font-bold text-brand-2">Sugerencia AI:</span> {lead.aiSuggestion}
            </div>
          ) : null}
          {lead.otherVehicleIds?.length ? (
            <div>
              <h4 className="text-xs font-bold uppercase text-nk-fg-subtle">También vio</h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {lead.otherVehicleIds.map((id) => (
                  <li key={id}>
                    <Link
                      href={`/autos/vehiculo/${id}`}
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      Vehículo #{id}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
