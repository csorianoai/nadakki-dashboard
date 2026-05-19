import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { DealerNewEntry } from "./DealerNewEntry";

export default function CreditDealerNewPage() {
  return (
    <CreditTenantGate>
      <DealerNewEntry />
    </CreditTenantGate>
  );
}
