"use client";

import type { VehiclePayload } from "@/lib/credit-api";
import { useState } from "react";

export interface VehicleFormProps {
  initial?: Partial<VehiclePayload>;
  onSubmit: (data: VehiclePayload) => void;
  submitLabel?: string;
  disabled?: boolean;
}

export function VehicleForm({
  initial,
  onSubmit,
  submitLabel = "Guardar vehículo",
  disabled = false,
}: VehicleFormProps) {
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(
    initial?.year != null ? String(initial.year) : ""
  );
  const [vin, setVin] = useState(initial?.vin ?? "");
  const [vehicleValue, setVehicleValue] = useState(
    initial?.vehicle_value != null ? String(initial.vehicle_value) : ""
  );
  const [loanReq, setLoanReq] = useState(
    initial?.loan_amount_requested != null
      ? String(initial.loan_amount_requested)
      : ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vv = vehicleValue === "" ? undefined : Number(vehicleValue);
    const lr = loanReq === "" ? undefined : Number(loanReq);
    const y = year === "" ? undefined : parseInt(year, 10);
    if (vv != null && Number.isNaN(vv)) return;
    if (lr != null && Number.isNaN(lr)) return;
    onSubmit({
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year: y && !Number.isNaN(y) ? y : undefined,
      vin: vin.trim() || undefined,
      vehicle_value: vv,
      loan_amount_requested: lr,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Marca
          </label>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Modelo
          </label>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Año
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            VIN
          </label>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Valor vehículo (RD$)
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={vehicleValue}
            onChange={(e) => setVehicleValue(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Monto solicitado (RD$)
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={loanReq}
            onChange={(e) => setLoanReq(e.target.value)}
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
