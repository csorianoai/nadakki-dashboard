"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Skeleton } from "@/components/forge";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { forgeDealerApplicationDetailHref } from "@/lib/credit-hub/dealerRoutes";
import { cn } from "@/lib/utils";
import { formatForgeDate } from "@/utils/forge-locale";

const linkPrimary =
  "inline-flex min-h-12 w-full items-center justify-center rounded-forge-sm border border-forgeBrand-600 bg-forgeBrand-500 px-4 text-forge-sm font-medium text-forgeGray-50 shadow-forge-xs transition-colors hover:bg-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 sm:w-auto";
const linkSecondary =
  "inline-flex min-h-12 w-full items-center justify-center rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card px-4 text-forge-sm font-medium text-forgeGray-800 transition-colors hover:bg-forgeSurface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 sm:w-auto";

function DealerApplicationSubmittedInner() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("application_id")?.trim() ?? "";
  const { tenantConfig } = useTenantConfig();
  const now = new Date().toISOString();

  return (
    <div className="min-h-[60vh] px-4 py-10 md:px-8">
      <Card className="mx-auto max-w-lg p-6 text-center shadow-forge-md">
        <p className="text-forge-xs font-semibold uppercase tracking-wider text-forgeBrand-600">Solicitud recibida</p>
        <h1 className="mt-2 font-display text-forge-2xl font-semibold text-forgeGray-800">Gracias por enviar la solicitud</h1>
        <p className="mt-3 text-forge-sm text-forgeGray-600">
          ID de solicitud:{" "}
          <span className="font-mono font-semibold text-forgeGray-900" data-testid="submitted-application-id">
            {applicationId || "—"}
          </span>
        </p>
        <p className="mt-4 text-forge-sm text-forgeGray-600">
          Tiempo estimado de respuesta:{" "}
          <span className="font-medium text-forgeGray-800">3 a 5 días hábiles</span> (referencia local {formatForgeDate(now, tenantConfig.locale)}).
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={applicationId ? forgeDealerApplicationDetailHref(applicationId) : "/credit-hub/dealer/applications"}
            className={cn(linkPrimary)}
          >
            Ver estado
          </Link>
          <Link href="/credit-hub/dealer" className={cn(linkSecondary)}>
            Volver al panel
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function DealerApplicationSubmittedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-4 py-10">
          <Skeleton className="h-64 w-full max-w-lg rounded-forge-lg" />
        </div>
      }
    >
      <DealerApplicationSubmittedInner />
    </Suspense>
  );
}
