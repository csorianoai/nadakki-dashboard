import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { DealerNewWizard } from "./DealerNewWizard";

export default function CreditDealerNewPage() {
  return (
    <CreditTenantGate>
      <DealerNewWizard />
    </CreditTenantGate>
  );
}
