"use client";

import { ForgeInput } from "@/components/credit-hub/primitives/ForgeInput";
import { ForgeSelect } from "@/components/credit-hub/primitives/ForgeSelect";
import type { TenantBankingConfig } from "@/lib/credit-hub/types/tenantConfig";
import type { SimulationInputs } from "@/lib/credit/simulation/scenario-engine";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

interface Props {
  inputs: SimulationInputs;
  onChange: (next: SimulationInputs) => void;
  tenantConfig: TenantBankingConfig;
  labels: CreditHubTranslations["simulator"]["fields"];
  sectionTitle: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function SimulatorControls({ inputs, onChange, tenantConfig, labels, sectionTitle }: Props) {
  const minRate = tenantConfig.min_rate ?? 10;
  const maxRate = tenantConfig.max_rate ?? 25;
  const limits = tenantConfig.product_limits;
  const minLoan = limits?.min_loan ?? 0;
  const maxLoan = limits?.max_loan ?? Number.POSITIVE_INFINITY;

  const pctDown = inputs.vehiclePrice > 0 ? (inputs.downPayment / inputs.vehiclePrice) * 100 : 0;

  const apply = (partial: Partial<SimulationInputs>) => {
    const merged = { ...inputs, ...partial };
    let vehiclePrice = Math.max(0, merged.vehiclePrice);
    let downPayment = clamp(merged.downPayment, 0, vehiclePrice);
    const amount = vehiclePrice - downPayment;
    if (limits && amount < minLoan && vehiclePrice >= minLoan) {
      downPayment = Math.max(0, vehiclePrice - minLoan);
    }
    if (limits && amount > maxLoan) {
      downPayment = Math.max(0, vehiclePrice - maxLoan);
    }
    const annualRate = clamp(merged.annualRate, minRate, maxRate);
    const allowed = tenantConfig.allowed_terms?.length ? tenantConfig.allowed_terms : [12, 24, 36, 48, 60, 72, 84];
    const termMonths = allowed.includes(merged.termMonths) ? merged.termMonths : allowed.includes(60) ? 60 : allowed[0];
    onChange({
      ...merged,
      vehiclePrice,
      downPayment,
      annualRate,
      termMonths,
    });
  };

  const allowedTerms = tenantConfig.allowed_terms?.length ? tenantConfig.allowed_terms : [12, 24, 36, 48, 60, 72, 84];

  return (
    <div className="space-y-4 rounded-2xl border border-forge-border bg-forge-surface p-4 md:p-6">
      <h2 className="font-display text-lg font-semibold text-forge-text">{sectionTitle}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ForgeInput
          label={labels.monthly_income}
          type="number"
          inputMode="decimal"
          min={0}
          value={inputs.monthlyIncome || ""}
          onChange={(e) => apply({ monthlyIncome: Number(e.target.value) || 0 })}
        />
        <ForgeInput
          label={labels.monthly_debts}
          type="number"
          inputMode="decimal"
          min={0}
          value={inputs.monthlyDebts || ""}
          onChange={(e) => apply({ monthlyDebts: Number(e.target.value) || 0 })}
        />
        <ForgeInput
          label={labels.age}
          type="number"
          min={18}
          max={99}
          value={inputs.age || ""}
          onChange={(e) => apply({ age: Number(e.target.value) || 0 })}
        />
        <ForgeInput
          label={labels.employment_years}
          type="number"
          inputMode="decimal"
          min={0}
          step={0.1}
          value={inputs.employmentYears || ""}
          onChange={(e) => apply({ employmentYears: Number(e.target.value) || 0 })}
        />
        <ForgeInput
          label={labels.vehicle_price}
          type="number"
          inputMode="decimal"
          min={0}
          value={inputs.vehiclePrice || ""}
          onChange={(e) => apply({ vehiclePrice: Number(e.target.value) || 0 })}
        />
        <ForgeInput
          label={labels.down_payment}
          type="number"
          inputMode="decimal"
          min={0}
          value={inputs.downPayment || ""}
          onChange={(e) => apply({ downPayment: Number(e.target.value) || 0 })}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-forge-text" htmlFor="sim-down-pct">
          {labels.down_payment_pct}: {pctDown.toFixed(0)}%
        </label>
        <input
          id="sim-down-pct"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(pctDown)}
          onChange={(e) => {
            const p = Number(e.target.value) / 100;
            apply({ downPayment: Math.round(inputs.vehiclePrice * p) });
          }}
          className="w-full accent-forge-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ForgeSelect
          label={labels.term_months}
          value={String(inputs.termMonths)}
          onChange={(e) => apply({ termMonths: Number(e.target.value) || 60 })}
        >
          {allowedTerms.map((m) => (
            <option key={m} value={m}>
              {m} meses
            </option>
          ))}
        </ForgeSelect>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-forge-text" htmlFor="sim-rate">
            {labels.annual_rate}: {inputs.annualRate.toFixed(1)}% ({minRate}–{maxRate})
          </label>
          <input
            id="sim-rate"
            type="range"
            min={minRate}
            max={maxRate}
            step={0.1}
            value={inputs.annualRate}
            onChange={(e) => apply({ annualRate: Number(e.target.value) })}
            className="w-full accent-forge-primary"
          />
          <ForgeInput
            type="number"
            inputMode="decimal"
            min={minRate}
            max={maxRate}
            step={0.1}
            value={inputs.annualRate}
            onChange={(e) => apply({ annualRate: Number(e.target.value) || minRate })}
          />
        </div>
      </div>
    </div>
  );
}
