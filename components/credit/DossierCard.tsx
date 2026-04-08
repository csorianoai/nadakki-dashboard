"use client";

import { formatDOP } from "@/lib/credit-format";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export interface DossierCardProps {
  applicant?: Record<string, unknown> | null;
  vehicle?: Record<string, unknown> | null;
  ltv?: number | null;
  className?: string;
}

export function DossierCard({
  applicant,
  vehicle,
  ltv,
  className,
}: DossierCardProps) {
  const name = applicant?.name != null ? String(applicant.name) : null;
  const income =
    applicant?.monthly_income != null
      ? Number(applicant.monthly_income as number)
      : null;
  const vval =
    vehicle?.vehicle_value != null
      ? Number(vehicle.vehicle_value as number)
      : null;
  const loan =
    vehicle?.loan_amount_requested != null
      ? Number(vehicle.loan_amount_requested as number)
      : null;

  const ltvHigh = ltv != null && ltv > 0.8;

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-4 grid md:grid-cols-2 gap-6",
        className
      )}
    >
      <div>
        <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
          Solicitante
        </h3>
        {!name ? (
          <p className="text-sm text-slate-500">Sin datos de solicitante</p>
        ) : (
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="text-slate-500 inline">Nombre: </dt>
              <dd className="inline text-slate-100">{name}</dd>
            </div>
            <div>
              <dt className="text-slate-500 inline">Ingreso mensual: </dt>
              <dd className="inline text-slate-100">{formatDOP(income)}</dd>
            </div>
          </dl>
        )}
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
          Vehículo
        </h3>
        {!vehicle || Object.keys(vehicle).length === 0 ? (
          <p className="text-sm text-slate-500">Sin datos de vehículo</p>
        ) : (
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="text-slate-500 inline">Activo: </dt>
              <dd className="inline text-slate-100">
                {[vehicle.year, vehicle.make, vehicle.model]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 inline">Valor: </dt>
              <dd className="inline text-slate-100">{formatDOP(vval)}</dd>
            </div>
            <div>
              <dt className="text-slate-500 inline">Monto solicitado: </dt>
              <dd className="inline text-slate-100">{formatDOP(loan)}</dd>
            </div>
          </dl>
        )}
      </div>
      {ltv != null && !Number.isNaN(ltv) && (
        <div
          className={cn(
            "md:col-span-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
            ltvHigh
              ? "bg-amber-500/15 text-amber-200 border border-amber-500/30"
              : "bg-white/5 text-slate-300"
          )}
        >
          {ltvHigh && <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>
            LTV: <strong>{(ltv * 100).toFixed(1)}%</strong>
            {ltvHigh && " — por encima del 80%"}
          </span>
        </div>
      )}
    </div>
  );
}
