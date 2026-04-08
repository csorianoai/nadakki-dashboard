import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { DealerListClient } from "./DealerListClient";

export default function CreditDealerPage() {
  return (
    <CreditTenantGate>
      <DealerListClient />
    </CreditTenantGate>
  );
}
