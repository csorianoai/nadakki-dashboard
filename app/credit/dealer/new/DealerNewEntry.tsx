"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { CompressedWizard } from "@/components/credit/CompressedWizard";
import type { WizardData } from "@/components/credit/compressed-wizard-types";
import { wizardDataToCreditPayloads } from "@/lib/credit/compressed-wizard-map";
import {
  createApplication,
  CreditApiError,
  processApplication,
  saveApplicant,
  saveVehicle,
} from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";
import { isCompressedWizardFeatureEnabled } from "@/lib/env/feature-compressed-wizard";
import { DealerNewWizard } from "./DealerNewWizard";
import { ValidationBanner } from "@/components/credit";

export function DealerNewEntry() {
  const { tenantId } = useTenant();
  const tid = (tenantId ?? "").trim();
  const router = useRouter();
  const useCompressed = isCompressedWizardFeatureEnabled();
  const [error, setError] = useState<Error | null>(null);

  const handleCompressedComplete = useCallback(
    async (data: WizardData) => {
      setError(null);
      try {
        const { mode, applicant, vehicle } = wizardDataToCreditPayloads(data);
        const res = await createApplication(tid, {
          application_payload: {
            mode,
            applicant_data: {},
          },
          initial_state: "DRAFT",
        });
        await saveApplicant(tid, res.application_id, applicant);
        await saveVehicle(tid, res.application_id, vehicle);
        await processApplication(tid, res.application_id, {
          mode,
          dry_run: false,
        });
        router.push(`/credit/dealer/${encodeURIComponent(res.application_id)}`);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    },
    [router, tid],
  );

  if (!useCompressed) {
    return <DealerNewWizard />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/50 via-slate-900 to-slate-950 p-6 shadow-2xl md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-300">
              <Sparkles className="h-4 w-4" aria-hidden />
              Flujo comprimido (&lt;25 min)
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              Nueva solicitud de crédito
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400">
              Meta META MVP 4: entrada rápida en 5 pasos, borrador offline y telemetría por paso. Si necesitas el wizard
              completo con documentos por paso, desactiva{" "}
              <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_FEATURE_COMPRESSED_WIZARD</code>.
            </p>
            <p className="text-xs text-slate-500">Objetivo de sesión: menos de 25 minutos.</p>
          </div>
          <Link
            href="/credit/dealer"
            className="shrink-0 text-sm font-medium text-slate-400 underline-offset-4 hover:text-white hover:underline"
          >
            ← Volver al command center
          </Link>
        </div>
      </div>

      <ValidationBanner error={error instanceof CreditApiError ? error : error?.message ? error : null} />

      <CompressedWizard tenantId={tid} onComplete={handleCompressedComplete} />
    </div>
  );
}
