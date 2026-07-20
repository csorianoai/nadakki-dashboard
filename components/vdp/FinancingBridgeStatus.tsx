"use client";

import Link from "next/link";
import { creditHubApplicationUrl } from "@/lib/autos-portal/financing-preset";

export function FinancingBridgeStatus({
  applicationId,
  state,
}: {
  applicationId: string;
  state?: string;
}) {
  return (
    <div
      className="mb-4 rounded-r border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-nk-fg"
      role="status"
    >
      <p className="font-semibold text-brand">Solicitud de financiamiento en curso</p>
      <p className="mt-1 text-nk-fg-muted">
        Referencia: <code className="font-mono text-xs">{applicationId}</code>
        {state ? ` · Estado: ${state}` : null}
      </p>
      <Link
        href={creditHubApplicationUrl(applicationId)}
        className="mt-2 inline-block text-sm font-medium text-brand underline"
      >
        Ver solicitud en Credit Hub →
      </Link>
    </div>
  );
}
