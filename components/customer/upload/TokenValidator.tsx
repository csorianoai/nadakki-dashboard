"use client";

import { useEffect, useState } from "react";

import type { UploadValidateOk } from "@/lib/customer/upload/validateUploadToken";
import { fetchUploadLinkValidate } from "@/lib/customer/upload/validateUploadToken";
import { messages } from "@/lib/customer/upload/messages";

type TokenValidatorProps = {
  token: string;
  applicationId: string;
  stipulationId: string;
  children: (meta: UploadValidateOk) => React.ReactNode;
};

export function TokenValidator({ token, applicationId, stipulationId, children }: TokenValidatorProps) {
  const [state, setState] = useState<
    | { phase: "loading" }
    | { phase: "ready"; meta: UploadValidateOk }
    | { phase: "error"; status: number; detail: unknown }
  >({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetchUploadLinkValidate(applicationId, stipulationId, token);
      if (cancelled) return;
      if (r.ok === true) {
        setState({ phase: "ready", meta: r.data });
      } else {
        setState({ phase: "error", status: r.status, detail: r.detail });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, applicationId, stipulationId]);

  if (state.phase === "loading") {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
        <p className="text-center text-slate-600">{messages.validating}</p>
        <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-24 w-full animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (state.phase === "error") {
    let msg = messages.failureTitle;
    if (state.status === 401) msg = messages.authExpired;
    else if (state.status === 403) msg = messages.accessDenied;
    else if (state.status === 409) msg = messages.alreadyUsed;
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800" role="alert">
        <p className="font-medium">{msg}</p>
      </div>
    );
  }

  return <>{children(state.meta)}</>;
}
