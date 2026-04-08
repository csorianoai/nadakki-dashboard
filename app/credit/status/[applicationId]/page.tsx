import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { ClientStatusClient } from "./ClientStatusClient";

export default async function CreditClientStatusPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return (
    <CreditTenantGate>
      <ClientStatusClient
        applicationId={decodeURIComponent(applicationId)}
      />
    </CreditTenantGate>
  );
}
