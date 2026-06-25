"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/contexts/TenantContext";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30";

const selectClass = inputClass;

type KnowledgePack = {
  jurisdiction: string;
  status: string;
  laws_count: number;
};

type OnboardingResponse = {
  status: string;
  tenant_id: string | null;
  firm_name: string;
  jurisdiction: string;
  agents_active: number;
  knowledge_packs: KnowledgePack[];
  dry_run: boolean;
  warnings: string[];
};

export default function LegalOnboardingPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [firmName, setFirmName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [jurisdiction, setJurisdiction] = useState("RD");
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OnboardingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    if (!firmName.trim()) {
      setError("El nombre de la firma es requerido.");
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/legal/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
        },
        body: JSON.stringify({
          firm_name: firmName.trim(),
          contact_email: contactEmail.trim(),
          jurisdiction,
          dry_run: dryRun,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        setError(`Error ${res.status}: ${body}`);
        return;
      }
      const data: OnboardingResponse = await res.json();
      setResult(data);
      if (!dryRun && data.status === "ONBOARDING_ACCEPTED") {
        setTimeout(() => router.push("/legal"), 2000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-800/50 pb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Legal Core
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl">
          Onboarding
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Activa Legal Core para tu firma. Usa dry run para previsualizar sin cambios.
        </p>
      </header>

      <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-6 shadow-xl md:p-8">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-300">
            Nombre de la firma
            <input
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="Ej: Pérez & Asociados"
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Correo de contacto
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="admin@firma.com"
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-300">
            Jurisdicción
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className={selectClass}
            >
              <option value="RD">República Dominicana (RD)</option>
              <option value="CO">Colombia (CO)</option>
              <option value="MX">México (MX)</option>
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500"
            />
            <span>
              Dry run{" "}
              <span className="text-zinc-500">(previsualizar sin activar)</span>
            </span>
          </label>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
        >
          {loading
            ? "Procesando..."
            : dryRun
              ? "Previsualizar activación"
              : "Activar Legal Core"}
        </button>

        {result ? (
          <div className="mt-6 space-y-3 rounded-lg border border-zinc-800/50 bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Estado</span>
              <span
                className={
                  result.status === "ONBOARDING_ACCEPTED"
                    ? "text-sm font-medium text-emerald-400"
                    : "text-sm font-medium text-amber-400"
                }
              >
                {result.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Agentes activos</span>
              <span className="text-sm text-zinc-100">{result.agents_active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Jurisdicción</span>
              <span className="text-sm text-zinc-100">{result.jurisdiction}</span>
            </div>

            {result.knowledge_packs.length > 0 ? (
              <div>
                <p className="text-sm text-zinc-400">Knowledge Packs</p>
                <ul className="mt-1 space-y-1">
                  {result.knowledge_packs.map((kp) => (
                    <li key={kp.jurisdiction} className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          kp.status === "available"
                            ? "inline-block h-2 w-2 rounded-full bg-emerald-400"
                            : "inline-block h-2 w-2 rounded-full bg-amber-400"
                        }
                      />
                      <span className="text-zinc-100">{kp.jurisdiction.toUpperCase()}</span>
                      <span className="text-zinc-500">
                        — {kp.status} ({kp.laws_count} leyes)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.warnings.length > 0 ? (
              <div>
                <p className="text-sm text-zinc-400">Avisos</p>
                <ul className="mt-1 list-inside list-disc text-xs text-amber-400/80">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.status === "ONBOARDING_ACCEPTED" ? (
              <p className="text-sm text-emerald-400">
                Redirigiendo al Legal Hub...
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
