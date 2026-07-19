"use client";

import { useState } from "react";
import { LegalApiHttpError } from "@/lib/legal/parse-api-error";

type Props = {
  title: string;
  error: unknown;
  defectId?: string;
  hint?: string;
};

export function LegalApiErrorPanel({ title, error, defectId, hint }: Props) {
  const [open, setOpen] = useState(false);
  const http = error instanceof LegalApiHttpError ? error : null;
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="rounded-forge-md border border-forgeDanger-200 bg-forgeDanger-50 p-4 text-sm text-forgeGray-900" role="alert">
      <p className="font-semibold text-forgeDanger-800">{title}</p>
      <p className="mt-2">{http?.detail ?? message}</p>
      {http ? <p className="mt-1 text-xs text-forgeGray-600">HTTP {http.status}</p> : null}
      {defectId ? (
        <p className="mt-2 text-xs text-forgeGray-700">
          Registrado en backend defects ledger: <code className="font-mono">{defectId}</code>
          {" — "}
          <code className="font-mono">docs/legal_ui/BACKEND_DEFECTS_LEDGER.md</code>
        </p>
      ) : null}
      {hint ? <p className="mt-2 text-xs text-forgeGray-700">{hint}</p> : null}
      {http?.body ? (
        <div className="mt-3">
          <button
            type="button"
            className="text-xs font-medium text-forgeBrand-700 underline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Ocultar detalle técnico" : "Ver detalle técnico"}
          </button>
          {open ? (
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-forgeGray-100 p-2 text-[11px] leading-snug">
              {http.body}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
