"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "@/lib/motion-stub";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Car, ChevronLeft, ChevronRight, ClipboardCheck, DollarSign, FileCheck, FileText, ShieldCheck, User, Users } from "lucide-react";
import { ForgeButton } from "../../primitives/ForgeButton";
import { ForgeCard } from "../../primitives/ForgeCard";
import { ForgeInput } from "../../primitives/ForgeInput";
import { ForgeSelect } from "../../primitives/ForgeSelect";
import { forgeDealerApplicationDetailHref } from "@/lib/credit-hub/dealerRoutes";
import { useCreateCreditApplication } from "@/lib/credit-hub/hooks/useCreateCreditApplication";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import { useCatalogs } from "@/lib/credit-hub/hooks/useCatalogs";
import type { CreateCreditApplicationPayload } from "@/lib/credit-hub/types/creditCore";
import { celebrateSuccessRespectReduced } from "@/lib/credit-hub/utils/celebrate";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { formatDominicanCedula, cleanDominicanCedula } from "@/lib/credit/formatters/dominican-id";
import { validateDominicanCedula, validatePassport } from "@/lib/credit/validators/dominican-id";
import { calculateAge, parseDateInput } from "@/lib/credit/utils/age";
import { calculateEmploymentTenure } from "@/lib/credit/utils/employment-tenure";
import {
  calculateAmountToFinance,
  calculateIncomeCapacityPreview,
  calculateLTV,
  calculatePMT,
  calculateWizardEstimatedCapacity,
} from "@/lib/credit/utils/financial-calculator";
import { calculateTotalMonthlyIncome, type Frequency, type OtherIncomeSource } from "@/lib/credit/utils/income-normalizer";
import { useAdministrativeDivisions } from "@/lib/credit/catalogs/useAdministrativeDivisions";
import { DO_RELATIONSHIP_TYPES } from "@/lib/credit/catalogs/do/employment-types";
import type { TenantBankingConfig, TenantRequiredDocument } from "@/lib/credit-hub/types/tenantConfig";
import { DEFAULT_DO_REQUIRED_DOCUMENTS } from "@/lib/credit-hub/defaults/do-required-documents";
import {
  buildDocumentosPayload,
  hasRequiredDocumentsFileReady,
  initialPersonalReferences,
  isPersonalReferencePhoneValid,
  personalReferencesValid,
  type PersonalReferenceFormRow,
} from "@/lib/credit-hub/dealer/wizard-gates";
import {
  buildDeclaracionVehiculoPayload,
  INITIAL_VEHICLE_DECLARATION,
  vehicleDeclarationComplete,
} from "@/lib/credit-hub/dealer/vehicle-declaration";
import { preapprovalParamsFromTenantFractions, simulatePreApproval } from "@/lib/credit/simulation/preapproval-base";
import { PreApprovalBadge } from "./PreApprovalBadge";
import { VehicleDeclarationSection } from "./VehicleDeclarationSection";
import { ConsentSection, type ConsentWizardPatch } from "./consent/ConsentSection";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CEDULA: "Cédula",
  PASAPORTE: "Pasaporte",
  OTRO: "Otro",
};

export type { PersonalReferenceFormRow } from "@/lib/credit-hub/dealer/wizard-gates";

