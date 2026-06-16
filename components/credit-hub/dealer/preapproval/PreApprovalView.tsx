"use client";

import { useRouter } from "next/navigation";
import { EmptyStateRich } from "@/components/credit-hub/primitives";
import { PreApprovalSimulator } from "@/components/credit-hub/dealer/preapproval/PreApprovalSimulator";
import type { DealerPreApprovalViewProps } from "@/lib/credit-hub/types/dealer-views";
import type { SimulationInputs } from "@/lib/credit/simulation/scenario-engine";

export function PreApprovalView({ locale, currency }: DealerPreApprovalViewProps) {
  const router = useRouter();

  const handleConvert = (inputs: SimulationInputs) => {
    const preset = btoa(
      JSON.stringify({
        monthlyIncome: inputs.monthlyIncome,
        monthlyDebts: inputs.monthlyDebts,
        age: inputs.age,
        vehiclePrice: inputs.vehiclePrice,
        downPayment: inputs.downPayment,
        termMonths: inputs.termMonths,
        loanAmount: Math.max(0, inputs.vehiclePrice - inputs.downPayment),
      }),
    );
    router.push(`/credit-hub/dealer/applications/new/applicant?preset=${encodeURIComponent(preset)}`);
  };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 className="ch-serif" style={{ margin: 0, fontSize: 26, letterSpacing: "-0.01em" }}>
          Simulador de preaprobación
        </h1>
        <p style={{ fontSize: 13, color: "var(--ch-text-3)", marginTop: 6 }}>
          Estima cuota y banda de riesgo antes de capturar la solicitud · {currency}
        </p>
      </div>

      <div className="credit-hub-forge" data-persona="dealer">
        <PreApprovalSimulator onConvertToApplication={handleConvert} />
      </div>
    </div>
  );
}
