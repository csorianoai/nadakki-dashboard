import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { BankQueueClient } from "./BankQueueClient";

export default function CreditBankPage() {
  return (
    <CreditTenantGate>
      <BankQueueClient />
    </CreditTenantGate>
  );
}
