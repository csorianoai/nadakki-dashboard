"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";
import { apiFetch } from "@/lib/api/fetch-client";

type WizardPayload = {
  wizard_responses: {
    block_1_identity: {
      company_name: string;
      what_you_do: string;
      location: string;
    };
    block_2_products: {
      products_description: string;
      hero_product: string;
    };
    block_3_audience_tone: {
      target_audience: string;
      brand_tone: string;
    };
  };
  dry_run: boolean;
};

function detailFromUnknown(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const detail = (json as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

/**
 * Mini-wizard for POST /api/v1/tenants/build-profile (tenant DNA / products).
 * Shown below the interactive Marketing Core onboarding guide.
 */
export function TenantProfileActivationPanel() {
  const { tenantId } = useTenant();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const [companyName, setCompanyName] = useState("");
  const [whatYouDo, setWhatYouDo] = useState("");
  const [location, setLocation] = useState("");
  const [productsDescription, setProductsDescription] = useState("");
  const [heroProduct, setHeroProduct] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandTone, setBrandTone] = useState("profesional");

  const canNextStep1 = companyName.trim().length > 0 && whatYouDo.trim().length > 0;
  const canNextStep2 = productsDescription.trim().length > 0 && heroProduct.trim().length > 0;
  const canPreview = targetAudience.trim().length > 0;

  const payload = useMemo(
    (): WizardPayload => ({
      wizard_responses: {
        block_1_identity: {
          company_name: companyName.trim(),
          what_you_do: whatYouDo.trim(),
          location: location.trim(),
        },
        block_2_products: {
          products_description: productsDescription.trim(),
          hero_product: heroProduct.trim(),
        },
        block_3_audience_tone: {
          target_audience: targetAudience.trim(),
          brand_tone: brandTone,
        },
      },
      dry_run: true,
    }),
    [brandTone, companyName, heroProduct, location, productsDescription, targetAudience, whatYouDo]
  );

  const callBuildProfile = async (dryRun: boolean) => {
    if (!tenantId?.trim()) {
      setError("Selecciona un tenant para continuar.");
      return null;
    }
    const body: WizardPayload = { ...payload, dry_run: dryRun };
    const res = await apiFetch("/api/v1/tenants/build-profile", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId.trim(),
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      throw new Error(detailFromUnknown(json, `HTTP ${res.status}`));
    }
    return json;
  };

  const runPreview = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const data = await callBuildProfile(true);
      setPreviewData(data);
      setSuccess("Preview generado correctamente.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const activateTenant = async () => {
    setError(null);
    setSuccess(null);
    setActivating(true);
    try {
      const data = await callBuildProfile(false);
      setPreviewData(data);
      setSuccess("Tenant activado con profile guardado.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActivating(false);
    }
  };

  const completeness = Number(previewData?.profile_completeness ?? 0);
  const warnings = Array.isArray(previewData?.warnings) ? (previewData.warnings as string[]) : [];
  const productsCatalog = Array.isArray(previewData?.products_catalog) ? previewData.products_catalog : [];

  return (
    <div className="space-y-6">
      {!tenantId && (
        <GlassCard className="p-4 border border-amber-500/30">
          <p className="text-sm text-amber-200 m-0">Debes seleccionar un tenant antes de usar el asistente de perfil.</p>
        </GlassCard>
      )}

      <GlassCard className="p-6 border border-white/10">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
          <span className={step === 1 ? "text-white" : ""}>1. Identidad</span>
          <span>•</span>
          <span className={step === 2 ? "text-white" : ""}>2. Productos</span>
          <span>•</span>
          <span className={step === 3 ? "text-white" : ""}>3. Audiencia y Tono</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-gray-500">Nombre de la empresa</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Qué hace tu empresa</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                rows={3}
                value={whatYouDo}
                onChange={(e) => setWhatYouDo(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">País / Ciudad</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canNextStep1}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-gray-500">Descripción de productos/servicios con precios</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                rows={4}
                value={productsDescription}
                onChange={(e) => setProductsDescription(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Producto principal</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={heroProduct}
                onChange={(e) => setHeroProduct(e.target.value)}
              />
            </label>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canNextStep2}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-gray-500">A quién le vendes</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                rows={3}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Tono de marca</span>
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value)}
              >
                {["energético", "profesional", "casual", "lujoso", "inspiracional"].map((tone) => (
                  <option key={tone} value={tone} className="bg-[#0d1117]">
                    {tone}
                  </option>
                ))}
              </select>
            </label>

            {error && <p className="text-sm text-red-400 m-0">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-300 m-0 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => void runPreview()}
                disabled={loading || !canPreview || !tenantId}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generar Profile (Preview)
              </button>
              <button
                type="button"
                onClick={() => void activateTenant()}
                disabled={activating || !previewData || !tenantId}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2"
              >
                {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Activar Tenant
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {previewData && (
        <GlassCard className="p-6 border border-white/10">
          <h2 className="text-lg text-white font-semibold mb-3">Resultado del profile</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm text-gray-300 mb-1">
                <span>Profile completeness</span>
                <span>{Number.isFinite(completeness) ? completeness : 0}%</span>
              </div>
              <div className="h-2 rounded bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-violet-500"
                  style={{ width: `${Math.min(Math.max(completeness || 0, 0), 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-500 m-0">Industry Type</p>
                <p className="text-sm text-white m-0 mt-1">{String(previewData?.industry_type ?? "—")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-500 m-0">Products Catalog Count</p>
                <p className="text-sm text-white m-0 mt-1">{productsCatalog.length}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-2">Warnings</p>
              {warnings.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-amber-200 space-y-1">
                  {warnings.map((warning, idx) => (
                    <li key={`${warning}-${idx}`}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 m-0">Sin warnings en esta ejecución.</p>
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
