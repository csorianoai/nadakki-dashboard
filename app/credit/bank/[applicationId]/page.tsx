import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { BankApplicationClient } from "./BankApplicationClient";

export default async function CreditBankApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return (
    <CreditTenantGate>
      {(tenantId) => (
        <BankApplicationClient
          tenantId={tenantId}
          applicationId={decodeURIComponent(applicationId)}
        />
      )}
    </CreditTenantGate>
  );
}
