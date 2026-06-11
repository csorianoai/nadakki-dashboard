"use client";

import { useState } from "react";
import { Scale, ShieldCheck } from "lucide-react";
import type { Finding, RunResponse } from "../lib/types";

interface ValidatePanelProps {
  run: RunResponse;
  findings: Finding[];
  onValidate: (counselSigned: boolean) => Promise<void>;
  validating: boolean;
  counselRequired: boolean;
  alreadyValidated: boolean;
}

export function ValidatePanel({
  run,
  findings,
  onValidate,
  validating,
  counselRequired,
  alreadyValidated,
}: ValidatePanelProps) {
  const [counselSigned, setCounselSigned] = useState(false);
  const counselFindings = findings.filter((f) => f.requires_counsel_review);
  const needsCounselAck =
    counselRequired || counselFindings.length > 0;
  const canValidate = run.status === "needs_validation" && !alreadyValidated;
  const counselAckMissing = needsCounselAck && !counselSigned;

  if (run.status !== "needs_validation" && run.status !== "validated") return null;

  return (
    <section
      className="rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs"
      aria-labelledby="validate-panel-title"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[var(--mee-accent)]" aria-hidden />
        <h3 id="validate-panel-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
          Validación humana
        </h3>
      </div>

      {run.status === "validated" || alreadyValidated ? (
        <p className="mt-2 text-forge-sm text-forgeSuccess-700" role="status">
          Investigación validada
          {run.validated_by ? ` por ${run.validated_by}` : ""}
          {run.validated_at
            ? ` el ${new Date(run.validated_at).toLocaleString("es-DO")}`
            : ""}
          .
        </p>
      ) : (
        <>
          {counselFindings.length > 0 ? (
            <p className="mt-2 text-forge-sm text-forgeWarning-700">
              {counselFindings.length} hallazgo(s) bloquean la validación hasta revisión de counsel.
            </p>
          ) : null}

          {(counselRequired || counselFindings.length > 0) ? (
            <div
              className="mt-3 rounded-forge-md border border-forgeWarning-500/40 bg-forgeWarning-50 p-3"
              role="alert"
            >
              <p className="flex items-center gap-2 text-forge-sm font-medium text-forgeWarning-800">
                <Scale className="h-4 w-4 shrink-0" aria-hidden />
                Se requiere firma de counsel para validar.
              </p>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-forge-sm text-forgeGray-700">
                <input
                  type="checkbox"
                  checked={counselSigned}
                  onChange={(e) => setCounselSigned(e.target.checked)}
                  className="h-4 w-4 accent-[var(--mee-accent)]"
                />
                Firmado por counsel
              </label>
            </div>
          ) : null}

          <button
            type="button"
            disabled={!canValidate || validating || counselAckMissing}
            onClick={() => void onValidate(counselSigned)}
            className="mt-4 inline-flex min-h-[40px] items-center rounded-forge-sm bg-[var(--mee-accent)] px-4 py-2 text-forge-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)]"
          >
            {validating ? "Validando…" : "Validar investigación"}
          </button>
        </>
      )}
    </section>
  );
}
