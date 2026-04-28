import Link from "next/link";
import { ForgeBadge } from "@/components/credit-hub/primitives/ForgeBadge";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

export function BankComplianceReport({ applications }: { applications: BankQueueItem[] }) {
  const withIssues = applications.filter((item) => !item.bank_decision?.compliance_check?.ley_172_13_compliant);
  const compliant = applications.length - withIssues.length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ForgeCard><p className="text-sm text-forge-text-muted">% compliant</p><p className="mt-2 font-display text-3xl font-bold text-forge-text">{applications.length ? Math.round((compliant / applications.length) * 100) : 0}%</p></ForgeCard>
        <ForgeCard><p className="text-sm text-forge-text-muted">Issues detectados</p><p className="mt-2 font-display text-3xl font-bold text-forge-warning">{withIssues.length}</p></ForgeCard>
        <ForgeCard><p className="text-sm text-forge-text-muted">Última auditoría</p><p className="mt-2 font-semibold text-forge-text">{new Date().toLocaleString("es-DO")}</p></ForgeCard>
      </div>
      <ForgeCard>
        <h2 className="mb-4 font-semibold text-forge-text">Issues Ley 172-13</h2>
        {withIssues.length === 0 ? <p className="text-sm text-forge-text-muted">No hay issues pendientes en la bandeja actual.</p> : (
          <div className="space-y-3">
            {withIssues.map((item) => (
              <Link key={item.application_id} href={`/credit-hub/bank/applications/${item.application_id}`} className="flex items-center justify-between rounded-xl bg-forge-surface-elevated p-3">
                <div><p className="font-medium text-forge-text">{item.application_id}</p><p className="text-sm text-forge-text-muted">{item.applicant_name || "Cliente"}</p></div>
                <ForgeBadge tone="warning">Revisar compliance</ForgeBadge>
              </Link>
            ))}
          </div>
        )}
      </ForgeCard>
      <ForgeCard>
        <h2 className="font-semibold text-forge-text">Right to be forgotten</h2>
        <p className="mt-2 text-sm text-forge-text-muted">Buscar por email o cédula requiere revisión manual de compliance antes de ejecutar eliminación. El endpoint registra la solicitud y evita borrado accidental.</p>
      </ForgeCard>
    </div>
  );
}
