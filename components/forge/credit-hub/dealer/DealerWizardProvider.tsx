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
import { useAuth } from "@/hooks/useAuth";
import {
  buildWizardDraftStorageKey,
  purgeLegacyGlobalWizardDraftKeys,
  WIZARD_AUTOSAVE_TOAST_SESSION_KEY,
} from "@/lib/credit-hub/dealer/wizard-draft-storage";
import {
  buildCreateApplicationPayload,
  initialApplicationFormData,
  stepIsValid,
  type ApplicationFormData,
  type OtherIncomeFormRow,
  type WizardStepValidationConfig,
  effectiveWizardDocuments,
  tenantDocumentKey,
} from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { createDraftApplication, getApplication, processApplication } from "@/lib/credit-hub/api/creditCoreClient";
import { patchApplicationFields } from "@/lib/credit-hub/api/operationalClient";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import {
  dealerWizardStepHref,
  dealerWizardStepIndexFromPathname,
  dealerWizardStepSlugFromIndex,
} from "./dealerWizardPaths";
import { toast } from "@/components/forge";
import { forgeToastLangFromLocale, forgeWizardToasts } from "@/utils/forge-toast-copy";
import { uploadDocument } from "@/lib/credit-api";
import type { UploadStatus } from "./DocumentUploadZone";
import { dealerWizardErrorMessage } from "@/lib/credit-hub/dealer/wizard-error";

import { defaultDocumentTypeForCountry } from "@/lib/credit-hub/dealer/dealerFormat";
import {
  createEmptyPersonalReference,
  missingRequiredDocumentLabels,
  PERSONAL_REFERENCES_MAX,
  PERSONAL_REFERENCES_MIN,
  wizardDocumentsStepValid,
  type PersonalReferenceFormRow,
} from "@/lib/credit-hub/dealer/wizard-gates";
import {
  getWizardSegmentValidation,
  logPersonalReferencesDebug,
  scrollToFirstWizardError,
  wizardBlockReasonMessage,
  type WizardFieldErrors,
} from "@/lib/credit-hub/dealer/wizard-field-errors";

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

