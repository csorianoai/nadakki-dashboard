"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CreditApiError, loadDemoCase } from "@/lib/credit-api";
import { useTenant } from "@/contexts/TenantContext";

type DemoCase = "prime" | "review" | "high_risk";

const LABELS: Record<DemoCase, string> = {
  prime: "Cliente ideal",
  review: "Caso en revisión",
  high_risk: "Alto riesgo",
};

export function DemoModeLauncher() {
  const router = useRouter();
  const { tenantId: ctx } = useTenant();
  const tenantId = (ctx ?? "").trim();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<DemoCase | null>(null);
  const [demoDisabled, setDemoDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(caseType: DemoCase) {
    if (!tenantId) return;
    setBusy(caseType);
    setError(null);
    setDemoDisabled(false);
    try {
      const result = await loadDemoCase(tenantId, caseType);
      router.push(`/credit/dealer/${encodeURIComponent(result.application_id)}`);
    } catch (e) {
      if (
        e instanceof CreditApiError &&
        (e.status === 403 || e.message === "demo_disabled")
      ) {
        setDemoDisabled(true);
      } else {
        setError(
          e instanceof CreditApiError ? e.message : "No se pudo cargar el demo."
        );
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-amber-200/90 w-full text-left"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0" />
        )}
        Demo Mode
      </button>
      {open ? (
        <div className="mt-3 space-y-2">
          {demoDisabled ? (
            <span className="inline-block text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-200">
              Demo solo disponible en local
            </span>
          ) : null}
          {error ? (
            <p className="text-xs text-red-400 m-0">{error}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LABELS) as DemoCase[]).map((k) => (
              <button
                key={k}
                type="button"
                disabled={busy !== null || !tenantId}
                onClick={() => void run(k)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40"
              >
                {busy === k ? "Cargando…" : LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
