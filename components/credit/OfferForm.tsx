"use client";

import type { OfferCreatePayload } from "@/lib/credit-api";
import { useState } from "react";

export interface OfferFormProps {
  onSubmit: (data: OfferCreatePayload) => void;
  disabled?: boolean;
}

export function OfferForm({ onSubmit, disabled = false }: OfferFormProps) {
  const [lenderName, setLenderName] = useState("");
  const [apr, setApr] = useState("0.12");
  const [termMonths, setTermMonths] = useState("48");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [status, setStatus] =
    useState<OfferCreatePayload["status"]>("APROBADO");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const aprNum = Number(apr);
    const term = parseInt(termMonths, 10);
    if (!lenderName.trim() || Number.isNaN(aprNum) || Number.isNaN(term)) return;
    onSubmit({
      lender_name: lenderName.trim(),
      apr_annual: aprNum,
      term_months: term,
      monthly_payment:
        monthlyPayment === "" ? undefined : Number(monthlyPayment),
      status,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Entidad / banco
        </label>
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
          value={lenderName}
          onChange={(e) => setLenderName(e.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Tasa anual (decimal)
          </label>
          <input
            type="number"
            step="0.0001"
            min={0}
            max={1}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={apr}
            onChange={(e) => setApr(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Plazo (meses)
          </label>
          <input
            type="number"
            min={1}
            max={120}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={termMonths}
            onChange={(e) => setTermMonths(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Cuota (opcional)
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={monthlyPayment}
            onChange={(e) => setMonthlyPayment(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Estado de la oferta
        </label>
        <select
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as OfferCreatePayload["status"])
          }
          disabled={disabled}
        >
          <option value="APROBADO">APROBADO</option>
          <option value="APROBADO_CONDICIONADO">APROBADO_CONDICIONADO</option>
          <option value="RECHAZADO">RECHAZADO</option>
          <option value="PENDIENTE">PENDIENTE</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        Registrar oferta
      </button>
    </form>
  );
}