function hydrateFormFromServer(raw: unknown): Partial<ApplicationFormData> {
  if (!raw || typeof raw !== "object") return {};
  const record = raw as Record<string, unknown>;
  const payload = (record.application_payload && typeof record.application_payload === "object"
    ? record.application_payload
    : {}) as Record<string, unknown>;
  const section = (key: string) => (payload[key] && typeof payload[key] === "object" ? payload[key] : {}) as Record<string, unknown>;
  const applicant = section("applicant");
  const employment = section("employment");
  const financial = section("financial");
  const vehicle = section("vehicle");
  const coDebtor = section("co_debtor");
  const consents = section("consents");
  const stringValue = (...values: unknown[]) => {
    const value = values.find((candidate) => candidate !== null && candidate !== undefined);
    return value === undefined ? undefined : String(value);
  };
  const boolValue = (...values: unknown[]) => {
    const value = values.find((candidate) => typeof candidate === "boolean");
    return typeof value === "boolean" ? value : undefined;
  };
  const patch: Partial<ApplicationFormData> = {
    applicant_full_name: stringValue(applicant.full_name),
    applicant_document_type: stringValue(applicant.document_type),
    applicant_document_other_type: stringValue(applicant.document_other_type),
    applicant_identification: stringValue(applicant.identification),
    applicant_date_of_birth: stringValue(applicant.date_of_birth),
    applicant_marital_status: stringValue(applicant.marital_status),
    applicant_phone: stringValue(applicant.phone),
    applicant_email: stringValue(applicant.email),
    applicant_address: stringValue(applicant.address),
    applicant_city: stringValue(applicant.city ?? applicant.municipality),
    applicant_province: stringValue(applicant.province),
    applicant_country: stringValue(applicant.country),
    employment_type: stringValue(employment.employment_type),
    employer_name: stringValue(employment.employer_name),
    employment_position: stringValue(employment.position),
    employment_start_date: stringValue(employment.employment_start_date),
    employer_address: stringValue(employment.employer_address),
    employer_province: stringValue(employment.employer_province),
    employer_city: stringValue(employment.employer_municipality),
    contract_type: stringValue(employment.contract_type),
    monthly_income: stringValue(employment.monthly_income),
    work_phone: stringValue(employment.work_phone),
    requested_amount: stringValue(financial.requested_amount),
    desired_term: stringValue(financial.desired_term),
    down_payment: stringValue(financial.down_payment),
    monthly_debts: stringValue(financial.monthly_debts),
    estimated_monthly_expenses: stringValue(financial.estimated_monthly_expenses),
    vehicle_make: stringValue(vehicle.make),
    vehicle_model: stringValue(vehicle.model),
    vehicle_version: stringValue(vehicle.version),
    vehicle_year: stringValue(vehicle.year),
    vehicle_color: stringValue(vehicle.color),
    vehicle_price: stringValue(vehicle.price),
    dealer_supplier: stringValue(vehicle.dealer_supplier),
    vehicle_condition: stringValue(vehicle.condition),
    vehicle_mileage: stringValue(vehicle.mileage),
    co_debtor_required: boolValue(coDebtor.required) === true ? "yes" : boolValue(coDebtor.required) === false ? "no" : undefined,
    co_debtor_full_name: stringValue(coDebtor.full_name),
    co_debtor_document_type: stringValue(coDebtor.document_type),
    co_debtor_document_other_type: stringValue(coDebtor.document_other_type),
    co_debtor_identification: stringValue(coDebtor.identification),
    co_debtor_date_of_birth: stringValue(coDebtor.date_of_birth),
    co_debtor_email: stringValue(coDebtor.email),
    co_debtor_address: stringValue(coDebtor.address),
    co_debtor_province: stringValue(coDebtor.province),
    co_debtor_city: stringValue(coDebtor.municipality),
    co_debtor_phone: stringValue(coDebtor.phone),
    co_debtor_monthly_income: stringValue(coDebtor.monthly_income),
    co_debtor_relationship: stringValue(coDebtor.relationship),
    co_debtor_employment: stringValue(coDebtor.employment),
    co_debtor_employer_name: stringValue(coDebtor.employer_name),
    co_debtor_employment_start_date: stringValue(coDebtor.employment_start_date),
    consent_presence: stringValue(consents.presence) as ApplicationFormData["consent_presence"] | undefined,
    consent_bureau_authorization: boolValue(consents.bureau_authorization),
    consent_terms_accepted: boolValue(consents.terms_accepted),
    consent_data_processing_authorization: boolValue(consents.data_processing_authorization),
    consent_signature_full_name: stringValue(consents.signature_full_name),
    consent_method: stringValue(consents.consent_method),
    consent_audit_hash: stringValue(consents.consent_audit_hash),
    consent_accepted_at: stringValue(consents.consent_accepted_at),
  };
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<ApplicationFormData>;
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
  if (stepIndex === 0) return stepIsValid(5, data, config, t);
  if (stepIndex === 1) return stepIsValid(0, data, config, t) && stepIsValid(1, data, config, t);
  if (stepIndex === 2) return stepIsValid(3, data, config, t);
  if (stepIndex === 3) return stepIsValid(2, data, config, t);
  if (stepIndex === 4) return stepIsValid(4, data, config, t);
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

/** Map wizard document keys to backend document_type enum values. */
const DOC_KEY_TO_BACKEND_TYPE: Record<string, string> = {
  id_front: "CEDULA_FRENTE",
  id_back: "CEDULA_REVERSO",
  employment_letter: "CARTA_TRABAJO",
  pay_stubs: "RECIBO_NOMINA",
  bank_statements: "ESTADO_CUENTA",
  income_evidence: "RECIBO_NOMINA",
  tax_return: "OTRO",
  address_proof: "COMPROBANTE_DOMICILIO",
  vehicle_documents: "REGISTRO_VEHICULO",
  personal_references: "OTRO",
  other_documents: "OTRO",
};

export interface PendingFileEntry {
  file: File;
  status: UploadStatus;
  previewUrl: string | null;
  errorMessage: string | null;
}

export type DealerWizardContextValue = {
  formData: ApplicationFormData;
  updateField: <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => void;
  patchForm: (patch: Partial<ApplicationFormData>) => void;
  updateDocumentReceived: (key: string, checked: boolean) => void;
  toggleDocumentSelected: (key: string, selected: boolean) => void;
  updateDocumentNote: (key: string, note: string) => void;
  addAdditionalDocumentRow: () => void;
  updateAdditionalDocumentRow: (id: string, updates: Partial<{ label: string; received: boolean }>) => void;
  removeAdditionalDocumentRow: (id: string) => void;
  updateOtherIncomeRow: (id: string, updates: Partial<OtherIncomeFormRow>) => void;
  addOtherIncomeRow: () => void;
  removeOtherIncomeRow: (id: string) => void;
  setHasOtherIncome: (value: "yes" | "no") => void;
  updatePersonalReference: (id: string, updates: Partial<PersonalReferenceFormRow>) => void;
  addPersonalReference: () => void;
  removePersonalReference: (id: string) => void;
  validationConfig: WizardStepValidationConfig;
  defaultDocType: string;
  requiredDocumentsList: ReturnType<typeof effectiveWizardDocuments>;
  stepIndex: number;
  canAdvance: boolean;
  goNext: () => Promise<boolean>;
  goPrev: () => void;
  saveDraftToStorage: () => boolean;
  clearDraftStorage: () => void;
  submitApplication: () => Promise<{ application_id: string }>;
  isSubmitting: boolean;
  submitError: string | null;
  consentApplicationId: string;
  consentApplicationIdReady: boolean;
  pendingFiles: Map<string, PendingFileEntry>;
  setPendingFile: (key: string, file: File | null) => void;
  showValidationErrors: boolean;
  fieldErrors: WizardFieldErrors;
  blockReason: string | null;
  getFieldError: (key: string) => string | undefined;
  attemptAdvance: () => Promise<boolean>;
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
  const defaultDocType = defaultDocumentTypeForCountry(
    tenantConfig.country_code,
    tenantConfig.document_types.primary_id ?? "CEDULA",
  );
  const requiredDocumentsList = useMemo(() => effectiveWizardDocuments(tenantConfig), [tenantConfig]);

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

  const { tenantId } = useTenant();
  const { user } = useAuth();
  const storageKey = useMemo(
    () => (tenantId && user?.id ? buildWizardDraftStorageKey(tenantId, user.id) : null),
    [tenantId, user?.id],
  );
  const applicationIdStorageKey = useMemo(
    () => (storageKey ? `${storageKey}:application-id` : null),
    [storageKey],
  );

  const [formData, setFormData] = useState<ApplicationFormData>(initialApplicationFormData);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const loadedStorageKeyRef = useRef<string | null>(null);
  const loadedApplicationIdKeyRef = useRef<string | null>(null);
  const hydratedApplicationIdRef = useRef<string | null>(null);

  // --- Pending document files (not serializable to localStorage) ---
  const [pendingFiles, setPendingFiles] = useState<Map<string, PendingFileEntry>>(new Map());
  const pendingFilesRef = useRef(pendingFiles);
  pendingFilesRef.current = pendingFiles;
  const presetAppliedRef = useRef(false);
  const draftCreationRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const stepIndex = dealerWizardStepIndexFromPathname(pathname);

  useEffect(() => {
    if (!applicationIdStorageKey || consentApplicationId) return;
    if (loadedApplicationIdKeyRef.current === applicationIdStorageKey) return;
    loadedApplicationIdKeyRef.current = applicationIdStorageKey;
    try {
      const savedApplicationId = localStorage.getItem(applicationIdStorageKey)?.trim();
      if (!savedApplicationId) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("application_id", savedApplicationId);
      router.replace(`${pathname}?${params.toString()}`);
    } catch {
      /* localStorage can be unavailable in privacy-restricted browsers */
    }
  }, [applicationIdStorageKey, consentApplicationId, pathname, router, searchParams]);

  useEffect(() => {
    setShowValidationErrors(false);
  }, [stepIndex]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialApplicationFormData),
    [formData]
  );

  useEffect(() => {
    purgeLegacyGlobalWizardDraftKeys();
  }, []);

  useEffect(() => {
    if (!storageKey) return;
    if (loadedStorageKeyRef.current === storageKey) return;
    loadedStorageKeyRef.current = storageKey;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setFormData(initialApplicationFormData);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      const partial = parsed as Partial<ApplicationFormData>;
      
      setFormData((prev) => {
        // Recalculate requested_amount if missing (repairs old drafts from before PR #387)
        // This handles drafts saved with empty requested_amount when vehicle_price/down_payment exist
        let loadedData = {
          ...prev,
          ...partial,
          personal_references:
            Array.isArray(partial.personal_references) && partial.personal_references.length > 0
              ? partial.personal_references
              : prev.personal_references,
          document_files_ready: partial.document_files_ready ?? prev.document_files_ready ?? {},
        };
        
        const price = Number(loadedData.vehicle_price) || 0;
        const down = Number(loadedData.down_payment) || 0;
        if (price > 0 && (!loadedData.requested_amount || loadedData.requested_amount === "")) {
          loadedData.requested_amount = String(Math.max(0, price - down));
        }
        
        return loadedData;
      });
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!tenantId || !consentApplicationId || hydratedApplicationIdRef.current === consentApplicationId) return;
    hydratedApplicationIdRef.current = consentApplicationId;
    void getApplication({ tenantId, applicationId: consentApplicationId })
      .then((application) => {
        const serverPatch = hydrateFormFromServer(application.raw);
        if (Object.keys(serverPatch).length > 0) {
          setFormData((previous) => ({ ...previous, ...serverPatch }));
        }
      })
      .catch(() => {
        // A server draft may be unavailable while the local draft remains usable.
      });
  }, [consentApplicationId, tenantId]);

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
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      
      // Auto-derive requested_amount when vehicle_price or down_payment change
      // This is the SINGLE source of truth for requested_amount calculation
      if (field === 'vehicle_price' || field === 'down_payment') {
        const price = Number(field === 'vehicle_price' ? value as string : next.vehicle_price) || 0;
        const down = Number(field === 'down_payment' ? value as string : next.down_payment) || 0;
        next.requested_amount = price > 0 ? String(Math.max(0, price - down)) : "";
      }
      
      return next;
    });
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

  const updatePersonalReference = useCallback((id: string, updates: Partial<PersonalReferenceFormRow>) => {
    setFormData((prev) => ({
      ...prev,
      personal_references: prev.personal_references.map((row) => (row.id === id ? { ...row, ...updates } : row)),
    }));
  }, []);

  const addPersonalReference = useCallback(() => {
    setFormData((prev) => {
      if (prev.personal_references.length >= PERSONAL_REFERENCES_MAX) return prev;
      return { ...prev, personal_references: [...prev.personal_references, createEmptyPersonalReference()] };
    });
  }, []);

  const removePersonalReference = useCallback((id: string) => {
    setFormData((prev) => {
      if (prev.personal_references.length <= PERSONAL_REFERENCES_MIN) return prev;
      return { ...prev, personal_references: prev.personal_references.filter((row) => row.id !== id) };
    });
  }, []);

  const setPendingFile = useCallback((key: string, file: File | null) => {
    setPendingFiles((prev) => {
      const next = new Map(prev);
      const old = prev.get(key);
      if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl);

      if (!file) {
        next.delete(key);
      } else {
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        next.set(key, { file, status: "selected", previewUrl, errorMessage: null });
      }
      return next;
    });
    setFormData((prev) => ({
      ...prev,
      documents_received: { ...prev.documents_received, [key]: file !== null ? true : prev.documents_received[key] },
      document_files_ready: { ...prev.document_files_ready, [key]: file !== null },
    }));
  }, []);

  const toggleDocumentSelected = useCallback(
    (key: string, selected: boolean) => {
      if (!selected) {
        setPendingFiles((prev) => {
          const next = new Map(prev);
          const old = prev.get(key);
          if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl);
          next.delete(key);
          return next;
        });
      }
      setFormData((prev) => ({
        ...prev,
        documents_received: { ...prev.documents_received, [key]: selected },
        document_files_ready: selected
          ? prev.document_files_ready
          : { ...prev.document_files_ready, [key]: false },
      }));
    },
    [],
  );

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      pendingFilesRef.current.forEach((entry) => {
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      });
    };
  }, []);

  const canAdvance = useMemo(
    () => segmentCanAdvance(stepIndex, formData, validationConfig, t),
    [formData, stepIndex, validationConfig, t]
  );

  const validationResult = useMemo(
    () => getWizardSegmentValidation(stepIndex, formData, validationConfig, t),
    [stepIndex, formData, validationConfig, t],
  );

  const fieldErrors = showValidationErrors ? validationResult.errors : {};
  const blockReason = showValidationErrors ? wizardBlockReasonMessage(validationResult.summaries) : null;

  const getFieldError = useCallback(
    (key: string) => (showValidationErrors ? fieldErrors[key] : undefined),
    [showValidationErrors, fieldErrors],
  );

  const buildStepFields = useCallback((step: number): Record<string, unknown> => {
    const payload = buildCreateApplicationPayload(formDataRef.current, {
      defaultDocumentType: defaultDocType,
      wizardDocuments: requiredDocumentsList,
    }) as unknown as Record<string, unknown>;
    if (step === 0) return { consents: payload.consents };
    if (step === 1) return { applicant: payload.applicant, employment: payload.employment };
    if (step === 2) return { co_debtor: payload.co_debtor };
    if (step === 3) return { financial: payload.financial, vehicle: payload.vehicle };
    return { documents: payload.documents, documentos: payload.documentos };
  }, [defaultDocType, requiredDocumentsList]);

  const persistApplicationId = useCallback((applicationId: string) => {
    if (!applicationIdStorageKey) return;
    try {
      localStorage.setItem(applicationIdStorageKey, applicationId);
    } catch {
      /* the URL remains the source of truth for the current session */
    }
  }, [applicationIdStorageKey]);

  const ensureDraftApplication = useCallback(async (): Promise<string> => {
    if (consentApplicationId) return consentApplicationId;
    if (!tenantId) throw new Error("No se pudo identificar la institución");
    if (draftCreationRef.current) {
      throw new Error("El borrador todavía se está creando");
    }
    draftCreationRef.current = true;
    try {
      const draft = await createDraftApplication({ tenantId });
      persistApplicationId(draft.application_id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("application_id", draft.application_id);
      router.replace(`${pathname}?${params.toString()}`);
      return draft.application_id;
    } finally {
      draftCreationRef.current = false;
    }
  }, [consentApplicationId, pathname, persistApplicationId, router, searchParams, tenantId]);

  // Remote consent needs the application id to start its verification flow. Selecting
  // that method is the dealer's first explicit intent, so create the draft there.
  useEffect(() => {
    if (stepIndex !== 0 || consentApplicationId || formData.consent_presence !== "remote") return;
    void ensureDraftApplication().catch((error) => setSubmitError(dealerWizardErrorMessage(error)));
  }, [consentApplicationId, ensureDraftApplication, formData.consent_presence, stepIndex]);

  const saveDraftToStorage = useCallback((): boolean => {
    if (!storageKey) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify(formDataRef.current));
      return true;
    } catch {
      return false;
    }
  }, [storageKey]);

  const attemptAdvance = useCallback(async (): Promise<boolean> => {
    if (stepIndex === 4) {
      logPersonalReferencesDebug(formData.personal_references ?? []);
      console.info("[wizard-validation] documents step", {
        document_files_ready: formData.document_files_ready,
        personal_references: formData.personal_references,
        canAdvance: segmentCanAdvance(stepIndex, formData, validationConfig, t),
        validation: validationResult,
      });
    }
    if (segmentCanAdvance(stepIndex, formData, validationConfig, t)) {
      setShowValidationErrors(false);
      try {
        const applicationId = await ensureDraftApplication();
        if (!tenantId) throw new Error("No se pudo identificar la institución");
        await patchApplicationFields({
          tenantId,
          applicationId,
          fields: buildStepFields(stepIndex),
          actorRole: "dealer",
        });
        saveDraftToStorage();
        const next = Math.min(stepIndex + 1, 4);
        router.push(dealerWizardStepHref(dealerWizardStepSlugFromIndex(next), applicationId));
        return true;
      } catch (error) {
        setSubmitError(dealerWizardErrorMessage(error));
        return false;
      }
    }
    setShowValidationErrors(true);
    requestAnimationFrame(() => scrollToFirstWizardError(validationResult.errors));
    return false;
  }, [buildStepFields, consentApplicationId, ensureDraftApplication, formData, router, saveDraftToStorage, stepIndex, tenantId, validationConfig, t, validationResult]);

  const goNext = useCallback(async () => {
    return attemptAdvance();
  }, [attemptAdvance]);

  const goPrev = useCallback(() => {
    const prev = Math.max(stepIndex - 1, 0);
    router.push(dealerWizardStepHref(dealerWizardStepSlugFromIndex(prev), consentApplicationId));
  }, [consentApplicationId, router, stepIndex]);

  const clearDraftStorage = useCallback(() => {
    if (!storageKey) {
      purgeLegacyGlobalWizardDraftKeys();
      return;
    }
    try {
      localStorage.removeItem(storageKey);
      if (applicationIdStorageKey) localStorage.removeItem(applicationIdStorageKey);
      sessionStorage.removeItem(WIZARD_AUTOSAVE_TOAST_SESSION_KEY);
    } catch {
      /* ignore */
    }
    purgeLegacyGlobalWizardDraftKeys();
  }, [applicationIdStorageKey, storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    const id = window.setInterval(() => {
      let ok = false;
      try {
        localStorage.setItem(storageKey, JSON.stringify(formDataRef.current));
        ok = true;
      } catch {
        ok = false;
      }
      const lang = forgeToastLangFromLocale(tenantConfig.locale);
      const copy = forgeWizardToasts(lang);
      if (ok) {
        if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(WIZARD_AUTOSAVE_TOAST_SESSION_KEY)) {
          sessionStorage.setItem(WIZARD_AUTOSAVE_TOAST_SESSION_KEY, "1");
          toast.info(copy.draftSaved, {
            duration: 2000,
            className:
              "border-forgeGray-100/80 bg-forgeSurface-sunken/95 text-forgeGray-600 shadow-forge-sm opacity-95 saturate-75",
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
  }, [tenantConfig.locale, saveDraftToStorage, storageKey]);

  const submitApplication = useCallback(async () => {
    if (!consentApplicationId || !tenantId) {
      throw new Error("No se pudo identificar el borrador de la solicitud");
    }
    if (!wizardDocumentsStepValid(formData)) {
      const missing = missingRequiredDocumentLabels(formData, requiredDocumentsList, tenantDocumentKey);
      setSubmitError(
        missing.length > 0
          ? `Sube los documentos obligatorios: ${missing.join(", ")}. También se requieren 3 referencias personales completas.`
          : "Completa al menos 3 referencias personales.",
      );
      throw new Error("Documentos o referencias incompletos");
    }
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
      const payload = buildCreateApplicationPayload(withMeta, {
        defaultDocumentType: defaultDocType,
        wizardDocuments: requiredDocumentsList,
      });
      setIsSubmitting(true);
      await patchApplicationFields({
        tenantId,
        applicationId: consentApplicationId,
        fields: { ...payload, state: "SUBMITTED" },
        actorRole: "dealer",
      });
      const result = { application_id: consentApplicationId };
      clearDraftStorage();
      setFormData(initialApplicationFormData);

      // Trigger AI scoring in background (fire-and-forget, graceful failure)
      // Sprint 4 P0-2: Forge wizard must call /process so bank analysts get AI scores.
      // If this fails, the app is already created — bank-direct flow still works (Sub-O).
      if (tenantId && result.application_id) {
        void (async () => {
          try {
            await processApplication({
              tenantId,
              applicationId: result.application_id,
              mode: "BANK_ONLY",
            });
            console.info("[forge-wizard] processApplication success", {
              applicationId: result.application_id,
            });
          } catch (err) {
            console.warn("[forge-wizard] processApplication failed — bank analyst will decide without AI score", {
              applicationId: result.application_id,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        })();
      }

      // Upload pending document files in background (fire-and-forget)
      const files = new Map(pendingFilesRef.current);
      if (files.size > 0 && tenantId && result.application_id) {
        const appId = result.application_id;
        const tid = tenantId;
        // Update statuses to "uploading"
        setPendingFiles((prev) => {
          const next = new Map(prev);
          for (const [k, entry] of next) {
            next.set(k, { ...entry, status: "uploading" });
          }
          return next;
        });
        // Upload each file
        void (async () => {
          let ok = 0;
          let fail = 0;
          const errors: Array<{ key: string; message: string }> = [];
          for (const [docKey, entry] of files) {
            const backendType = DOC_KEY_TO_BACKEND_TYPE[docKey] ?? "OTRO";
            try {
              await uploadDocument(tid, appId, entry.file, backendType);
              ok++;
              setPendingFiles((prev) => {
                const next = new Map(prev);
                const current = next.get(docKey);
                if (current) {
                  next.set(docKey, { ...current, status: "uploaded" });
                }
                return next;
              });
            } catch (err) {
              fail++;
              const errorMessage = err instanceof Error ? err.message : "Error desconocido al subir";
              errors.push({ key: docKey, message: errorMessage });
              setPendingFiles((prev) => {
                const next = new Map(prev);
                const current = next.get(docKey);
                if (current) {
                  next.set(docKey, { ...current, status: "error", errorMessage });
                }
                return next;
              });
            }
          }
          if (fail > 0) {
            const firstError = errors[0];
            toast.error(
              `${ok} documento(s) subido(s), ${fail} con error. Primer error: ${firstError?.message || "desconocido"}`,
              { duration: 8000 }
            );
          } else if (ok > 0) {
            toast.success(`${ok} documento(s) subido(s) correctamente`, { duration: 4000 });
          }
        })();
      }

      setIsSubmitting(false);
      return result;
    } catch (err) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : t.toasts.application_failed;
      setSubmitError(msg);
      throw err;
    }
  }, [clearDraftStorage, consentApplicationId, defaultDocType, formData, validationConfig, t, tenantId, requiredDocumentsList]);

  const value = useMemo(
    (): DealerWizardContextValue => ({
      formData,
      updateField,
      patchForm,
      updateDocumentReceived,
      toggleDocumentSelected,
      updateDocumentNote,
      addAdditionalDocumentRow,
      updateAdditionalDocumentRow,
      removeAdditionalDocumentRow,
      updateOtherIncomeRow,
      addOtherIncomeRow,
      removeOtherIncomeRow,
      setHasOtherIncome,
      updatePersonalReference,
      addPersonalReference,
      removePersonalReference,
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
      isSubmitting,
      submitError,
      consentApplicationId,
      consentApplicationIdReady,
      pendingFiles,
      setPendingFile,
      showValidationErrors,
      fieldErrors,
      blockReason,
      getFieldError,
      attemptAdvance,
    }),
    [
      formData,
      updateField,
      patchForm,
      updateDocumentReceived,
      toggleDocumentSelected,
      updateDocumentNote,
      addAdditionalDocumentRow,
      updateAdditionalDocumentRow,
      removeAdditionalDocumentRow,
      updateOtherIncomeRow,
      addOtherIncomeRow,
      removeOtherIncomeRow,
      setHasOtherIncome,
      updatePersonalReference,
      addPersonalReference,
      removePersonalReference,
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
      isSubmitting,
      submitError,
      consentApplicationId,
      consentApplicationIdReady,
      pendingFiles,
      setPendingFile,
      showValidationErrors,
      fieldErrors,
      blockReason,
      getFieldError,
      attemptAdvance,
    ]
  );

  return <DealerWizardContext.Provider value={value}>{children}</DealerWizardContext.Provider>;
}

export { cleanDecimalInput };
