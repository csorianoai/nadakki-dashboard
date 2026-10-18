"use client";

import { use } from "react";
import Link from "next/link";
import { CreditTenantGate } from "@/app/credit/CreditTenantGate";
import { BankApplicationOpsPanel } from "@/app/(forge)/credit-hub/bank/_components/BankApplicationOpsPanel";
import { BankDetailLayout } from "@/components/credit-hub/bank/BankDetailLayout";
import { DetailSkeleton, EmptyStateRich } from "@/components/credit-hub/primitives";
import { useBankApplication, useBankAuditTrail, useBankCompliance } from "@/lib/credit-hub/hooks/useBankDecision";
import { useMarcaBanco } from "../../../BancoV2Shell";

/**
 * Herramientas del expediente bancario v1 (contraoferta, ofertas, estipulaciones, mensajes, notas y
 * operaciones) DENTRO de bank-v2, bajo su layout (BancoV2Shell: CHTenantGuard + CHPortalAccessGuard
 * portal="bank"). La ruta v1 /credit-hub/bank/applications/:id redirige a bank-v2 (next.config.js),
 * por eso no se puede enlazar: esta ruta es la que las hace alcanzables, sin redirección.
 *
 * ESTILOS: las clases ch-* de la pantalla v1 cuelgan de `.credit-hub-forge` (credit-hub.css), que en v1
 * pone BankChShell; BancoV2Shell no, de ahi la vista sin estilos. Se aplica aqui el mismo ambito
 * (credit-hub-forge + data-persona="bank") y la clase credit-hub-bank-portal de bank/layout.tsx.
 *
 * FUENTE (no borrar en el PR 7 mientras esto sea así):
 *   app/(forge)/credit-hub/bank/_components/BankApplicationOpsPanel.tsx
 *   app/(forge)/credit-hub/bank/_lib/ops-actions-api.ts
 *   components/credit-hub/bank/BankDetailLayout.tsx (y sus sections/)
 */
export default function HerramientasExpedientePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const marca = useMarcaBanco();
  // Mismos hooks y mismos mapeos (hechosComunes) que el detalle v2: una sola fuente por campo.
  const appQuery = useBankApplication(applicationId);
  const complianceQuery = useBankCompliance(applicationId);
  const auditQuery = useBankAuditTrail(applicationId);
  return (
    <div data-testid="herramientas-portal" className="credit-hub-forge credit-hub-bank-portal" data-persona="bank">
      <Link
        href={`/credit-hub/bank-v2/solicitudes/${encodeURIComponent(applicationId)}`}
        data-testid="herramientas-volver-expediente"
        className="mb-3 inline-block text-sm underline"
      >
        Volver al expediente
      </Link>
      {appQuery.isLoading ? (
        <DetailSkeleton />
      ) : appQuery.error || !appQuery.data ? (
        <EmptyStateRich
          variant="error"
          primary={
            <button type="button" className="ch-btn ch-btn-secondary" onClick={() => void appQuery.refetch()}>
              Reintentar
            </button>
          }
        />
      ) : (
        <CreditTenantGate>
          <BankDetailLayout
            application={appQuery.data}
            compliance={complianceQuery.data}
            audit={auditQuery.data}
            isComplianceLoading={complianceQuery.isLoading}
            formato={marca.formato}
          />
          <BankApplicationOpsPanel applicationId={applicationId} />
        </CreditTenantGate>
      )}
    </div>
  );
}
