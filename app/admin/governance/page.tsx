"use client";

import { useAuth } from "@/hooks/useAuth";
import { useGovernanceReport } from "@/hooks/use-governance-report";
import { useRunGovernance } from "@/hooks/use-run-governance";
import { ForgeToaster } from "@/components/forge/ui/Toast";
import { Skeleton } from "@/components/forge/ui/Skeleton";
import { GovernanceHeader } from "./components/governance-header";
import { GovernanceSummaryCards } from "./components/governance-summary-cards";
import { CentinelaStatusGrid } from "./components/centinela-status-grid";
import { FindingsTable } from "./components/findings-table";
import { RunCheckButton } from "./components/run-check-button";
import { GovernanceEmptyState } from "./components/empty-state";

function GovernanceLoading() {
  return (
    <div className="flex flex-col gap-4 p-6" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function GovernancePage() {
  const { allRoles, isLoading: authLoading } = useAuth();
  const { data: report, isLoading: reportLoading } = useGovernanceReport();
  const { run, isRunning, progressSeconds, error: runError } = useRunGovernance();

  if (authLoading) {
    return <GovernanceLoading />;
  }

  const isSuperAdmin = allRoles.some((r) => r.role_key === "platform_superadmin");

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-forge-md border border-rose-200 bg-rose-50 p-6">
          <p className="font-semibold text-rose-800">Acceso denegado</p>
          <p className="mt-2 text-sm text-rose-700">
            Esta página requiere el rol <code className="font-mono">platform_superadmin</code>.
          </p>
        </div>
      </div>
    );
  }

  if (reportLoading) {
    return <GovernanceLoading />;
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <ForgeToaster />
        <h1 className="text-2xl font-semibold text-forgeGray-800">Nadakki Governance Core</h1>
        <GovernanceEmptyState onRun={run} isRunning={isRunning} />
      </div>
    );
  }

  const hasBlocking = report.summary.p0 > 0 || report.summary.p1 > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <ForgeToaster />

      {hasBlocking ? (
        <div className="sticky top-0 z-10 rounded-forge-md bg-rose-600 p-4 text-white shadow-forge-md">
          <p className="font-semibold">Production blocking issues detected.</p>
          <p className="text-sm">
            Revisa hallazgos P0/P1 antes de desplegar.{" "}
            {report.summary.p0 + report.summary.p1} findings requieren atención inmediata.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-forgeGray-800">Nadakki Governance Core</h1>
        <RunCheckButton
          onRun={run}
          isRunning={isRunning}
          progressSeconds={progressSeconds}
          error={runError as Error | null}
        />
      </div>

      <GovernanceHeader report={report} />
      <GovernanceSummaryCards summary={report.summary} />

      <div>
        <h2 className="mb-3 text-lg font-medium text-forgeGray-700">Estado por centinela</h2>
        <CentinelaStatusGrid centinelas={report.centinelas} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-forgeGray-700">
          Hallazgos ({report.findings.length})
        </h2>
        <FindingsTable findings={report.findings} />
      </div>
    </div>
  );
}
