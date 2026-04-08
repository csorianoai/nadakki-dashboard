"use client";

import type { ApplicantPayload } from "@/lib/credit-api";
import { useState } from "react";

export interface ApplicantFormProps {
  initial?: Partial<ApplicantPayload>;
  onSubmit: (data: ApplicantPayload) => void;
  submitLabel?: string;
  disabled?: boolean;
}

export function ApplicantForm({
  initial,
  onSubmit,
  submitLabel = "Guardar solicitante",
  disabled = false,
}: ApplicantFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [monthlyIncome, setMonthlyIncome] = useState(
    String(initial?.monthly_income ?? "")
  );
  const [nationalId, setNationalId] = useState(initial?.national_id ?? "");
  const [employment, setEmployment] = useState(
    initial?.employment_status ?? ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const inc = Number(monthlyIncome);
    if (!name.trim() || Number.isNaN(inc) || inc < 0) return;
    onSubmit({
      name: name.trim(),
      monthly_income: inc,
      national_id: nationalId.trim() || undefined,
      employment_status: employment.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Nombre completo
        </label>
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Ingreso mensual (RD$)
        </label>
        <input
          type="number"
          step="0.01"
          min={0}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          disabled={disabled}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Cédula / ID
          </label>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Empleo
          </label>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={employment}
            onChange={(e) => setEmployment(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}
