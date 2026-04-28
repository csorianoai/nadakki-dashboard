"use client";

import { useState } from "react";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { usePreApprovalSimulation } from "@/lib/credit-hub/hooks/usePreApprovalSimulation";
import { useScenarioStore } from "@/lib/credit-hub/hooks/useScenarioStore";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { SimulationInputs } from "@/lib/credit/simulation/scenario-engine";
import { ScenarioComparison } from "./ScenarioComparison";
import { SimulatorControls } from "./SimulatorControls";
import { SimulatorResults } from "./SimulatorResults";

export interface PreApprovalSimulatorProps {
  initialInputs?: Partial<SimulationInputs>;
  onConvertToApplication?: (inputs: SimulationInputs) => void;
}

export function PreApprovalSimulator({ initialInputs, onConvertToApplication }: PreApprovalSimulatorProps) {
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const { scenarios, saveScenario, removeScenario, clearAll } = useScenarioStore();
  const copy = t.simulator;

  const [inputs, setInputs] = useState<SimulationInputs>(() => ({
    monthlyIncome: initialInputs?.monthlyIncome ?? 60_000,
    monthlyDebts: initialInputs?.monthlyDebts ?? 0,
    age: initialInputs?.age ?? 30,
    employmentYears: initialInputs?.employmentYears ?? 2,
    vehiclePrice: initialInputs?.vehiclePrice ?? 1_000_000,
    downPayment: initialInputs?.downPayment ?? 200_000,
    termMonths: initialInputs?.termMonths ?? 60,
    annualRate: initialInputs?.annualRate ?? 16,
  }));

  const result = usePreApprovalSimulation(inputs);

  if (!tenantConfig.features_enabled.preapproval_simulator) {
    return (
      <div className="rounded-2xl border border-forge-border bg-forge-surface p-8 text-center text-forge-text-muted">
        {copy.disabled_message}
      </div>
    );
  }

  const handleSave = () => {
    if (!result) return;
    const name = typeof window !== "undefined" ? window.prompt(copy.scenario_name_prompt) : null;
    if (!name?.trim()) return;
    saveScenario(name.trim(), inputs, result);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[40%_60%]" data-testid="preapproval-simulator">
      <SimulatorControls
        inputs={inputs}
        onChange={setInputs}
        tenantConfig={tenantConfig}
        labels={copy.fields}
        sectionTitle={copy.controls_title}
      />
      <SimulatorResults
        result={result}
        inputs={inputs}
        copy={copy}
        onSaveScenario={handleSave}
        onConvertToApplication={onConvertToApplication ? () => onConvertToApplication(inputs) : undefined}
      />
      {scenarios.length > 0 && (
        <div className="lg:col-span-2">
          <ScenarioComparison
            scenarios={scenarios}
            title={copy.comparison_title}
            clearLabel={copy.comparison_clear}
            removeLabel={copy.comparison_remove}
            columns={{
              name: copy.comparison_col_name,
              price: copy.comparison_col_price,
              down: copy.comparison_col_down,
              term: copy.comparison_col_term,
              payment: copy.comparison_col_payment,
              dti: copy.comparison_col_dti,
              ltv: copy.comparison_col_ltv,
              roi: copy.comparison_col_roi,
              status: copy.comparison_col_status,
            }}
            onRemove={removeScenario}
            onClearAll={clearAll}
          />
        </div>
      )}
    </div>
  );
}
