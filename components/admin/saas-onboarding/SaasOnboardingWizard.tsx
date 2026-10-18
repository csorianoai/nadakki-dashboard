"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, Loader2, Store } from "lucide-react";

import {
  createDealer,
  createInstitution,
  getOnboardingStatus,
  OnboardingApiError,
  type OnboardingResult,
} from "@/lib/admin/saas-onboarding-api";

type Mode = "institution" | "dealer";

type InstitutionForm = {
  tenantName: string;
  slug: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  lenderCode: string;
  adapterPath: "existing" | "new";
};

type DealerForm = {
  dealerName: string;
  slug: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  institutionTenantId: string;
  allowedLenders: string;
  allowedProducts: string;
  documentRules: string;
};

const EMPTY_INSTITUTION: InstitutionForm = {
  tenantName: "",
  slug: "",
  adminEmail: "",
  adminName: "",
  adminPassword: "",
  lenderCode: "",
  adapterPath: "existing",
};

const EMPTY_DEALER: DealerForm = {
  dealerName: "",
  slug: "",
  adminEmail: "",
  adminName: "",
  adminPassword: "",
  institutionTenantId: "",
  allowedLenders: "",
  allowedProducts: "auto, personal",
  documentRules: "{}",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-purple-400";

function splitCsv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function messageFor(error: unknown): string {
  if (error instanceof OnboardingApiError) {
    if (error.status === 401) return "Your session expired. Sign in again before retrying.";
    if (error.status === 403) return "Platform or institution administrator permission is required.";
    if (error.status === 409) return "This institution or dealer already exists. Review its onboarding status.";
    return error.message;
  }
  return "Onboarding failed. No successful state was assumed.";
}

function statusClass(status: string): string {
  if (status === "ACTIVE") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "FAILED") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (status === "PENDING_ADAPTER" || status === "PENDING_INTEGRATION") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  return "border-white/15 bg-white/5 text-gray-200";
}

