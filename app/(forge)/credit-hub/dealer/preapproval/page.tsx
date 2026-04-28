"use client";

import { useRouter } from "next/navigation";
import { PreApprovalSimulator } from "@/components/credit-hub/dealer/preapproval/PreApprovalSimulator";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { SimulationInputs } from "@/lib/credit/simulation/scenario-engine";

export default function DealerPreApprovalPage() {
  const t = useTranslations();
  const router = useRouter();
  const copy = t.simulator;

  const handleConvertToApplication = (inputs: SimulationInputs) => {
    const loanAmount = Math.max(0, inputs.vehiclePrice - inputs.downPayment);
    const payload = { ...inputs, loanAmount };
    const encoded = encodeURIComponent(btoa(JSON.stringify(payload)));
    router.push(`/credit-hub/dealer/applications/new?preset=${encoded}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-forge-text">{copy.page_title}</h1>
        <p className="max-w-3xl text-forge-text-muted">{copy.page_subtitle}</p>
      </div>
      <PreApprovalSimulator onConvertToApplication={handleConvertToApplication} />
    </div>
  );
}