export function documentTypeSelectOptions(config: TenantBankingConfig): Array<[string, string]> {
  const primary = config.document_types?.primary_id;
  const alternatives = config.document_types?.alternative_ids ?? [];
  const codes = [primary, ...alternatives].filter((code): code is string => Boolean(code));
  const seen = new Set<string>();
  return codes
    .filter((code) => {
      if (!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    })
    .map((code) => [code, DOCUMENT_TYPE_LABELS[code] ?? code]);
}

function newOtherIncomeRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `oi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newAdditionalDocumentRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

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

export function tenantDocumentKey(doc: TenantRequiredDocument): string {
  return doc.key ?? doc.id ?? "doc";
}

export function effectiveRequiredDocuments(tenant: TenantBankingConfig): TenantRequiredDocument[] {
  if (tenant.required_documents?.length) return tenant.required_documents;
  return DEFAULT_DO_REQUIRED_DOCUMENTS;
}

/** Forge wizard: vehicle docs mandatory; ID and financial docs optional (no live validation). */
export function effectiveWizardDocuments(tenant: TenantBankingConfig): TenantRequiredDocument[] {
  const forcedRequired = new Set(["vehicle_documents"]);
  const optionalUnvalidated = new Set(["id_front", "id_back", "bank_statements"]);
  return effectiveRequiredDocuments(tenant)
    .filter((d) => tenantDocumentKey(d) !== "personal_references")
    .map((d) => {
      const key = tenantDocumentKey(d);
      if (forcedRequired.has(key)) return { ...d, required: true };
      if (optionalUnvalidated.has(key)) return { ...d, required: false };
      return d;
    });
}

function contractLabelToFormValue(label: string): string {
  const map: Record<string, string> = {
    Indefinido: "indefinido",
    Temporal: "temporal",
    "Por proyecto": "proyecto",
    Independiente: "independiente",
    Otro: "otro",
  };
  return map[label] ?? label.toLowerCase().replace(/\s+/g, "_");
}

function formValueToContractLabel(value: string, catalogLabels: readonly string[]): string {
  const entry = catalogLabels.find((label) => contractLabelToFormValue(label) === value);
  return entry ?? "Indefinido";
}

export interface OtherIncomeFormRow {
  id: string;
  concept: string;
  concept_other?: string;
  amount: string;
  frequency: Frequency;
  variable_avg_6_months?: string;
  is_documented: boolean;
}

export interface ApplicationFormData {
  applicant_full_name: string;
  applicant_document_type: "CEDULA" | "PASAPORTE" | "OTRO" | string;
  applicant_document_other_type: string;
  applicant_identification: string;
  applicant_date_of_birth: string;
  applicant_age: string;
  applicant_marital_status: string;
  applicant_phone: string;
  applicant_email: string;
  applicant_address: string;
  applicant_city: string;
  applicant_province: string;
  applicant_country: string;
  employment_type: string;
  employer_name: string;
  employment_position: string;
  employment_start_date: string;
  employer_address: string;
  employer_province: string;
  employer_city: string;
  contract_type: string;
  monthly_income: string;
  has_other_income: "yes" | "no";
  other_incomes: OtherIncomeFormRow[];
  work_phone: string;
  requested_amount: string;
  desired_term: string;
  down_payment: string;
  monthly_debts: string;
  estimated_monthly_expenses: string;
  bank_institution: string;
  has_bank_account: "yes" | "no";
  has_late_payment_history: "yes" | "no";
  max_late_payment_days: string;
  product_type: string;
  vehicle_brand_other: string;
  vehicle_version: string;
  vehicle_color: string;
  vehicle_mileage: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_price: string;
  dealer_supplier: string;
  vehicle_condition: string;
  co_debtor_required: "yes" | "no";
  co_debtor_document_type: "CEDULA" | "PASAPORTE" | "OTRO" | string;
  co_debtor_document_other_type: string;
  co_debtor_date_of_birth: string;
  co_debtor_email: string;
  co_debtor_address: string;
  co_debtor_province: string;
  co_debtor_city: string;
  co_debtor_employer_name: string;
  co_debtor_employment_start_date: string;
  co_debtor_relationship_other: string;
  co_debtor_full_name: string;
  co_debtor_identification: string;
  co_debtor_phone: string;
  co_debtor_monthly_income: string;
  co_debtor_relationship: string;
  co_debtor_employment: string;
  /** Checklist keyed by `tenantDocumentKey` from tenant required documents. */
  documents_received: Record<string, boolean>;
  /** True when a file was attached via upload zone (forge wizard). */
  document_files_ready: Record<string, boolean>;
  document_notes: Record<string, string>;
  additional_document_items: Array<{ id: string; label: string; received: boolean }>;
  personal_references: PersonalReferenceFormRow[];
  consent_presence: "present" | "remote";
  consent_bureau_authorization: boolean;
  consent_terms_accepted: boolean;
  consent_data_processing_authorization: boolean;
  consent_signature_full_name: string;
  consent_present_confirmed: boolean;
  consent_method: string;
  consent_audit_hash: string;
  consent_accepted_at: string;
  consent_sms_otp_sent: boolean;
  consent_dealer_otp_code: string;
  /** Optional LATAM segment (ROADMAP analytics) */
  segment_zone: string;
  segment_vehicle_type: string;
  vehicle_decl_perdida_total: "" | "yes" | "no";
  vehicle_decl_accidentes: "" | "yes" | "no" | "unknown";
  vehicle_decl_gravamenes: "" | "yes" | "no";
  vehicle_decl_titulo_vendedor: "" | "yes" | "no";
  vehicle_decl_km_coincide: "" | "yes" | "no";
  vehicle_decl_signature_name: string;
  vehicle_decl_signed_at: string;
  vehicle_decl_hash: string;
  security_identity_enabled: boolean;
  security_identity_status: "" | "VERIFIED" | "MISMATCH" | "UNVERIFIED" | "UNAVAILABLE";
  security_identity_detail: string;
  security_prescreen_enabled: boolean;
  security_prescreen_status: "" | "ELIGIBLE" | "ELIGIBLE_WITH_RESERVATIONS" | "NOT_ELIGIBLE" | "UNAVAILABLE";
}

export const initialApplicationFormData: ApplicationFormData = {
  applicant_full_name: "",
  applicant_document_type: "",
  applicant_document_other_type: "",
  applicant_identification: "",
  applicant_date_of_birth: "",
  applicant_age: "",
  applicant_marital_status: "",
  applicant_email: "",
  applicant_phone: "",
  applicant_address: "",
  applicant_city: "",
  applicant_province: "",
  applicant_country: "República Dominicana",
  employment_type: "",
  employer_name: "",
  employment_position: "",
  employment_start_date: "",
  employer_address: "",
  employer_province: "",
  employer_city: "",
  contract_type: "",
  monthly_income: "",
  has_other_income: "no",
  other_incomes: [],
  work_phone: "",
  requested_amount: "",
  desired_term: "",
  down_payment: "",
  monthly_debts: "",
  estimated_monthly_expenses: "",
  bank_institution: "",
  has_bank_account: "yes",
  has_late_payment_history: "no",
  max_late_payment_days: "",
  product_type: "vehicle",
  vehicle_brand_other: "",
  vehicle_version: "",
  vehicle_color: "",
  vehicle_mileage: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_price: "",
  dealer_supplier: "",
  vehicle_condition: "",
  co_debtor_required: "no",
  co_debtor_document_type: "",
  co_debtor_document_other_type: "",
  co_debtor_date_of_birth: "",
  co_debtor_email: "",
  co_debtor_address: "",
  co_debtor_province: "",
  co_debtor_city: "",
  co_debtor_employer_name: "",
  co_debtor_employment_start_date: "",
  co_debtor_relationship_other: "",
  co_debtor_full_name: "",
  co_debtor_identification: "",
  co_debtor_phone: "",
  co_debtor_monthly_income: "",
  co_debtor_relationship: "",
  co_debtor_employment: "",
  documents_received: {},
  document_files_ready: {},
  document_notes: {},
  additional_document_items: [],
  personal_references: initialPersonalReferences(),
  consent_presence: "present",
  consent_bureau_authorization: false,
  consent_terms_accepted: false,
  consent_data_processing_authorization: false,
  consent_signature_full_name: "",
  consent_present_confirmed: false,
  consent_method: "",
  consent_audit_hash: "",
  consent_accepted_at: "",
  consent_sms_otp_sent: false,
  consent_dealer_otp_code: "",
  segment_zone: "",
  segment_vehicle_type: "",
  ...INITIAL_VEHICLE_DECLARATION,
  security_identity_enabled: false,
  security_identity_status: "",
  security_identity_detail: "",
  security_prescreen_enabled: false,
  security_prescreen_status: "",
};

function cleanDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [first, ...rest] = cleaned.split(".");
  return rest.length ? `${first}.${rest.join("")}` : first;
}

export function buildCreateApplicationPayload(
  formData: ApplicationFormData,
  options?: { defaultDocumentType?: string; wizardDocuments?: TenantRequiredDocument[] },
): CreateCreditApplicationPayload {
  console.log("[PAYLOAD-DEBUG] Building payload with formData.requested_amount:", formData.requested_amount);
  console.log("[PAYLOAD-DEBUG] Full financial fields:", {
    requested_amount: formData.requested_amount,
    vehicle_price: formData.vehicle_price,
    down_payment: formData.down_payment,
    desired_term: formData.desired_term,
    monthly_debts: formData.monthly_debts,
  });
  const defaultDoc = options?.defaultDocumentType ?? "CEDULA";
  const applicantBirthDate = parseDateInput(formData.applicant_date_of_birth);
  const applicantAge = applicantBirthDate ? calculateAge(applicantBirthDate) : "";
  const applicantDocumentType = formData.applicant_document_type || defaultDoc;
  const coDebtorDocumentType = formData.co_debtor_document_type || defaultDoc;
  const cleanApplicantId =
    applicantDocumentType === "CEDULA"
      ? cleanDominicanCedula(formData.applicant_identification)
      : formData.applicant_identification;
  const cleanCoDebtorId =
    coDebtorDocumentType === "CEDULA"
      ? cleanDominicanCedula(formData.co_debtor_identification)
      : formData.co_debtor_identification;
  const otherIncomeNormalized: OtherIncomeSource[] = (formData.other_incomes ?? []).map((row) => ({
    amount: numeric(row.amount),
    frequency: row.frequency,
    variable_avg_6_months: row.variable_avg_6_months ? numeric(row.variable_avg_6_months) : undefined,
  }));
  const otherMonthlySum =
    formData.has_other_income === "yes" ? calculateTotalMonthlyIncome(0, otherIncomeNormalized) : 0;
  return {
    applicant: {
      full_name: formData.applicant_full_name.trim(),
      document_type: applicantDocumentType,
      document_other_type: (formData.applicant_document_other_type || "").trim() || null,
      identification: cleanApplicantId,
      date_of_birth: formData.applicant_date_of_birth,
      age: applicantAge,
      marital_status: formData.applicant_marital_status,
      phone: formData.applicant_phone.trim(),
      email: formData.applicant_email.trim(),
      address: formData.applicant_address.trim(),
      city: formData.applicant_city.trim(),
      municipality: formData.applicant_city.trim(),
      province: formData.applicant_province.trim(),
      country: formData.applicant_country.trim(),
      referencias_personales: (formData.personal_references ?? [])
        .filter((r) => r.nombre_completo.trim() && r.direccion.trim() && isPersonalReferencePhoneValid(r.telefono))
        .map((r) => ({
          nombre_completo: r.nombre_completo.trim(),
          direccion: r.direccion.trim(),
          telefono: r.telefono.replace(/\D/g, ""),
        })),
    },
    employment: {
      employment_type: formData.employment_type,
      employer_name: formData.employer_name.trim(),
      position: formData.employment_position.trim(),
      employment_start_date: formData.employment_start_date || "",
      employer_address: (formData.employer_address || "").trim(),
      employer_province: (formData.employer_province || "").trim(),
      employer_municipality: (formData.employer_city || "").trim(),
      contract_type: formData.contract_type || "",
      monthly_income: formData.monthly_income,
      has_other_income: formData.has_other_income === "yes",
      // TODO: extender backend para aceptar other_incomes[] detallado; hoy se envía suma mensual normalizada.
      other_income: String(otherMonthlySum),
      work_phone: formData.work_phone.trim(),
    },
    financial: {
      requested_amount: formData.requested_amount,
      desired_term: formData.desired_term,
      down_payment: formData.down_payment || "0",
      monthly_debts: formData.monthly_debts || "0",
      estimated_monthly_expenses: formData.estimated_monthly_expenses || "0",
      has_bank_account: formData.has_bank_account === "yes",
      has_late_payment_history: false,
      max_late_payment_days: null,
    },
    vehicle: {
      product_type: formData.product_type,
      make: formData.vehicle_make === "Otros" ? (formData.vehicle_brand_other || "").trim() : formData.vehicle_make.trim(),
      model: formData.vehicle_model.trim(),
      version: formData.vehicle_version.trim(),
      year: formData.vehicle_year,
      color: formData.vehicle_color.trim() || null,
      price: formData.vehicle_price,
      dealer_supplier: formData.dealer_supplier.trim(),
      condition: formData.vehicle_condition,
      mileage: formData.vehicle_condition === "used" ? formData.vehicle_mileage : null,
    },
    co_debtor: {
      required: formData.co_debtor_required === "yes",
      full_name: formData.co_debtor_full_name.trim(),
      document_type: coDebtorDocumentType,
      document_other_type: (formData.co_debtor_document_other_type || "").trim() || null,
      identification: cleanCoDebtorId,
      date_of_birth: formData.co_debtor_date_of_birth || "",
      email: (formData.co_debtor_email || "").trim(),
      address: (formData.co_debtor_address || "").trim(),
      province: (formData.co_debtor_province || "").trim(),
      municipality: (formData.co_debtor_city || "").trim(),
      phone: formData.co_debtor_phone.trim(),
      monthly_income: formData.co_debtor_monthly_income,
      relationship: formData.co_debtor_relationship === "Otro" ? (formData.co_debtor_relationship_other || "").trim() : formData.co_debtor_relationship.trim(),
      employment: formData.co_debtor_employment.trim(),
      employer_name: (formData.co_debtor_employer_name || "").trim(),
      employment_start_date: formData.co_debtor_employment_start_date || "",
    },
    documents: documentsPayloadFromForm(formData),
    consents: {
      presence: formData.consent_presence || "present",
      bureau_authorization: formData.consent_bureau_authorization,
      terms_accepted: formData.consent_terms_accepted,
      data_processing_authorization: formData.consent_data_processing_authorization,
      consent_method: formData.consent_method.trim() || null,
      consent_audit_hash: formData.consent_audit_hash.trim() || null,
      consent_accepted_at: formData.consent_accepted_at.trim() || null,
      signature_full_name:
        formData.consent_presence === "present" ? (formData.consent_signature_full_name.trim() || null) : null,
    },
    source: "forge_dealer_portal",
    version: "full_credit_application_v1",
    ...(options?.wizardDocuments?.length
      ? { documentos: buildDocumentosPayload(formData, options.wizardDocuments, tenantDocumentKey) }
      : {}),
    ...(formData.segment_zone || formData.segment_vehicle_type
      ? {
          segment: {
            zone: formData.segment_zone || undefined,
            vehicle_type: formData.segment_vehicle_type || undefined,
            employment_type: formData.employment_type || undefined,
          },
        }
      : {}),
    ...(buildDeclaracionVehiculoPayload(formData)
      ? { declaracion_vehiculo: buildDeclaracionVehiculoPayload(formData)! }
      : {}),
  };
}

function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

function documentsPayloadFromForm(formData: ApplicationFormData): CreateCreditApplicationPayload["documents"] {
  const dr = formData.documents_received ?? {};
  const additionals =
    formData.additional_document_items
      ?.filter((row) => row.received && isFilled(row.label))
      .map((row) => row.label.trim()) ?? [];
  return {
    id_uploaded: Boolean(dr.id_front && dr.id_back) || Boolean(dr.id),
    income_proof_uploaded: Boolean(dr.employment_letter) || Boolean(dr.income_evidence) || Boolean(dr.additional_income),
    bank_statement_uploaded: Boolean(dr.bank_statements),
    bureau_authorization_uploaded: Boolean(dr.address_proof),
    invoice_uploaded: false,
    notes: formData.document_notes || {},
    additional_documents: additionals,
  };
}

function documentIsValid(type: string, value: string): boolean {
  if (type === "CEDULA") return validateDominicanCedula(value);
  if (type === "PASAPORTE") return validatePassport(value);
  return isFilled(value);
}

function ageFromInput(value: string): number | null {
  const date = parseDateInput(value);
  return date ? calculateAge(date) : null;
}

export type WizardStepValidationConfig = {
  min_age: number;
  max_age: number;
  garante_required: boolean;
  default_document_type: string;
  required_documents: TenantRequiredDocument[];
  consent_application_id_ready: boolean;
};

export function getGaranteInlineErrors(
  data: ApplicationFormData,
  config: Pick<WizardStepValidationConfig, "min_age" | "garante_required" | "default_document_type">,
  v: CreditHubTranslations["validation"]
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (data.co_debtor_required !== "yes" && !config.garante_required) return errors;
  const applicantDoc = data.applicant_document_type || config.default_document_type;
  const coDoc = data.co_debtor_document_type || config.default_document_type;
  const sameCedula =
    applicantDoc === "CEDULA" &&
    coDoc === "CEDULA" &&
    cleanDominicanCedula(data.applicant_identification) &&
    cleanDominicanCedula(data.applicant_identification) === cleanDominicanCedula(data.co_debtor_identification);
  if (sameCedula) {
    errors.co_debtor_identification = v.cedula_match_applicant;
  } else if (data.co_debtor_identification && !documentIsValid(coDoc, data.co_debtor_identification)) {
    errors.co_debtor_identification = coDoc === "CEDULA" ? v.invalid_cedula : v.invalid_passport;
  }
  const coAge = ageFromInput(data.co_debtor_date_of_birth);
  if (data.co_debtor_date_of_birth && coAge !== null && coAge < config.min_age) {
    errors.co_debtor_date_of_birth = v.age_min(config.min_age);
  }
  if (data.co_debtor_relationship === "Otro" && !isFilled(data.co_debtor_relationship_other ?? "")) {
    errors.co_debtor_relationship_other = v.relationship_other_required;
  }
  if ((data.co_debtor_required === "yes" || config.garante_required) && (!isFilled(data.co_debtor_monthly_income) || Number(data.co_debtor_monthly_income) <= 0)) {
    errors.co_debtor_monthly_income = v.guarantor_income_positive;
  }
  return errors;
}

export function stepIsValid(
  step: number,
  data: ApplicationFormData,
  config: WizardStepValidationConfig = {
    min_age: 18,
    max_age: 75,
    garante_required: false,
    default_document_type: "CEDULA",
    required_documents: DEFAULT_DO_REQUIRED_DOCUMENTS,
    consent_application_id_ready: false,
  },
  t: CreditHubTranslations
): boolean {
  const applicantDoc = data.applicant_document_type || config.default_document_type;
  if (step === 0) {
    const age = ageFromInput(data.applicant_date_of_birth);
    return [
      data.applicant_full_name,
      data.applicant_identification,
      data.applicant_date_of_birth,
      data.applicant_marital_status,
      data.applicant_phone,
      data.applicant_email,
      data.applicant_address,
      data.applicant_city,
      data.applicant_province,
      data.applicant_country,
    ].every(isFilled) && documentIsValid(applicantDoc, data.applicant_identification) && age !== null && age >= config.min_age && age <= config.max_age;
  }
  if (step === 1) {
    const baseOk = [data.employment_type, data.employer_name, data.employment_position, data.employment_start_date, data.monthly_income, data.work_phone, data.employer_address, data.employer_province, data.employer_city, data.contract_type].every(isFilled);
    if (!baseOk) return false;
    if (data.has_other_income !== "yes") return true;
    if (data.other_incomes.length < 1) return false;
    return data.other_incomes.every((row) => {
      const amt = numeric(row.amount);
      const variableOk = row.frequency !== "VARIABLE" || isFilled(row.variable_avg_6_months ?? "");
      return isFilled(row.amount) && amt > 0 && isFilled(row.concept) && Boolean(row.frequency) && variableOk;
    });
  }
  if (step === 2) {
    const base = [data.product_type, data.vehicle_make, data.vehicle_model, data.vehicle_year, data.vehicle_price, data.dealer_supplier, data.vehicle_condition].every(isFilled);
    return base && vehicleDeclarationComplete(data);
  }
  if (step === 3) {
    if (data.co_debtor_required === "no" && !config.garante_required) return true;
    const coAge = ageFromInput(data.co_debtor_date_of_birth);
    const coDoc = data.co_debtor_document_type || config.default_document_type;
    const garanteErrors = getGaranteInlineErrors(data, config, t.validation);
    return (
      [data.co_debtor_full_name, data.co_debtor_identification, data.co_debtor_date_of_birth, data.co_debtor_phone, data.co_debtor_email, data.co_debtor_address, data.co_debtor_province, data.co_debtor_city, data.co_debtor_monthly_income, data.co_debtor_relationship, data.co_debtor_employer_name, data.co_debtor_employment_start_date].every(isFilled) &&
      documentIsValid(coDoc, data.co_debtor_identification) &&
      cleanDominicanCedula(data.co_debtor_identification) !== cleanDominicanCedula(data.applicant_identification) &&
      coAge !== null &&
      coAge >= config.min_age &&
      Number(data.co_debtor_monthly_income) > 0 &&
      Object.keys(garanteErrors).length === 0
    );
  }
  if (step === 4) {
    const forgeDocMode = Object.keys(data.document_files_ready ?? {}).length > 0;
    const requiredDocs = config.required_documents.filter((d) => d.required);
    const checkboxOk = requiredDocs.every((d) => Boolean(data.documents_received[tenantDocumentKey(d)]));
    const docsOk = forgeDocMode ? hasRequiredDocumentsFileReady(data) : checkboxOk;
    const refsOk = forgeDocMode ? personalReferencesValid(data.personal_references) : true;
    return docsOk && refsOk;
  }
  if (step === 5) {
    const base = data.consent_terms_accepted && data.consent_data_processing_authorization;
    if (!base) return false;
    if (data.consent_presence === "present") {
      return data.consent_signature_full_name.trim().length >= 3 && data.consent_present_confirmed;
    }
    if (!config.consent_application_id_ready) return false;
    const method = data.consent_method;
    if (method === "SMS_OTP") {
      return (
        data.consent_sms_otp_sent &&
        data.consent_dealer_otp_code.trim().length === 6 &&
        Boolean(data.consent_accepted_at.trim())
      );
    }
    if (method === "WHATSAPP" || method === "EMAIL" || method === "SELFIE") {
      return Boolean(data.consent_accepted_at.trim());
    }
    return false;
  }
  return true;
}

function requiredHint(step: number, data: ApplicationFormData, requiredDocs: TenantRequiredDocument[], t: CreditHubTranslations): string {
  if (step === 3) return t.wizard.hints.garante;
  if (step === 4) {
    const missing = requiredDocs
      .filter((d) => d.required)
      .filter((d) => !data.document_files_ready?.[tenantDocumentKey(d)]).length;
    if (missing > 0) return t.validation.docs_missing(missing);
  }
  if (step === 5) return t.wizard.hints.consents;
  return t.wizard.hints.generic;
}

function numeric(value: string | number | null | undefined): number {
  const parsed = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function otherIncomesToParts(data: ApplicationFormData): OtherIncomeSource[] {
  return (data.other_incomes ?? []).map((row) => ({
    amount: numeric(row.amount),
    frequency: row.frequency,
    variable_avg_6_months: row.variable_avg_6_months ? numeric(row.variable_avg_6_months) : undefined,
  }));
}

function preliminaryViability(data: ApplicationFormData) {
  const baseIncome = numeric(data.monthly_income);
  const otherMonthly =
    data.has_other_income === "yes" ? calculateTotalMonthlyIncome(0, otherIncomesToParts(data)) : 0;
  const income = baseIncome + otherMonthly + (data.co_debtor_required === "yes" ? numeric(data.co_debtor_monthly_income) : 0);
  const capacity = calculateIncomeCapacityPreview(income, 0.35);
  const productPrice = numeric(data.vehicle_price);
  const requested = numeric(data.requested_amount);
  const downPayment = numeric(data.down_payment);
  const principalFromPrice = calculateAmountToFinance(productPrice, downPayment);
  const principal = requested > 0 && requested < principalFromPrice ? requested : principalFromPrice;
  const term = Math.max(1, Math.round(numeric(data.desired_term) || 36));
  const payment = calculatePMT(principal, 18, term);
  const gap = capacity - payment;
  const status = payment <= capacity ? "verde" : payment <= capacity * 1.15 ? "amarillo" : "rojo";
  return { capacity, payment, gap, status };
}

function formatDop(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function WizardContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consentApplicationId = searchParams.get("application_id")?.trim() ?? "";
  const consentApplicationIdReady = Boolean(consentApplicationId);
  const presetAppliedRef = useRef(false);
  const { tenantConfig } = useTenantConfig();
  const t = useTranslations();
  const steps = useMemo(
    () => [
      { id: "applicant", title: t.wizard.nav.identification, icon: User },
      { id: "employment", title: t.wizard.nav.employment, icon: Briefcase },
      { id: "financial_product", title: t.wizard.nav.financial_product, icon: DollarSign },
      { id: "co_debtor", title: t.wizard.nav.co_debtor, icon: Users },
      { id: "documents", title: t.wizard.nav.documents, icon: FileText },
      { id: "consents", title: t.wizard.nav.consents, icon: ShieldCheck },
      { id: "review", title: t.wizard.nav.review, icon: ClipboardCheck },
    ],
    [t]
  );
  const { catalogs, loading: catalogsLoading } = useCatalogs();
  const defaultDocType = tenantConfig.document_types.primary_id ?? "CEDULA";
  const administrativeDivisions = useAdministrativeDivisions(tenantConfig.country_code);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ApplicationFormData>(initialApplicationFormData);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateCreditApplication();

  const preApproval = useMemo(() => {
    const baseIncome = numeric(formData.monthly_income);
    const otherMonthly =
      formData.has_other_income === "yes" ? calculateTotalMonthlyIncome(0, otherIncomesToParts(formData)) : 0;
    const monthlyIncomeTotal = baseIncome + otherMonthly;
    const loanAmount = calculateAmountToFinance(numeric(formData.vehicle_price), numeric(formData.down_payment));
    if (loanAmount <= 0) return null;

    const termParsed = /(\d+)/.exec(String(formData.desired_term ?? ""));
    const termMonths = termParsed ? Math.max(1, parseInt(termParsed[1], 10)) : 60;

    return simulatePreApproval({
      monthlyIncome: monthlyIncomeTotal,
      monthlyDebts: numeric(formData.monthly_debts),
      loanAmount,
      termMonths,
      ...preapprovalParamsFromTenantFractions(tenantConfig),
    });
  }, [formData, tenantConfig]);

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

  useEffect(() => {
    if (!tenantConfig.features_enabled.garante_required) return;
    setFormData((prev) => (prev.co_debtor_required === "yes" ? prev : { ...prev, co_debtor_required: "yes" }));
  }, [tenantConfig.features_enabled.garante_required]);

  // Auto-calculate requested_amount when vehicle_price or down_payment change
  // requested_amount is a derived value, not a form field - it must match what UI shows
  useEffect(() => {
    const price = numeric(formData.vehicle_price);
    const down = numeric(formData.down_payment);
    console.log("[WIZARD-DEBUG] useEffect triggered:", {
      vehicle_price: formData.vehicle_price,
      down_payment: formData.down_payment,
      price_numeric: price,
      down_numeric: down,
      current_requested_amount: formData.requested_amount,
    });
    if (price <= 0) {
      // No price yet - keep requested_amount empty
      console.log("[WIZARD-DEBUG] No price yet, clearing requested_amount");
      if (formData.requested_amount !== "") {
        setFormData((prev) => ({ ...prev, requested_amount: "" }));
      }
      return;
    }
    const calculated = calculateAmountToFinance(price, down);
    const calculatedStr = String(calculated);
    console.log("[WIZARD-DEBUG] Calculated amount:", calculated, "→", calculatedStr);
    // Only update if different to avoid redundant writes
    if (formData.requested_amount !== calculatedStr) {
      console.log("[WIZARD-DEBUG] Updating requested_amount from", formData.requested_amount, "to", calculatedStr);
      setFormData((prev) => ({ ...prev, requested_amount: calculatedStr }));
    } else {
      console.log("[WIZARD-DEBUG] requested_amount already correct, skipping update");
    }
  }, [formData.vehicle_price, formData.down_payment]);  // Only react to inputs, not to output

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
      // requested_amount is now auto-calculated from vehicle_price - down_payment in useEffect
      applicant_age: raw.age != null ? toStr(raw.age) : prev.applicant_age,
    }));
  }, [searchParams]);

  const updateField = <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDocumentReceived = (key: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      documents_received: { ...prev.documents_received, [key]: checked },
    }));
  };

  const addAdditionalDocumentRow = () => {
    setFormData((prev) => ({
      ...prev,
      additional_document_items: [...prev.additional_document_items, { id: newAdditionalDocumentRowId(), label: "", received: false }],
    }));
  };

  const updateAdditionalDocumentRow = (id: string, updates: Partial<{ label: string; received: boolean }>) => {
    setFormData((prev) => ({
      ...prev,
      additional_document_items: prev.additional_document_items.map((row) => (row.id === id ? { ...row, ...updates } : row)),
    }));
  };

  const removeAdditionalDocumentRow = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      additional_document_items: prev.additional_document_items.filter((row) => row.id !== id),
    }));
  };

  const updateOtherIncomeRow = (id: string, updates: Partial<OtherIncomeFormRow>) => {
    setFormData((prev) => ({
      ...prev,
      other_incomes: prev.other_incomes.map((row) => (row.id === id ? { ...row, ...updates } : row)),
    }));
  };

  const addOtherIncomeRow = () => {
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
  };

  const removeOtherIncomeRow = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      other_incomes: prev.other_incomes.filter((row) => row.id !== id),
    }));
  };

  const setHasOtherIncome = (value: "yes" | "no") => {
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
  };

  const selectedApplicantProvince = administrativeDivisions.find((item) => item.name === formData.applicant_province);
  const selectedEmployerProvince = administrativeDivisions.find((item) => item.name === formData.employer_province);
  const selectedCoDebtorProvince = administrativeDivisions.find((item) => item.name === formData.co_debtor_province);
  const canProceed = stepIsValid(currentStep, formData, validationConfig, t);

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (_status: "draft" | "submitted") => {
    if (!stepIsValid(5, formData, validationConfig, t)) {
      setSubmitStatus("error");
      setSubmitError(t.validation.consents_required);
      return;
    }
    console.log("[SUBMIT-DEBUG] About to submit with formData.requested_amount:", formData.requested_amount);
    console.log("[SUBMIT-DEBUG] Full formData state:", {
      vehicle_price: formData.vehicle_price,
      down_payment: formData.down_payment,
      requested_amount: formData.requested_amount,
      desired_term: formData.desired_term,
    });
    setSubmitStatus("submitting");
    setSubmitError(null);
    try {
      const payload = buildCreateApplicationPayload(formData, { defaultDocumentType: defaultDocType });
      console.log("[SUBMIT-DEBUG] Built payload, financial.requested_amount:", payload.financial.requested_amount);
      const result = await createMutation.mutateAsync(payload);
      console.log("[SUBMIT-DEBUG] Submit successful, application_id:", result.application_id);
      setSubmitStatus("success");
      celebrateSuccessRespectReduced();
      forgeToast.success(t.toasts.application_submitted);
      setTimeout(() => {
        router.push(forgeDealerApplicationDetailHref(result.application_id));
      }, 1500);
    } catch (error) {
      console.error("[SUBMIT-DEBUG] Submit error:", error);
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : t.toasts.application_failed);
      forgeToast.error(error instanceof Error ? error.message : t.toasts.application_failed);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const input = (field: keyof ApplicationFormData, label: string, props: Record<string, unknown> = {}) => (
    <ForgeInput
      label={label}
      value={String(formData[field] ?? "")}
      onChange={(event) => updateField(field, props.inputMode === "decimal" || props.type === "number" ? cleanDecimalInput(event.target.value) : event.target.value)}
      {...props}
    />
  );

  const select = (field: keyof ApplicationFormData, label: string, options: Array<[string, string]>) => (
    <ForgeSelect label={label} value={String(formData[field])} onChange={(event) => updateField(field, event.target.value as ApplicationFormData[typeof field])}>
      <option value="">{t.common.select_placeholder}</option>
      {options.map(([value, optionLabel]) => (
        <option key={value} value={value}>
          {optionLabel}
        </option>
      ))}
    </ForgeSelect>
  );

  const boolSelect = (field: keyof ApplicationFormData, label: string) =>
    select(field, label, [
      ["yes", "Sí"],
      ["no", "No"],
    ]);

  const checkbox = (field: keyof ApplicationFormData, label: string) => (
    <label className="flex items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-3 text-sm text-forge-text">
      <input
        type="checkbox"
        checked={Boolean(formData[field])}
        onChange={(event) => updateField(field, event.target.checked as ApplicationFormData[typeof field])}
        className="mt-1"
      />
      {label}
    </label>
  );

  const sectionHeader = (title: string, description: string) => (
    <div>
      <h2 className="font-display text-2xl font-bold text-forge-text">{title}</h2>
      <p className="mt-1 text-forge-text-muted">{description}</p>
    </div>
  );

  const renderStep = () => {
    if (currentStep === 0) {
      const applicantDoc = formData.applicant_document_type || defaultDocType;
      const birthDate = parseDateInput(formData.applicant_date_of_birth);
      const age = birthDate ? calculateAge(birthDate) : null;
      const docError =
        formData.applicant_identification && !documentIsValid(applicantDoc, formData.applicant_identification)
          ? applicantDoc === "CEDULA"
            ? t.validation.invalid_cedula
            : t.validation.invalid_passport
          : null;
      return (
        <div className="space-y-5">
          {sectionHeader(t.wizard.sections.applicant_title, t.wizard.sections.applicant_sub)}
          <div className="grid gap-4 md:grid-cols-2">
            {input("applicant_full_name", "Nombre completo *", { autoFocus: true })}
            <ForgeSelect
              label="Tipo de documento *"
              value={applicantDoc}
              onChange={(event) => updateField("applicant_document_type", event.target.value)}
            >
              {documentTypeSelectOptions(tenantConfig).map(([value, optionLabel]) => (
                <option key={value} value={value}>
                  {optionLabel}
                </option>
              ))}
            </ForgeSelect>
            {applicantDoc === "OTRO" && input("applicant_document_other_type", "Especifique tipo *")}
            <div className="space-y-1">
              <ForgeInput
                label="Número de documento *"
                aria-label="Número de documento"
                value={applicantDoc === "CEDULA" ? formatDominicanCedula(formData.applicant_identification) : formData.applicant_identification}
                placeholder={applicantDoc === "CEDULA" ? "053-0003053-2" : "Pasaporte"}
                onChange={(event) => updateField("applicant_identification", applicantDoc === "CEDULA" ? cleanDominicanCedula(event.target.value) : event.target.value.toUpperCase())}
              />
              {docError && <p className="text-xs text-forge-danger">{docError}</p>}
            </div>
            {input("applicant_date_of_birth", "Fecha de nacimiento *", { type: "date" })}
            <div className="rounded-xl border border-forge-border bg-forge-surface-elevated p-3">
              <p className="text-xs text-forge-text-muted">{t.wizard.calculated_age}</p>
              <span data-testid="calculated-age" className="font-semibold text-forge-text">
                {age === null ? t.common.no_data : t.wizard.years_suffix(age)}
              </span>
              {age !== null && age < tenantConfig.min_age && <p className="mt-1 text-xs text-forge-danger">{t.validation.age_min(tenantConfig.min_age)}</p>}
              {age !== null && age > tenantConfig.max_age && <p className="mt-1 text-xs text-forge-danger">{t.validation.age_over_max}</p>}
            </div>
            {select("applicant_marital_status", "Estado civil *", [["single", "Soltero/a"], ["married", "Casado/a"], ["union", "Unión libre"], ["divorced", "Divorciado/a"], ["widowed", "Viudo/a"]])}
            {input("applicant_phone", "Teléfono *", { type: "tel" })}
            {input("applicant_email", "Correo electrónico *", { type: "email" })}
            {input("applicant_country", "País *")}
            {input("applicant_address", "Dirección *", { className: "md:col-span-2" })}
            <ForgeSelect label="Provincia *" value={formData.applicant_province} onChange={(event) => updateField("applicant_province", event.target.value)}>
              <option value="">{t.common.select_placeholder}</option>
              {administrativeDivisions.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
            </ForgeSelect>
            <ForgeSelect label="Municipio *" value={formData.applicant_city} onChange={(event) => updateField("applicant_city", event.target.value)} disabled={!selectedApplicantProvince}>
              <option value="">{t.common.select_placeholder}</option>
              {(selectedApplicantProvince?.municipalities ?? []).map((municipality) => <option key={municipality} value={municipality}>{municipality}</option>)}
            </ForgeSelect>
          </div>
        </div>
      );
    }
    if (currentStep === 1) {
      const employmentStart = parseDateInput(formData.employment_start_date);
      const tenure = formData.employment_start_date ? calculateEmploymentTenure(formData.employment_start_date) : null;
      const tenureLabel = tenure?.isValid ? tenure.display : employmentStart ? t.validation.age_invalid : t.common.no_data;
      const otherMonthlyTotal =
        formData.has_other_income === "yes" ? calculateTotalMonthlyIncome(0, otherIncomesToParts(formData)) : 0;
      const totalIncomeDisplay = numeric(formData.monthly_income) + otherMonthlyTotal;
      const contractOptions =
        catalogs?.contractTypes?.map((label) => [contractLabelToFormValue(label), label] as [string, string]) ??
        [["indefinido", "Indefinido"], ["temporal", "Temporal"], ["proyecto", "Por proyecto"], ["independiente", "Independiente"], ["otro", "Otro"]];
      return (
        <div className="space-y-5">
          {sectionHeader(t.wizard.sections.employment_title, t.wizard.sections.employment_sub)}
          <div className="grid gap-4 md:grid-cols-2">
            {select("employment_type", "Tipo de empleo *", [["employee", "Empleado privado"], ["public_employee", "Empleado público"], ["self_employed", "Independiente"], ["business_owner", "Dueño de negocio"], ["retired", "Pensionado"]])}
            {input("employer_name", "Empresa donde trabaja *")}
            {input("employment_position", "Cargo *")}
            {input("employment_start_date", "Fecha de ingreso al empleo *", { type: "date" })}
            <div className="rounded-xl border border-forge-border bg-forge-surface-elevated p-3">
              <p className="text-xs text-forge-text-muted">{t.wizard.calculated_tenure}</p>
              <p className="font-semibold text-forge-text">{tenureLabel}</p>
            </div>
            {input("monthly_income", "Ingreso mensual neto *", { inputMode: "decimal" })}
            {input("work_phone", "Teléfono empresa *", { type: "tel" })}
            {input("employer_address", "Dirección de la empresa *", { className: "md:col-span-2" })}
            <ForgeSelect label="Provincia empresa *" value={formData.employer_province} onChange={(event) => updateField("employer_province", event.target.value)}>
              <option value="">{t.common.select_placeholder}</option>
              {administrativeDivisions.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
            </ForgeSelect>
            <ForgeSelect label="Municipio empresa *" value={formData.employer_city} onChange={(event) => updateField("employer_city", event.target.value)} disabled={!selectedEmployerProvince}>
              <option value="">{t.common.select_placeholder}</option>
              {(selectedEmployerProvince?.municipalities ?? []).map((municipality) => <option key={municipality} value={municipality}>{municipality}</option>)}
            </ForgeSelect>
            <ForgeSelect
              label="Tipo de contrato *"
              value={formData.contract_type}
              onChange={(event) => updateField("contract_type", event.target.value)}
              disabled={catalogsLoading || !catalogs}
            >
              <option value="">{t.common.select_placeholder}</option>
              {contractOptions.map(([value, optionLabel]) => (
                <option key={value} value={value}>
                  {optionLabel}
                </option>
              ))}
            </ForgeSelect>
            <div className="md:col-span-2">
              <ForgeSelect
                label="¿Tiene otros ingresos además del salario? *"
                value={formData.has_other_income}
                onChange={(event) => setHasOtherIncome(event.target.value as "yes" | "no")}
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </ForgeSelect>
            </div>
            {formData.has_other_income === "yes" && (
              <div className="md:col-span-2 space-y-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-forge-text">Otras fuentes de ingreso</p>
                  <ForgeButton type="button" variant="secondary" size="sm" onClick={addOtherIncomeRow}>
                    Agregar fuente de ingreso
                  </ForgeButton>
                </div>
                {formData.other_incomes.map((row) => (
                  <div key={row.id} className="grid gap-3 rounded-lg border border-forge-border/60 bg-forge-surface p-3 md:grid-cols-2">
                    <ForgeSelect
                      label="Concepto *"
                      value={row.concept}
                      onChange={(event) => updateOtherIncomeRow(row.id, { concept: event.target.value })}
                      disabled={catalogsLoading || !catalogs}
                    >
                      {(catalogs?.incomeConcepts ?? ["Otro"]).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </ForgeSelect>
                    <ForgeInput
                      label="Monto *"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(event) => updateOtherIncomeRow(row.id, { amount: cleanDecimalInput(event.target.value) })}
                    />
                    <ForgeSelect
                      label="Frecuencia *"
                      value={row.frequency}
                      onChange={(event) => updateOtherIncomeRow(row.id, { frequency: event.target.value as Frequency })}
                      disabled={catalogsLoading || !catalogs}
                    >
                      {(catalogs?.paymentFrequencies ?? ["MENSUAL"]).map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </ForgeSelect>
                    {row.frequency === "VARIABLE" && (
                      <ForgeInput
                        label="Promedio últimos 6 meses *"
                        inputMode="decimal"
                        value={row.variable_avg_6_months ?? ""}
                        onChange={(event) =>
                          updateOtherIncomeRow(row.id, { variable_avg_6_months: cleanDecimalInput(event.target.value) })
                        }
                      />
                    )}
                    <label className="flex items-center gap-2 text-sm text-forge-text md:col-span-2">
                      <input
                        type="checkbox"
                        checked={row.is_documented}
                        onChange={(event) => updateOtherIncomeRow(row.id, { is_documented: event.target.checked })}
                      />
                      Ingreso documentado
                    </label>
                    <div className="md:col-span-2 flex justify-end">
                      <ForgeButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={formData.has_other_income === "yes" && formData.other_incomes.length <= 1}
                        onClick={() => removeOtherIncomeRow(row.id)}
                      >
                        Eliminar fuente
                      </ForgeButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-forge-primary/10 p-4 text-sm text-forge-text">
            Ingreso total mensual estimado:{" "}
            <span className="font-semibold tabular-nums">{formatDop(totalIncomeDisplay)}</span>
          </div>
        </div>
      );
    }
    if (currentStep === 2) {
      const otherMonthlyStep =
        formData.has_other_income === "yes" ? calculateTotalMonthlyIncome(0, otherIncomesToParts(formData)) : 0;
      const amountToFinance = calculateAmountToFinance(numeric(formData.vehicle_price), numeric(formData.down_payment));
      const estimatedCapacity = calculateWizardEstimatedCapacity(
        numeric(formData.monthly_income),
        otherMonthlyStep,
        numeric(formData.monthly_debts),
        0.4
      );
      const ltvPercent = calculateLTV(amountToFinance, numeric(formData.vehicle_price));
      return (
        <div className="space-y-5">
          {sectionHeader(t.wizard.sections.financial_title, t.wizard.sections.financial_sub)}
          <div className="grid gap-4 md:grid-cols-2">
            {input("desired_term", "Plazo deseado *", { placeholder: "Ej: 48 meses" })}
            {input("down_payment", "Cuota inicial disponible *", { inputMode: "decimal" })}
            {input("monthly_debts", "Deudas mensuales actuales *", { inputMode: "decimal" })}
            {input("estimated_monthly_expenses", "Gasto mensual estimado (opcional)", { inputMode: "decimal" })}
            {boolSelect("has_bank_account", "¿Tiene cuenta bancaria activa? *")}
            {formData.has_bank_account === "yes" && (
              <ForgeSelect
                label="Institución bancaria (opcional)"
                value={formData.bank_institution}
                onChange={(event) => updateField("bank_institution", event.target.value)}
                disabled={catalogsLoading || !catalogs}
              >
                <option value="">{t.common.select_placeholder}</option>
                {(catalogs?.banks ?? []).map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </ForgeSelect>
            )}
            <div className="md:col-span-2 border-t border-forge-border pt-4">
              <h3 className="font-semibold text-forge-text">{t.wizard.vehicle_section}</h3>
            </div>
            {select("product_type", "Tipo de producto *", tenantConfig.product_types.map((item) => [item, item]))}
            <ForgeSelect
              label="Marca *"
              value={formData.vehicle_make}
              onChange={(event) => updateField("vehicle_make", event.target.value)}
              disabled={catalogsLoading || !catalogs}
            >
              <option value="">{t.common.select_placeholder}</option>
              {(catalogs?.vehicleBrands ?? []).map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
              {!catalogsLoading && !catalogs && (
                <option disabled>{t.wizard.catalog_unavailable}</option>
              )}
            </ForgeSelect>
            {formData.vehicle_make === "Otros" && input("vehicle_brand_other", "Especifique marca *")}
            {input("vehicle_model", "Modelo *")}
            {input("vehicle_version", "Sub-modelo / versión (opcional)")}
            {select("vehicle_year", "Año *", Array.from({ length: 32 }, (_, index) => {
              const year = new Date().getFullYear() + 1 - index;
              return [String(year), String(year)] as [string, string];
            }))}
            {input("vehicle_color", "Color (opcional)")}
            {input("vehicle_price", "Precio de venta *", { inputMode: "decimal" })}
            {select("vehicle_condition", "Condición *", [["new", "Nuevo"], ["used", "Usado"]])}
            {formData.vehicle_condition === "used" && input("vehicle_mileage", "Kilometraje actual", { inputMode: "numeric" })}
            {input("dealer_supplier", "Dealer / Suplidor *", { readOnly: false })}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-forge-surface-elevated p-3"><p className="text-xs text-forge-text-muted">{t.wizard.amount_finance}</p><p className="font-semibold tabular-nums text-forge-text">{formatDop(amountToFinance)}</p></div>
            <div className="rounded-xl bg-forge-surface-elevated p-3"><p className="text-xs text-forge-text-muted">{t.wizard.ltv_label}</p><p className="font-semibold tabular-nums text-forge-text">{Math.round(ltvPercent)}%</p>{ltvPercent / 100 > tenantConfig.ltv_max && <p className="text-xs text-forge-danger">{t.wizard.ltv_exceeds}</p>}</div>
            <div className="rounded-xl bg-forge-surface-elevated p-3"><p className="text-xs text-forge-text-muted">{t.wizard.estimated_capacity}</p><p className="font-semibold tabular-nums text-forge-text">{formatDop(estimatedCapacity)}</p></div>
          </div>
          {preApproval && <PreApprovalBadge result={preApproval} />}
          <VehicleDeclarationSection
            formData={formData}
            patchForm={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          />
        </div>
      );
    }
    if (currentStep === 3) {
      const coDoc = formData.co_debtor_document_type || defaultDocType;
      const coBirthDate = parseDateInput(formData.co_debtor_date_of_birth);
      const coAge = coBirthDate ? calculateAge(coBirthDate) : null;
      const garanteErrors = getGaranteInlineErrors(formData, validationConfig, t.validation);
      const coEmploymentTenure = formData.co_debtor_employment_start_date ? calculateEmploymentTenure(formData.co_debtor_employment_start_date) : null;
      let garanteIncomeWarning: string | null = null;
      if (
        tenantConfig.garante_minimum_income_ratio != null &&
        tenantConfig.garante_minimum_income_ratio > 0 &&
        (formData.co_debtor_required === "yes" || tenantConfig.features_enabled.garante_required)
      ) {
        const loanAmount = calculateAmountToFinance(numeric(formData.vehicle_price), numeric(formData.down_payment));
        const termParsed = /(\d+)/.exec(String(formData.desired_term ?? ""));
        const termMonths = termParsed ? Math.max(1, parseInt(termParsed[1], 10)) : 60;
        if (loanAmount > 0) {
          const est = calculatePMT(loanAmount, tenantConfig.default_rate ?? 16, termMonths);
          const minReq = est * tenantConfig.garante_minimum_income_ratio;
          if (numeric(formData.co_debtor_monthly_income) > 0 && numeric(formData.co_debtor_monthly_income) < minReq) {
            garanteIncomeWarning = `Ingreso del garante por debajo del mínimo recomendado (${formatDop(minReq)})`;
          }
        }
      }
      return (
        <div className="space-y-5">
          {sectionHeader(t.wizard.sections.garante_title, t.wizard.sections.garante_sub)}
          <div className="space-y-4">
            {tenantConfig.features_enabled.garante_required && (
              <div className="rounded-xl border border-forge-primary/40 bg-forge-primary/10 p-3 text-sm text-forge-text">
                {t.wizard.garante_auto_required}
              </div>
            )}
            {!tenantConfig.features_enabled.garante_required && boolSelect("co_debtor_required", "¿La solicitud incluye garante o cofirmante? *")}
            {(tenantConfig.features_enabled.garante_required || formData.co_debtor_required === "yes") && (
              <motion.div
                data-testid="garante-section"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4 border-l-2 border-forge-primary/40 pl-4 md:grid-cols-2 md:pl-6"
              >
                <div className="md:col-span-2 rounded-2xl border border-forge-border bg-forge-surface-elevated p-4">
                  <h3 className="font-semibold text-forge-text">{t.wizard.garante_data_title}</h3>
                </div>
                <ForgeSelect
                  label="Tipo de documento garante *"
                  value={coDoc}
                  onChange={(event) => updateField("co_debtor_document_type", event.target.value)}
                >
                  {documentTypeSelectOptions(tenantConfig).map(([value, optionLabel]) => (
                    <option key={value} value={value}>
                      {optionLabel}
                    </option>
                  ))}
                </ForgeSelect>
                {coDoc === "OTRO" && input("co_debtor_document_other_type", "Especifique tipo *")}
                <div className="space-y-1 md:col-span-2">
                  <ForgeInput
                    label="Número de documento garante *"
                    aria-label="Número de documento garante"
                    value={coDoc === "CEDULA" ? formatDominicanCedula(formData.co_debtor_identification) : formData.co_debtor_identification}
                    onChange={(event) => updateField("co_debtor_identification", coDoc === "CEDULA" ? cleanDominicanCedula(event.target.value) : event.target.value.toUpperCase())}
                  />
                  {garanteErrors.co_debtor_identification && <p className="text-xs text-forge-danger">{garanteErrors.co_debtor_identification}</p>}
                </div>
                {input("co_debtor_full_name", "Nombre completo garante *")}
                <div className="space-y-1">
                  {input("co_debtor_date_of_birth", "Fecha de nacimiento garante *", { type: "date" })}
                  {garanteErrors.co_debtor_date_of_birth && <p className="text-xs text-forge-danger">{garanteErrors.co_debtor_date_of_birth}</p>}
                </div>
                <div className="rounded-xl border border-forge-border bg-forge-surface p-3">
                  <p className="text-xs text-forge-text-muted">{t.wizard.age_guarantor}</p>
                  <span data-testid="co-debtor-calculated-age" className="font-semibold text-forge-text">
                    {coAge === null ? t.common.no_data : t.wizard.years_suffix(coAge)}
                  </span>
                </div>
                {input("co_debtor_phone", "Teléfono garante *", { type: "tel" })}
                {input("co_debtor_email", "Correo electrónico garante *", { type: "email" })}
                {input("co_debtor_address", "Dirección garante *", { className: "md:col-span-2" })}
                <ForgeSelect label="Provincia garante *" value={formData.co_debtor_province} onChange={(event) => updateField("co_debtor_province", event.target.value)}>
                  <option value="">{t.common.select_placeholder}</option>
                  {administrativeDivisions.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
                </ForgeSelect>
                <ForgeSelect label="Municipio garante *" value={formData.co_debtor_city} onChange={(event) => updateField("co_debtor_city", event.target.value)} disabled={!selectedCoDebtorProvince}>
                  <option value="">{t.common.select_placeholder}</option>
                  {(selectedCoDebtorProvince?.municipalities ?? []).map((municipality) => <option key={municipality} value={municipality}>{municipality}</option>)}
                </ForgeSelect>
                <div className="space-y-1">
                  {input("co_debtor_monthly_income", "Ingreso mensual garante *", { inputMode: "decimal" })}
                  {garanteErrors.co_debtor_monthly_income && <p className="text-xs text-forge-danger">{garanteErrors.co_debtor_monthly_income}</p>}
                  {garanteIncomeWarning && <p className="text-xs text-forge-warning">{garanteIncomeWarning}</p>}
                </div>
                {input("co_debtor_employer_name", "Empresa donde labora garante *")}
                <div className="space-y-1 md:col-span-2">
                  {input("co_debtor_employment_start_date", "Fecha de ingreso al empleo garante *", { type: "date" })}
                  {coEmploymentTenure?.isValid && (
                    <p className="text-sm text-forge-text-muted">Antigüedad: {coEmploymentTenure.display}</p>
                  )}
                </div>
                {select(
                  "co_debtor_relationship",
                  "Relación con solicitante *",
                  (catalogs?.relationshipTypes ?? [...DO_RELATIONSHIP_TYPES]).map((r) => [r, r] as [string, string])
                )}
                {formData.co_debtor_relationship === "Otro" && (
                  <div className="space-y-1 md:col-span-2">
                    {input("co_debtor_relationship_other", "Especifique relación *")}
                    {garanteErrors.co_debtor_relationship_other && <p className="text-xs text-forge-danger">{garanteErrors.co_debtor_relationship_other}</p>}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      );
    }
    if (currentStep === 4) {
      const docList = requiredDocumentsList;
      const checklistReceived = docList.filter((d) => Boolean(formData.documents_received[tenantDocumentKey(d)])).length;
      const extraReceived = formData.additional_document_items.filter((r) => r.received && isFilled(r.label)).length;
      const receivedCount = checklistReceived + extraReceived;
      const totalCount = docList.length + formData.additional_document_items.filter((r) => isFilled(r.label)).length;
      const requiredMissing = docList.filter((d) => d.required).filter((d) => !formData.documents_received[tenantDocumentKey(d)]).length;
      return (
        <div className="space-y-5">
          {sectionHeader(t.wizard.sections.documents_title, t.wizard.sections.documents_sub)}
          <div className="text-sm text-forge-text-muted">
            {t.documents.counter(receivedCount, Math.max(totalCount, docList.length))}
            {requiredMissing > 0 && (
              <span className="ml-2 text-forge-danger">({t.documents.missing_required(requiredMissing)})</span>
            )}
          </div>
          <div className="space-y-3" data-testid="documents-checklist">
            {docList.map((document) => {
              const k = tenantDocumentKey(document);
              const checked = Boolean(formData.documents_received[k]);
              return (
                <div key={k} className="flex items-start gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated p-3">
                  <input
                    type="checkbox"
                    id={`doc-${k}`}
                    className="mt-1"
                    checked={checked}
                    onChange={(event) => updateDocumentReceived(k, event.target.checked)}
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`doc-${k}`} className="text-sm font-medium text-forge-text">
                      {document.label}
                      {document.required ? <span className="ml-1 text-forge-danger">*</span> : <span className="ml-2 text-xs text-forge-text-muted">{t.common.optional_short}</span>}
                    </label>
                    {document.tooltip && <p className="mt-1 text-xs text-forge-text-muted">{document.tooltip}</p>}
                    <textarea
                      className="mt-2 min-h-12 w-full rounded-lg border border-forge-border bg-forge-surface px-3 py-2 text-sm text-forge-text"
                      placeholder={t.wizard.doc_notes_placeholder}
                      value={formData.document_notes[k] ?? ""}
                      onChange={(event) => updateField("document_notes", { ...formData.document_notes, [k]: event.target.value })}
                    />
                  </div>
                  <span className={`text-xs tabular-nums ${checked ? "text-forge-success" : "text-forge-text-muted"}`}>{checked ? t.documents.received : t.documents.pending}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-forge-text">{t.wizard.additional_docs_title}</h4>
            <ForgeButton type="button" variant="secondary" size="sm" onClick={addAdditionalDocumentRow}>
              {t.wizard.add_additional_doc}
            </ForgeButton>
            {formData.additional_document_items.map((row) => (
              <div key={row.id} className="flex flex-wrap items-end gap-2 rounded-xl border border-forge-border bg-forge-surface-elevated p-3">
                <div className="min-w-[12rem] flex-1">
                  <ForgeInput
                    label={t.wizard.additional_doc_label}
                    value={row.label}
                    onChange={(event) => updateAdditionalDocumentRow(row.id, { label: event.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-forge-text">
                  <input type="checkbox" checked={row.received} onChange={(event) => updateAdditionalDocumentRow(row.id, { received: event.target.checked })} />
                  {t.wizard.doc_received_label}
                </label>
                <ForgeButton type="button" variant="ghost" size="sm" onClick={() => removeAdditionalDocumentRow(row.id)} aria-label={t.common.delete_additional_doc_aria}>
                  ×
                </ForgeButton>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (currentStep === 5) {
      return (
        <div className="space-y-5">
          {sectionHeader(t.wizard.sections.consents_title, t.wizard.sections.consents_sub)}
          <ConsentSection
            applicationId={consentApplicationId}
            applicationIdReady={consentApplicationIdReady}
            consent_presence={formData.consent_presence}
            consent_bureau_authorization={formData.consent_bureau_authorization}
            consent_terms_accepted={formData.consent_terms_accepted}
            consent_data_processing_authorization={formData.consent_data_processing_authorization}
            consent_signature_full_name={formData.consent_signature_full_name}
            consent_present_confirmed={formData.consent_present_confirmed}
            consent_method={formData.consent_method}
            consent_audit_hash={formData.consent_audit_hash}
            consent_accepted_at={formData.consent_accepted_at}
            consent_sms_otp_sent={formData.consent_sms_otp_sent}
            consent_dealer_otp_code={formData.consent_dealer_otp_code}
            onPatch={(patch: ConsentWizardPatch) => setFormData((prev) => ({ ...prev, ...patch }))}
          />
        </div>
      );
    }
    const payload = buildCreateApplicationPayload(formData, { defaultDocumentType: defaultDocType });
    const preview = preliminaryViability(formData);
    const sections = [
      [t.wizard.review_sections.applicant, payload.applicant],
      [t.wizard.review_sections.employment, payload.employment],
      [t.wizard.review_sections.financial, { ...payload.financial, ...payload.vehicle }],
      [t.wizard.review_sections.co_debtor, payload.co_debtor],
      [t.wizard.review_sections.documents, payload.documents],
      [t.wizard.review_sections.consents, payload.consents],
    ] as const;
    return (
      <div className="space-y-5">
        {sectionHeader(t.wizard.sections.review_title, t.wizard.sections.review_sub)}
        <div className="rounded-2xl border border-forge-primary/20 bg-forge-primary/5 p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-forge-primary">{t.wizard.preview_viability}</p>
          <p className="mt-1 text-sm text-forge-text-muted">{t.wizard.preview_sub}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-forge-surface-elevated p-3">
              <p className="text-xs text-forge-text-muted">{t.wizard.preliminary_payment}</p>
              <p className="font-semibold text-forge-text">{formatDop(preview.payment)}</p>
            </div>
            <div className="rounded-xl bg-forge-surface-elevated p-3">
              <p className="text-xs text-forge-text-muted">{t.wizard.preliminary_capacity}</p>
              <p className="font-semibold text-forge-text">{formatDop(preview.capacity)}</p>
            </div>
            <div className="rounded-xl bg-forge-surface-elevated p-3">
              <p className="text-xs text-forge-text-muted">{t.wizard.preliminary_status}</p>
              <p className={preview.status === "verde" ? "font-semibold text-forge-success" : preview.status === "amarillo" ? "font-semibold text-forge-warning" : "font-semibold text-forge-danger"}>
                {preview.status === "verde" ? t.wizard.status_viable : preview.status === "amarillo" ? t.wizard.status_adjust : t.wizard.status_high_risk}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-forge-text-muted">{t.wizard.preview_footer}</p>
        </div>
        <div className="space-y-4">
          {sections.map(([title, values], index) => (
            <div key={title} className="rounded-xl bg-forge-surface-elevated p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-forge-text">{title}</h3>
                <ForgeButton variant="ghost" size="sm" onClick={() => setCurrentStep(index)}>
                  {t.common.edit}
                </ForgeButton>
              </div>
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                {Object.entries(values).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 border-b border-forge-border/50 pb-1">
                    <dt className="text-forge-text-muted">{key}</dt>
                    <dd className="text-right text-forge-text">
                      {value === true ? "Sí" : value === false ? "No" : value === null || value === undefined ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        {submitError && <p role="alert" className="rounded-xl border border-forge-danger/30 bg-forge-danger/10 p-3 text-sm text-forge-danger">{submitError}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <ForgeButton variant="secondary" size="lg" fullWidth onClick={() => handleSubmit("draft")} disabled={submitStatus === "submitting" || submitStatus === "success"} loading={submitStatus === "submitting"}>
            {t.common.save_draft}
          </ForgeButton>
          <ForgeButton variant="primary" size="lg" fullWidth onClick={() => handleSubmit("submitted")} disabled={submitStatus === "submitting" || submitStatus === "success"} loading={submitStatus === "submitting"} leftIcon={submitStatus === "success" ? <FileCheck className="h-5 w-5" /> : undefined}>
            {submitStatus === "success" ? t.common.created_success : t.common.submit}
          </ForgeButton>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div role="status" aria-live="polite" className="sr-only">
        {t.common.step_progress(currentStep + 1, steps.length)}: {steps[currentStep].title}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-forge-text-muted">
            {t.common.step_progress(currentStep + 1, steps.length)}
          </span>
          <span className="font-medium text-forge-text">{steps[currentStep].title}</span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-forge-surface-elevated">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-forge-primary to-forge-accent"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isComplete ? "var(--forge-success)" : isActive ? "var(--forge-primary)" : "var(--forge-surface-elevated)",
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                >
                  <Icon className={`h-5 w-5 ${isComplete || isActive ? "text-white" : "text-forge-text-muted"}`} />
                </motion.div>
                <span className={`text-xs ${isActive ? "font-medium text-forge-text" : "text-forge-text-muted"}`}>{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ForgeCard padding="lg">
        <AnimatePresence mode="wait" custom={currentStep}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </ForgeCard>

      {currentStep < steps.length - 1 && (
        <div className="flex items-center justify-between gap-3">
          <ForgeButton variant="ghost" onClick={() => router.back()} leftIcon={<ChevronLeft className="h-4 w-4" />} disabled={submitStatus === "submitting"}>
            {t.common.cancel}
          </ForgeButton>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <ForgeButton variant="secondary" onClick={handleBack} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                {t.common.back}
              </ForgeButton>
            )}

            <ForgeButton
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              {t.common.next}
            </ForgeButton>
          </div>
        </div>
      )}

      {!canProceed && currentStep < steps.length - 1 && (
        <p className="text-center text-sm text-forge-warning">{requiredHint(currentStep, formData, requiredDocumentsList, t)}</p>
      )}
    </div>
  );
}
