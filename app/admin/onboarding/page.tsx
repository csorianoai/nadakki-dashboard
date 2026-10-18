"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/motion-stub";
import {
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  Activity,
  AlertTriangle,
  FileCheck2,
  WandSparkles,
  Database,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { SaasOnboardingWizard } from "@/components/admin/saas-onboarding/SaasOnboardingWizard";
import { useTenant } from "@/contexts/TenantContext";
import {
  getTenantOnboardHealth,
  postBuildProfile,
  postTenantOnboard,
  suiteFailure,
  type BuildProfileBody,
} from "@/lib/api/suiteOps";

const PLANS = ["starter", "professional", "enterprise"];

const STEP_META = [
  { id: 1, label: "Basics", icon: FileCheck2 },
  { id: 2, label: "Preview", icon: WandSparkles },
  { id: 3, label: "Execute", icon: Database },
  { id: 4, label: "Result", icon: Check },
] as const;

function parseProducts(text: string): unknown[] | undefined {
  const t = text.trim();
  if (!t) return undefined;
  try {
    const j = JSON.parse(t);
    return Array.isArray(j) ? j : undefined;
  } catch {
    return undefined;
  }
}

export default function AdminOnboardingWizardPage() {
  const { tenantId } = useTenant();
  const [step, setStep] = useState(1);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthOk, setHealthOk] = useState<string | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    tenant_name: "",
    description: "",
    website: "",
    country: "US",
    currency: "USD",
    language: "en",
    tagline: "",
    usp: "",
    plan: "professional",
    locationsText: "",
    productsJson: "",
  });

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);

  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardErr, setOnboardErr] = useState<string | null>(null);
  const [onboardData, setOnboardData] = useState<Record<string, unknown> | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setHealthLoading(true);
      setHealthErr(null);
      const r = await getTenantOnboardHealth();
      if (!alive) return;
      const hf = suiteFailure(r);
      if (hf) {
        setHealthErr(hf.error);
        setHealthOk(null);
      } else if (r.ok) {
        setHealthOk(
          `Agent ${String(r.data["agent"] ?? "?")} · ${String(r.data["version"] ?? "")}`
        );
        setHealthErr(null);
      }
      setHealthLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const buildBody = (): BuildProfileBody => {
    const locations = form.locationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const products = parseProducts(form.productsJson);
    return {
      tenant_name: form.tenant_name.trim(),
      description: form.description.trim() || undefined,
      website: form.website.trim() || undefined,
      country: form.country || undefined,
      currency: form.currency || undefined,
      language: form.language || undefined,
      tagline: form.tagline.trim() || undefined,
      usp: form.usp.trim() || undefined,
      plan: form.plan,
      locations: locations.length ? locations : undefined,
      products,
    };
  };

  const productsJsonValid = !form.productsJson.trim() || Boolean(parseProducts(form.productsJson));
  const canRunPreview = Boolean(form.tenant_name.trim()) && productsJsonValid;
  const previewValidationIssues = [
    !form.tenant_name.trim() ? "Tenant name is required." : null,
    !productsJsonValid ? "Products JSON must be a valid array." : null,
  ].filter(Boolean) as string[];

  const runPreview = async () => {
    setPreviewErr(null);
    setPreviewData(null);
    if (!form.tenant_name.trim()) {
      setPreviewErr("Tenant name is required.");
      return;
    }
    setPreviewLoading(true);
    const r = await postBuildProfile(buildBody());
    setPreviewLoading(false);
    const pf = suiteFailure(r);
    if (pf) {
      setPreviewErr(pf.error);
      return;
    }
    if (r.ok) {
      setPreviewData(r.data);
      setStep(2);
    }
  };

  const runOnboard = async () => {
    setOnboardErr(null);
    setOnboardData(null);
    if (!form.tenant_name.trim()) {
      setOnboardErr("Tenant name is required.");
      return;
    }
    setOnboardLoading(true);
    const r = await postTenantOnboard({
      ...buildBody(),
      confirm: confirmSave,
      dry_run: dryRun,
    });
    setOnboardLoading(false);
    const of = suiteFailure(r);
    if (of) {
      setOnboardErr(of.error);
      return;
    }
    if (r.ok) {
      setOnboardData(r.data);
      setStep(4);
    }
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin">
        <span className="text-xs text-gray-500">{tenantId ? `Context tenant: ${tenantId}` : "No tenant in context"}</span>
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Tenant onboarding</h1>
        <p className="text-gray-400 mt-1">
          Provision institutions and dealers, or continue using the existing tenant profile workflow below.
        </p>
      </motion.div>

      <SaasOnboardingWizard />

      <div className="mb-5 border-t border-white/10 pt-6">
        <h2 className="text-lg font-semibold text-white">Existing tenant profile workflow</h2>
        <p className="mt-1 text-sm text-gray-500">The preview and persistence flow remains unchanged for compatibility.</p>
      </div>

      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity className="w-4 h-4 text-emerald-400" />
          {healthLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking onboard API…
            </span>
          ) : healthErr ? (
            <span className="text-red-400">Onboard health: {healthErr}</span>
          ) : (
            <span className="text-emerald-400/90">Onboard API OK · {healthOk}</span>
          )}
        </div>
      </GlassCard>

      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm text-gray-500">
        {STEP_META.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s.id ? "bg-purple-500 text-white" : "bg-white/10 text-gray-500"
              }`}
            >
              {step > s.id ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
            </span>
            <span className={step === s.id ? "text-gray-200" : "text-gray-500"}>{s.label}</span>
            {s.id < 4 && <ChevronRight className="w-4 h-4 text-gray-600" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tenant profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-gray-500">Tenant name *</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                value={form.tenant_name}
                onChange={(e) => setForm((f) => ({ ...f, tenant_name: e.target.value }))}
                placeholder="Acme Rentals"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Plan</span>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p} className="bg-[#0d1117]">
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs text-gray-500">Description</span>
              <textarea
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Website</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Locations (comma-separated)</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                value={form.locationsText}
                onChange={(e) => setForm((f) => ({ ...f, locationsText: e.target.value }))}
                placeholder="Miami, Key West"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Country</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Language</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Tagline</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">USP</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                value={form.usp}
                onChange={(e) => setForm((f) => ({ ...f, usp: e.target.value }))}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs text-gray-500">Products (JSON array, optional)</span>
              <textarea
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-xs"
                rows={4}
                value={form.productsJson}
                onChange={(e) => setForm((f) => ({ ...f, productsJson: e.target.value }))}
                placeholder='[{"id":"t1","name":"Sunset","price":199}]'
              />
            </label>
          </div>
          {!productsJsonValid && (
            <p className="text-amber-300 text-sm mt-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              Products JSON is not a valid array. Fix it or leave it empty.
            </p>
          )}
          {previewValidationIssues.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-200 font-semibold mb-2">Complete these items before preview:</p>
              <ul className="list-disc list-inside text-sm text-amber-100/90 space-y-1">
                {previewValidationIssues.map((issue, index) => (
                  <li key={`${issue}-${index}`}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {previewErr && <p className="text-red-400 text-sm mt-4">{previewErr}</p>}
          <div className="flex flex-wrap justify-between gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-2"
            >
              Skip preview → save options
            </button>
            <button
              type="button"
              onClick={() => void runPreview()}
              disabled={previewLoading || !canRunPreview}
              className="px-5 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 disabled:opacity-50"
            >
              {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {previewLoading ? "Building preview…" : "Build preview"}
            </button>
          </div>
        </GlassCard>
      )}

      {step === 2 && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Preview result</h2>
          <p className="text-sm text-gray-400 mb-4">
            Review backend-generated profile fields before running onboarding.
          </p>
          {previewData ? (
            <pre className="text-xs text-gray-300 bg-black/30 p-4 rounded-lg overflow-auto max-h-80 overflow-x-auto">
              {JSON.stringify(previewData, null, 2)}
            </pre>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              No preview data yet. Go back to basics and run preview first.
            </div>
          )}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      )}

      {step === 3 && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Execute onboard</h2>
          <p className="text-sm text-gray-400 mb-4">
            <code className="text-gray-500">confirm=true</code> saves profile to disk. <code className="text-gray-500">dry_run</code> runs
            pipeline verification when a profile was saved.
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
            <input
              type="checkbox"
              checked={confirmSave}
              onChange={(e) => setConfirmSave(e.target.checked)}
              className="rounded border-white/20"
            />
            Save profile to disk (confirm)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 mb-6">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded border-white/20"
            />
            Pipeline verification dry run
          </label>
          {onboardErr && <p className="text-red-400 text-sm mb-4">{onboardErr}</p>}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(previewData ? 2 : 1)}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-300"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void runOnboard()}
              disabled={onboardLoading}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 disabled:opacity-50"
            >
              {onboardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {onboardLoading ? "Running onboard…" : "Run onboard"}
            </button>
          </div>
        </GlassCard>
      )}

      {step === 4 && onboardData && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Onboard complete</h2>
          <p className="text-sm text-gray-400 mb-3">
            Backend response captured successfully. Review formatted output before starting another run.
          </p>
          <pre className="text-xs text-gray-300 bg-black/30 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(onboardData, null, 2)}
          </pre>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOnboardData(null);
                setPreviewData(null);
              }}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-300"
            >
              New run
            </button>
          </div>
        </GlassCard>
      )}
      {step === 4 && !onboardData && (
        <GlassCard className="p-6">
          <p className="text-sm text-gray-400 m-0">No execution result available. Run onboarding to generate a result.</p>
        </GlassCard>
      )}
    </div>
  );
}