export function SaasOnboardingWizard() {
  const [mode, setMode] = useState<Mode>("institution");
  const [institution, setInstitution] = useState<InstitutionForm>(EMPTY_INSTITUTION);
  const [dealer, setDealer] = useState<DealerForm>(EMPTY_DEALER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setResult(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let created: OnboardingResult;
      if (mode === "institution") {
        created = await createInstitution({
          tenant_name: institution.tenantName.trim(),
          slug: institution.slug.trim().toLowerCase(),
          institution_type: "bank",
          plan: "professional",
          subscribed_cores: ["credit"],
          admin_email: institution.adminEmail.trim(),
          admin_name: institution.adminName.trim() || undefined,
          admin_password: institution.adminPassword,
          lender_config: {
            lender_code: institution.lenderCode.trim().toLowerCase(),
            adapter_type: institution.adapterPath === "existing" ? "pilot" : "custom",
          },
          external_ref: `ui:institution:${institution.slug.trim().toLowerCase()}`,
        });
      } else {
        const products = splitCsv(dealer.allowedProducts);
        const documentRules = JSON.parse(dealer.documentRules || "{}");
        created = await createDealer({
          institution_tenant_id: dealer.institutionTenantId.trim(),
          dealer_name: dealer.dealerName.trim(),
          dealer_slug: dealer.slug.trim().toLowerCase(),
          dealer_type: "independent",
          contact_email: dealer.adminEmail.trim(),
          admin_email: dealer.adminEmail.trim(),
          admin_name: dealer.adminName.trim() || undefined,
          admin_password: dealer.adminPassword,
          allowed_product_types: products,
          lender_access: splitCsv(dealer.allowedLenders).map((lenderCode) => ({
            lender_code: lenderCode.toLowerCase(),
            allowed_product_types: products,
            document_rules: documentRules,
          })),
          external_ref: `ui:dealer:${dealer.slug.trim().toLowerCase()}`,
        });
      }

      setResult(created);
      const entityId = created.tenant_id || created.dealer_id || created.entity_id;
      if (entityId) {
        const status = await getOnboardingStatus(entityId).catch(() => null);
        if (status) setResult({ ...created, ...status });
      }
    } catch (caught) {
      setError(
        caught instanceof SyntaxError
          ? "Document rules must contain valid JSON."
          : messageFor(caught),
      );
    } finally {
      setLoading(false);
      setInstitution((current) => ({ ...current, adminPassword: "" }));
      setDealer((current) => ({ ...current, adminPassword: "" }));
    }
  };

  return (
    <section data-testid="saas-onboarding-wizard" aria-labelledby="saas-onboarding-title" className="mb-10 space-y-5">
      <div>
        <h2 id="saas-onboarding-title" className="text-xl font-semibold text-white">Institution and dealer provisioning</h2>
        <p className="mt-1 text-sm text-gray-400">Creates tenant-isolated records through the protected admin API and reads back the final status.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Onboarding type">
        <button type="button" data-testid="mode-institution" aria-pressed={mode === "institution"} onClick={() => changeMode("institution")} className={`rounded-xl border p-4 text-left ${mode === "institution" ? "border-purple-400 bg-purple-500/10" : "border-white/10 bg-white/5"}`}>
          <Building2 className="mb-2 h-5 w-5 text-purple-300" />
          <strong className="text-white">Create institution</strong>
        </button>
        <button type="button" data-testid="mode-dealer" aria-pressed={mode === "dealer"} onClick={() => changeMode("dealer")} className={`rounded-xl border p-4 text-left ${mode === "dealer" ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}>
          <Store className="mb-2 h-5 w-5 text-cyan-300" />
          <strong className="text-white">Create dealer</strong>
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 md:grid-cols-2">
        {mode === "institution" ? (
          <>
            <label className="text-sm text-gray-300">Institution name<input data-testid="field-tenant-name" required className={inputClass} value={institution.tenantName} onChange={(event) => setInstitution({ ...institution, tenantName: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Slug<input data-testid="field-institution-slug" required pattern="[a-z0-9][a-z0-9-]*[a-z0-9]" className={inputClass} value={institution.slug} onChange={(event) => setInstitution({ ...institution, slug: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Admin email<input data-testid="field-institution-email" required type="email" className={inputClass} value={institution.adminEmail} onChange={(event) => setInstitution({ ...institution, adminEmail: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Admin name<input data-testid="field-institution-admin-name" className={inputClass} value={institution.adminName} onChange={(event) => setInstitution({ ...institution, adminName: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Temporary admin password<input data-testid="field-institution-password" required minLength={12} type="password" autoComplete="new-password" className={inputClass} value={institution.adminPassword} onChange={(event) => setInstitution({ ...institution, adminPassword: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Lender code<input data-testid="field-lender-code" required className={inputClass} value={institution.lenderCode} onChange={(event) => setInstitution({ ...institution, lenderCode: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Adapter path<select data-testid="field-adapter-path" className={inputClass} value={institution.adapterPath} onChange={(event) => setInstitution({ ...institution, adapterPath: event.target.value as InstitutionForm["adapterPath"] })}><option value="existing">Existing adapter</option><option value="new">New adapter</option></select></label>
          </>
        ) : (
          <>
            <label className="text-sm text-gray-300">Dealer name<input data-testid="field-dealer-name" required className={inputClass} value={dealer.dealerName} onChange={(event) => setDealer({ ...dealer, dealerName: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Slug<input data-testid="field-dealer-slug" required pattern="[a-z0-9][a-z0-9-]*[a-z0-9]" className={inputClass} value={dealer.slug} onChange={(event) => setDealer({ ...dealer, slug: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Admin email<input data-testid="field-dealer-email" required type="email" className={inputClass} value={dealer.adminEmail} onChange={(event) => setDealer({ ...dealer, adminEmail: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Admin name<input data-testid="field-dealer-admin-name" className={inputClass} value={dealer.adminName} onChange={(event) => setDealer({ ...dealer, adminName: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Temporary admin password<input data-testid="field-dealer-password" required minLength={12} type="password" autoComplete="new-password" className={inputClass} value={dealer.adminPassword} onChange={(event) => setDealer({ ...dealer, adminPassword: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Institution tenant UUID<input data-testid="field-institution-tenant" required className={inputClass} value={dealer.institutionTenantId} onChange={(event) => setDealer({ ...dealer, institutionTenantId: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Allowed lenders<input data-testid="field-allowed-lenders" required className={inputClass} value={dealer.allowedLenders} onChange={(event) => setDealer({ ...dealer, allowedLenders: event.target.value })} /></label>
            <label className="text-sm text-gray-300">Allowed products<input data-testid="field-allowed-products" required className={inputClass} value={dealer.allowedProducts} onChange={(event) => setDealer({ ...dealer, allowedProducts: event.target.value })} /></label>
            <label className="text-sm text-gray-300 md:col-span-2">Document rules (JSON)<textarea data-testid="field-document-rules" required className={inputClass} value={dealer.documentRules} onChange={(event) => setDealer({ ...dealer, documentRules: event.target.value })} /></label>
          </>
        )}

        <div className="md:col-span-2">
          {error ? <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div> : null}
          {result ? <div role="status" data-testid="onboarding-result" className={`mb-4 flex gap-2 rounded-lg border p-3 ${statusClass(result.onboarding_status)}`}><CheckCircle2 className="h-5 w-5 shrink-0" /><span><strong>{result.onboarding_status}</strong> · {result.tenant_id || result.dealer_id || result.entity_id}{result.idempotent ? " · idempotent replay" : ""}</span></div> : null}
          <button data-testid="submit-onboarding" disabled={loading} className="rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white disabled:opacity-50">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating…</span> : `Create ${mode}`}
          </button>
          <p className="mt-3 text-xs text-gray-500">The temporary password is sent only in the authenticated request and cleared from this form after every attempt.</p>
        </div>
      </form>
    </section>
  );
}
