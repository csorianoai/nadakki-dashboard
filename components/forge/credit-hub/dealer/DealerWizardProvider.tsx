"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildCreateApplicationPayload,
  effectiveRequiredDocuments,
  initialApplicationFormData,
  stepIsValid,
  type ApplicationFormData,
  type OtherIncomeFormRow,
  type WizardStepValidationConfig,
} from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { useCreateCreditApplication } from "@/lib/credit-hub/hooks/useCreateCreditApplication";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import {
  dealerWizardStepHref,
  dealerWizardStepIndexFromPathname,
  dealerWizardStepSlugFromIndex,
} from "./dealerWizardPaths";
import { toast } from "@/components/forge";
import { forgeToastLangFromLocale, forgeWizardToasts } from "@/utils/forge-toast-copy";

const STORAGE_KEY = "forge-dealer-wizard-draft-v1";
/** Session flag: show at most one subtle autosave success toast (institutional UX — silent thereafter). */
const AUTOSAVE_FIRST_SUCCESS_TOAST_KEY = "forge-dealer-wizard-autosave-first-success-v1";

function decodeWizardPreset(encoded: string): Record<string, unknown> | null {
  try {
    const decoded = typeof atob !== "undefined" ? atob(decodeURIComponent(encoded)) : encoded;
    const parsed: unknown = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function newOtherIncomeRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `oi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newAdditionalDocumentRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cleanDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [first, ...rest] = cleaned.split(".");
  return rest.length ? `${first}.${rest.join("")}` : first;
}

async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function segmentCanAdvance(
  stepIndex: number,
  data: ApplicationFormData,
  config: WizardStepValidationConfig,
  t: CreditHubTranslations
): boolean {
  if (stepIndex === 0) return stepIsValid(0, data, config, t) && stepIsValid(1, data, config, t);
  if (stepIndex === 1) return stepIsValid(3, data, config, t);
  if (stepIndex === 2) return stepIsValid(2, data, config, t);
  if (stepIndex === 3) return stepIsValid(4, data, config, t);
  if (stepIndex === 4) return stepIsValid(5, data, config, t);
  return false;
}

async function withConsentAuditMetadata(form: ApplicationFormData): Promise<ApplicationFormData> {
  let clientIp: string | null = null;
  try {
    const res = await fetch("/api/credit-hub/client-metadata", { cache: "no-store" });
    if (res.ok) {
      const j: unknown = await res.json();
      if (j && typeof j === "object" && "ip" in j && typeof (j as { ip: unknown }).ip === "string") {
        clientIp = (j as { ip: string }).ip;
      }
    }
  } catch {
    clientIp = null;
  }
  const signedAt = new Date().toISOString();
  const signatureDigest = await sha256Hex(form.consent_signature_full_name.trim().toLowerCase());
  const auditPayload = {
    signedAt,
    clientIp,
    signatureDigest,
    bureau: form.consent_bureau_authorization,
    terms: form.consent_terms_accepted,
    dataProcessing: form.consent_data_processing_authorization,
    presence: form.consent_presence,
    method: form.consent_method,
  };
  const consent_audit_hash = await sha256Hex(JSON.stringify(auditPayload));
  return {
    ...form,
    consent_accepted_at: signedAt,
    consent_audit_hash,
  };
}

export type DealerWizardContextValue = {
  formData: ApplicationFormData;
  updateField: <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => void;
  patchForm: (patch: Partial<ApplicationFormData>) => void;
  updateDocumentReceived: (key: string, checked: boolean) => void;
  updateDocumentNote: (key: string, note: string) => void;
  addAdditionalDocumentRow: () => void;
  updateAdditionalDocumentRow: (id: string, updates: Partial<{ label: string; received: boolean }>) => void;
  removeAdditionalDocumentRow: (id: string) => void;
  updateOtherIncomeRow: (id: string, updates: Partial<OtherIncomeFormRow>) => void;
  addOtherIncomeRow: () => void;
  removeOtherIncomeRow: (id: string) => void;
  setHasOtherIncome: (value: "yes" | "no") => void;
  validationConfig: WizardStepValidationConfig;
  defaultDocType: string;
  requiredDocumentsList: ReturnType<typeof effectiveRequiredDocuments>;
  stepIndex: number;
  canAdvance: boolean;
  goNext: () => void;
  goPrev: () => void;
  saveDraftToStorage: () => boolean;
  clearDraftStorage: () => void;
  submitApplication: () => Promise<{ application_id: string }>;
  isSubmitting: boolean;
  submitError: string | null;
  consentApplicationId: string;
  consentApplicationIdReady: boolean;
};

const DealerWizardContext = createContext<DealerWizardContextValue | null>(null);

export function useDealerWizard(): DealerWizardContextValue {
  const ctx = useContext(DealerWizardContext);
  if (!ctx) throw new Error("useDealerWizard must be used within DealerWizardProvider");
  return ctx;
}

export function DealerWizardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consentApplicationId = searchParams.get("application_id")?.trim() ?? "";
  const consentApplicationIdReady = Boolean(consentApplicationId);
  const { tenantConfig } = useTenantConfig();
  const t = useTranslations();
  const defaultDocType = tenantConfig.document_types.primary_id ?? "CEDULA";
  const requiredDocumentsList = useMemo(() => effectiveRequiredDocuments(tenantConfig), [tenantConfig]);

  const validationConfig = useMemo(
    (): WizardStepValidationConfig => ({
      min_age: tenantConfig.min_age,
      max_age: tenantConfig.max_age,
      garante_required: tenantConfig.features_enabled.garante_required,
      default_document_type: defaultDocType,
      required_documents: requiredDocumentsList,
      consent_application_id_ready: consentApplicationIdReady,
    }),
    [
      tenantConfig.min_age,
      tenantConfig.max_age,
      tenantConfig.features_enabled.garante_required,
      defaultDocType,
      requiredDocumentsList,
      consentApplicationIdReady,
    ]
  );

  const [formData, setFormData] = useState<ApplicationFormData>(initialApplicationFormData);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const hydratedRef = useRef(false);
  const presetAppliedRef = useRef(false);
  const createMutation = useCreateCreditApplication();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stepIndex = dealerWizardStepIndexFromPathname(pathname);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialApplicationFormData),
    [formData]
  );

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      setFormData((prev) => ({ ...prev, ...(parsed as Partial<ApplicationFormData>) }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!tenantConfig.features_enabled.garante_required) return;
    setFormData((prev) => (prev.co_debtor_required === "yes" ? prev : { ...prev, co_debtor_required: "yes" }));
  }, [tenantConfig.features_enabled.garante_required]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (presetAppliedRef.current) return;
    const encoded = searchParams.get("preset");
    if (!encoded) return;
    const raw = decodeWizardPreset(encoded);
    if (!raw) return;
    presetAppliedRef.current = true;
    const toStr = (v: unknown) => (v == null ? "" : String(v));
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v));
    const loanFromFields =
      raw.vehiclePrice != null && raw.downPayment != null ? Math.max(0, num(raw.vehiclePrice) - num(raw.downPayment)) : null;
    setFormData((prev) => ({
      ...prev,
      monthly_income: raw.monthlyIncome != null ? toStr(raw.monthlyIncome) : prev.monthly_income,
      monthly_debts: raw.monthlyDebts != null ? toStr(raw.monthlyDebts) : prev.monthly_debts,
      vehicle_price: raw.vehiclePrice != null ? toStr(raw.vehiclePrice) : prev.vehicle_price,
      down_payment: raw.downPayment != null ? toStr(raw.downPayment) : prev.down_payment,
      desired_term: raw.termMonths != null ? `${Math.max(1, Math.round(num(raw.termMonths)))} meses` : prev.desired_term,
      requested_amount:
        raw.loanAmount != null
          ? toStr(raw.loanAmount)
          : loanFromFields != null
            ? toStr(loanFromFields)
            : prev.requested_amount,
      applicant_age: raw.age != null ? toStr(raw.age) : prev.applicant_age,
    }));
  }, [searchParams]);

  const updateField = useCallback(<K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const patchForm = useCallback((patch: Partial<ApplicationFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateDocumentReceived = useCallback((key: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      documents_received: { ...prev.documents_received, [key]: checked },
    }));
  }, []);

  const updateDocumentNote = useCallback((key: string, note: string) => {
    setFormData((prev) => ({
      ...prev,
      document_notes: { ...prev.document_notes, [key]: note },
    }));
  }, []);

  const addAdditionalDocumentRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      additional_document_items: [...prev.additional_document_items, { id: newAdditionalDocumentRowId(), label: "", received: false }],
    }));
  }, []);

  const updateAdditionalDocumentRow = useCallback((id: string, updates: Partial<{ label: string; received: boolean }>) => {
    setFormData((prev) => ({
      ...prev,
      additional_document_items: prev.additional_document_items.map((row) => (row.id === id ? { ...row, ...updates } : row)),
    }));
  }, []);

  const removeAdditionalDocumentRow = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      additional_document_items: prev.additional_document_items.filter((row) => row.id !== id),
    }));
  }, []);

  const updateOtherIncomeRow = useCallback((id: string, updates: Partial<OtherIncomeFormRow>) => {
    setFormData((prev) => ({
      ...prev,
      other_incomes: prev.other_incomes.map((row) => (row.id === id ? { ...row, ...updates } : row)),
    }));
  }, []);

  const addOtherIncomeRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      other_incomes: [
        ...prev.other_incomes,
        {
          id: newOtherIncomeRowId(),
          concept: "Otro",
          amount: "",
          frequency: "MENSUAL",
          is_documented: false,
        },
      ],
    }));
  }, []);

  const removeOtherIncomeRow = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      other_incomes: prev.other_incomes.filter((row) => row.id !== id),
    }));
  }, []);

  const setHasOtherIncome = useCallback((value: "yes" | "no") => {
    setFormData((prev) => {
      if (value === "yes" && prev.other_incomes.length === 0) {
        return {
          ...prev,
          has_other_income: value,
          other_incomes: [
            {
              id: newOtherIncomeRowId(),
              concept: "Otro",
              amount: "",
              frequency: "MENSUAL",
              is_documented: false,
            },
          ],
        };
      }
      return { ...prev, has_other_income: value, other_incomes: value === "no" ? [] : prev.other_incomes };
    });
  }, []);

  const canAdvance = useMemo(
    () => segmentCanAdvance(stepIndex, formData, validationConfig, t),
    [formData, stepIndex, validationConfig, t]
  );

  const goNext = useCallback(() => {
    if (!segmentCanAdvance(stepIndex, formData, validationConfig, t)) return;
    const next = Math.min(stepIndex + 1, 4);
    router.push(dealerWizardStepHref(dealerWizardStepSlugFromIndex(next)));
  }, [formData, router, stepIndex, validationConfig, t]);

  const goPrev = useCallback(() => {
    const prev = Math.max(stepIndex - 1, 0);
    router.push(dealerWizardStepHref(dealerWizardStepSlugFromIndex(prev)));
  }, [router, stepIndex]);

  const saveDraftToStorage = useCallback((): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formDataRef.current));
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearDraftStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(AUTOSAVE_FIRST_SUCCESS_TOAST_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      let ok = false;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formDataRef.current));
        ok = true;
      } catch {
        ok = false;
      }
      const lang = forgeToastLangFromLocale(tenantConfig.locale);
      const copy = forgeWizardToasts(lang);
      if (ok) {
        if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(AUTOSAVE_FIRST_SUCCESS_TOAST_KEY)) {
          sessionStorage.setItem(AUTOSAVE_FIRST_SUCCESS_TOAST_KEY, "1");
          toast.info(copy.draftSaved, {
            duration: 2000,
            className:
              "border-forgeInk-100/80 bg-forgeSurface-sunken/95 text-forgeInk-600 shadow-forge-sm opacity-95 saturate-75",
          });
        }
      } else {
        toast.warning(copy.draftSaveFailed, {
          id: "forge-dealer-autosave-error",
          duration: 60_000,
          action: {
            label: copy.retry,
            onClick: () => {
              const saved = saveDraftToStorage();
              if (saved) {
                toast.success(copy.draftSaved, { duration: 2000 });
              }
            },
          },
        });
      }
    }, 10_000);
    return () => window.clearInterval(id);
  }, [tenantConfig.locale, saveDraftToStorage]);

  const submitApplication = useCallback(async () => {
    if (!stepIsValid(5, formData, validationConfig, t)) {
      setSubmitError(t.validation.consents_required);
      throw new Error(t.validation.consents_required);
    }
    setSubmitError(null);
    try {
      const normalizedForm: ApplicationFormData = {
        ...formData,
        co_debtor_employment:
          formData.co_debtor_required === "yes" || validationConfig.garante_required
            ? formData.co_debtor_employment.trim() || "Empleado(a)"
            : formData.co_debtor_employment,
      };
      const withMeta = await withConsentAuditMetadata(normalizedForm);
      const result = await createMutation.mutateAsync(
        buildCreateApplicationPayload(withMeta, { defaultDocumentType: defaultDocType })
      );
      clearDraftStorage();
      setFormData(initialApplicationFormData);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.toasts.application_failed;
      setSubmitError(msg);
      throw err;
    }
  }, [clearDraftStorage, defaultDocType, formData, createMutation, validationConfig, t]);

  const value = useMemo(
    (): DealerWizardContextValue => ({
      formData,
      updateField,
      patchForm,
      updateDocumentReceived,
      updateDocumentNote,
      addAdditionalDocumentRow,
      updateAdditionalDocumentRow,
      removeAdditionalDocumentRow,
      updateOtherIncomeRow,
      addOtherIncomeRow,
      removeOtherIncomeRow,
      setHasOtherIncome,
      validationConfig,
      defaultDocType,
      requiredDocumentsList,
      stepIndex,
      canAdvance,
      goNext,
      goPrev,
      saveDraftToStorage,
      clearDraftStorage,
      submitApplication,
      isSubmitting: createMutation.isPending,
      submitError,
      consentApplicationId,
      consentApplicationIdReady,
    }),
    [
      formData,
      updateField,
      patchForm,
      updateDocumentReceived,
      updateDocumentNote,
      addAdditionalDocumentRow,
      updateAdditionalDocumentRow,
      removeAdditionalDocumentRow,
      updateOtherIncomeRow,
      addOtherIncomeRow,
      removeOtherIncomeRow,
      setHasOtherIncome,
      validationConfig,
      defaultDocType,
      requiredDocumentsList,
      stepIndex,
      canAdvance,
      goNext,
      goPrev,
      saveDraftToStorage,
      clearDraftStorage,
      submitApplication,
      createMutation.isPending,
      submitError,
      consentApplicationId,
      consentApplicationIdReady,
    ]
  );

  return <DealerWizardContext.Provider value={value}>{children}</DealerWizardContext.Provider>;
}

export { cleanDecimalInput };
