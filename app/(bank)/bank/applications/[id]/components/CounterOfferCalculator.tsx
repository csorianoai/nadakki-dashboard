"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { COUNTER_DEBOUNCE_MS } from "@/lib/bank-decision/constants";
import { computeCounterPti } from "@/lib/bank-decision/counter-offer-calculator";

export interface CounterTermsState {
  amount: number | "";
  interest_rate: number | "";
  term_months: number | "";
  down_payment_pct: number | "";
  no_match: boolean;
}

export interface CounterOfferCalculatorProps {
  currency: string;
  grossMonthlyIncome: number | null | undefined;
  value: CounterTermsState;
  onChange: (v: CounterTermsState) => void;
  disabled?: boolean;
}

function formatMoney(amount: number, currency: string): string {
  try {
    const ccy = currency === "DOP" ? "DOP" : currency || "USD";
    return new Intl.NumberFormat("es-DO", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return String(amount);
  }
}

/** Embedded counter calculator with debounced projected PTI (SPEC-005). */
export function CounterOfferCalculator({
  currency,
  grossMonthlyIncome,
  value,
  onChange,
  disabled,
}: CounterOfferCalculatorProps) {
  const [debouncedSnapshot, setDebouncedSnapshot] = useState(value);
  const deferred = useDeferredValue(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSnapshot(deferred), COUNTER_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [deferred]);

  const pti = useMemo(() => {
    const amt =
      typeof debouncedSnapshot.amount === "number" && debouncedSnapshot.amount > 0 ? debouncedSnapshot.amount : NaN;
    const rate =
      typeof debouncedSnapshot.interest_rate === "number" ? debouncedSnapshot.interest_rate : NaN;
    const term =
      typeof debouncedSnapshot.term_months === "number" ? debouncedSnapshot.term_months : NaN;
    const down =
      typeof debouncedSnapshot.down_payment_pct === "number" ? debouncedSnapshot.down_payment_pct : 0;
    if (!grossMonthlyIncome || grossMonthlyIncome <= 0 || !Number.isFinite(amt)) return null;
    if (!Number.isFinite(rate) || !Number.isFinite(term) || term <= 0) return null;
    return computeCounterPti({
      grossMonthlyIncome,
      counterAmount: amt,
      annualInterestPct: rate,
      termMonths: term,
      downPaymentPct: down,
    });
  }, [debouncedSnapshot, grossMonthlyIncome]);

  const update = (patch: Partial<CounterTermsState>) => onChange({ ...value, ...patch });

  return (
    <section
      className="space-y-4 rounded-lg border border-forgeBrand-200 bg-forgeBrand-50/30 p-4"
      aria-labelledby="counter-calc-title"
    >
      <h3 id="counter-calc-title" className="text-forge-sm font-semibold text-forgeGray-900">
        Calculadora de contraoferta
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-forge-xs font-medium text-forgeGray-600">
          Monto ({currency})
          <input
            type="number"
            min={0}
            step={1000}
            disabled={disabled}
            className="mt-1 w-full rounded-lg border border-forgeGray-300 px-3 py-2 font-forgeMono text-forge-sm"
            value={value.amount === "" ? "" : value.amount}
            onChange={(e) => update({ amount: e.target.value === "" ? "" : Number(e.target.value) })}
          />
        </label>
        <label className="block text-forge-xs font-medium text-forgeGray-600">
          Tasa anual (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            disabled={disabled}
            className="mt-1 w-full rounded-lg border border-forgeGray-300 px-3 py-2 font-forgeMono text-forge-sm"
            value={value.interest_rate === "" ? "" : value.interest_rate}
            onChange={(e) => update({ interest_rate: e.target.value === "" ? "" : Number(e.target.value) })}
          />
        </label>
        <label className="block text-forge-xs font-medium text-forgeGray-600">
          Plazo (meses)
          <input
            type="number"
            min={1}
            step={1}
            disabled={disabled}
            className="mt-1 w-full rounded-lg border border-forgeGray-300 px-3 py-2 font-forgeMono text-forge-sm"
            value={value.term_months === "" ? "" : value.term_months}
            onChange={(e) => update({ term_months: e.target.value === "" ? "" : Number(e.target.value) })}
          />
        </label>
        <label className="block text-forge-xs font-medium text-forgeGray-600">
          Anticipo (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            disabled={disabled}
            className="mt-1 w-full rounded-lg border border-forgeGray-300 px-3 py-2 font-forgeMono text-forge-sm"
            value={value.down_payment_pct === "" ? "" : value.down_payment_pct}
            onChange={(e) => update({ down_payment_pct: e.target.value === "" ? "" : Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-forge-sm text-forgeGray-800">
        <input
          type="checkbox"
          disabled={disabled}
          checked={value.no_match}
          onChange={(e) => update({ no_match: e.target.checked })}
        />
        Sin match de políticas (requiere vista previa regulatoria / acción adversa)
      </label>
      <div
        className="rounded-md border border-forgeGray-200 bg-white px-3 py-2 text-forge-sm tabular-nums text-forgeGray-900 ring-1 ring-inset ring-forgeGray-100"
        aria-live="polite"
      >
        Cuota / Ingreso proyectado:{" "}
        <strong className="font-forgeMono">{pti != null ? `${pti.toFixed(1)} %` : "—"}</strong>
        {" · "}Ingreso bruto mensual referencia:{" "}
        {grossMonthlyIncome && grossMonthlyIncome > 0 ? formatMoney(grossMonthlyIncome, currency) : "—"}
      </div>
    </section>
  );
}
