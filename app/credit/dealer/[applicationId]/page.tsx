import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { DealerApplicationClient } from "./DealerApplicationClient";

export default async function CreditDealerApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return (
    <CreditTenantGate>
      {(tenantId) => (
        <DealerApplicationClient
          tenantId={tenantId}
          applicationId={decodeURIComponent(applicationId)}
        />
      )}
    </CreditTenantGate>
  );
}
