"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Briefcase, Car, ChevronLeft, ChevronRight, ClipboardCheck, DollarSign, FileCheck, FileText, ShieldCheck, User, Users } from "lucide-react";
import { ForgeButton } from "../../primitives/ForgeButton";
import { ForgeCard } from "../../primitives/ForgeCard";
import { ForgeInput } from "../../primitives/ForgeInput";
import { ForgeSelect } from "../../primitives/ForgeSelect";
import { useCreateCreditApplication } from "@/lib/credit-hub/hooks/useCreateCreditApplication";
import type { CreateCreditApplicationPayload } from "@/lib/credit-hub/types/creditCore";
import { celebrateSuccessRespectReduced } from "@/lib/credit-hub/utils/celebrate";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";

export interface ApplicationFormData {
  applicant_full_name: string;
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
  time_in_job: string;
  monthly_income: string;
  other_income: string;
  payment_frequency: string;
  work_phone: string;
  requested_amount: string;
  desired_term: string;
  down_payment: string;
  monthly_debts: string;
  estimated_monthly_expenses: string;
  primary_bank: string;
  has_bank_account: "yes" | "no";
  has_late_payment_history: "yes" | "no";
  max_late_payment_days: string;
  product_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_price: string;
  dealer_supplier: string;
  vehicle_condition: string;
  co_debtor_required: "yes" | "no";
  co_debtor_full_name: string;
  co_debtor_identification: string;
  co_debtor_phone: string;
  co_debtor_monthly_income: string;
  co_debtor_relationship: string;
  co_debtor_employment: string;
  document_id_uploaded: boolean;
  document_income_proof_uploaded: boolean;
  document_bank_statement_uploaded: boolean;
  document_bureau_authorization_uploaded: boolean;
  document_invoice_uploaded: boolean;
  consent_bureau_authorization: boolean;
  consent_terms_accepted: boolean;
  consent_data_processing_authorization: boolean;
}

const initialData: ApplicationFormData = {
  applicant_full_name: "",
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
  time_in_job: "",
  monthly_income: "",
  other_income: "0",
  payment_frequency: "",
  work_phone: "",
  requested_amount: "",
  desired_term: "",
  down_payment: "",
  monthly_debts: "",
  estimated_monthly_expenses: "",
  primary_bank: "",
  has_bank_account: "yes",
  has_late_payment_history: "no",
  max_late_payment_days: "",
  product_type: "vehicle",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_price: "",
  dealer_supplier: "",
  vehicle_condition: "",
  co_debtor_required: "no",
  co_debtor_full_name: "",
  co_debtor_identification: "",
  co_debtor_phone: "",
  co_debtor_monthly_income: "",
  co_debtor_relationship: "",
  co_debtor_employment: "",
  document_id_uploaded: false,
  document_income_proof_uploaded: false,
  document_bank_statement_uploaded: false,
  document_bureau_authorization_uploaded: false,
  document_invoice_uploaded: false,
  consent_bureau_authorization: false,
  consent_terms_accepted: false,
  consent_data_processing_authorization: false,
};

const steps = [
  { id: "applicant", title: "Solicitante", icon: User },
  { id: "employment", title: "Laboral", icon: Briefcase },
  { id: "financial", title: "Finanzas", icon: DollarSign },
  { id: "vehicle", title: "Producto", icon: Car },
  { id: "co_debtor", title: "Garante", icon: Users },
  { id: "documents", title: "Documentos", icon: FileText },
  { id: "consents", title: "Consentimientos", icon: ShieldCheck },
  { id: "review", title: "Revisión", icon: ClipboardCheck },
];

function cleanDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [first, ...rest] = cleaned.split(".");
  return rest.length ? `${first}.${rest.join("")}` : first;
}

export function buildCreateApplicationPayload(formData: ApplicationFormData): CreateCreditApplicationPayload {
  return {
    applicant: {
      full_name: formData.applicant_full_name.trim(),
      identification: formData.applicant_identification.trim(),
      date_of_birth: formData.applicant_date_of_birth,
      age: formData.applicant_age,
      marital_status: formData.applicant_marital_status,
      phone: formData.applicant_phone.trim(),
      email: formData.applicant_email.trim(),
      address: formData.applicant_address.trim(),
      city: formData.applicant_city.trim(),
      province: formData.applicant_province.trim(),
      country: formData.applicant_country.trim(),
    },
    employment: {
      employment_type: formData.employment_type,
      employer_name: formData.employer_name.trim(),
      position: formData.employment_position.trim(),
      time_in_job: formData.time_in_job.trim(),
      monthly_income: formData.monthly_income,
      other_income: formData.other_income || "0",
      payment_frequency: formData.payment_frequency,
      work_phone: formData.work_phone.trim(),
    },
    financial: {
      requested_amount: formData.requested_amount,
      desired_term: formData.desired_term,
      down_payment: formData.down_payment || "0",
      monthly_debts: formData.monthly_debts || "0",
      estimated_monthly_expenses: formData.estimated_monthly_expenses || "0",
      primary_bank: formData.primary_bank.trim(),
      has_bank_account: formData.has_bank_account === "yes",
      has_late_payment_history: formData.has_late_payment_history === "yes",
      max_late_payment_days: formData.has_late_payment_history === "yes" ? formData.max_late_payment_days || "0" : null,
    },
    vehicle: {
      product_type: formData.product_type,
      make: formData.vehicle_make.trim(),
      model: formData.vehicle_model.trim(),
      year: formData.vehicle_year,
      price: formData.vehicle_price,
      dealer_supplier: formData.dealer_supplier.trim(),
      condition: formData.vehicle_condition,
    },
    co_debtor: {
      required: formData.co_debtor_required === "yes",
      full_name: formData.co_debtor_full_name.trim(),
      identification: formData.co_debtor_identification.trim(),
      phone: formData.co_debtor_phone.trim(),
      monthly_income: formData.co_debtor_monthly_income,
      relationship: formData.co_debtor_relationship.trim(),
      employment: formData.co_debtor_employment.trim(),
    },
    documents: {
      id_uploaded: formData.document_id_uploaded,
      income_proof_uploaded: formData.document_income_proof_uploaded,
      bank_statement_uploaded: formData.document_bank_statement_uploaded,
      bureau_authorization_uploaded: formData.document_bureau_authorization_uploaded,
      invoice_uploaded: formData.document_invoice_uploaded,
    },
    consents: {
      bureau_authorization: formData.consent_bureau_authorization,
      terms_accepted: formData.consent_terms_accepted,
      data_processing_authorization: formData.consent_data_processing_authorization,
    },
    source: "forge_dealer_portal",
    version: "full_credit_application_v1",
  };
}

function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

function stepIsValid(step: number, data: ApplicationFormData): boolean {
  if (step === 0) {
    return [
      data.applicant_full_name,
      data.applicant_identification,
      data.applicant_date_of_birth,
      data.applicant_age,
      data.applicant_marital_status,
      data.applicant_phone,
      data.applicant_email,
      data.applicant_address,
      data.applicant_city,
      data.applicant_province,
      data.applicant_country,
    ].every(isFilled);
  }
  if (step === 1) {
    return [data.employment_type, data.employer_name, data.employment_position, data.time_in_job, data.monthly_income, data.payment_frequency, data.work_phone].every(isFilled);
  }
  if (step === 2) {
    const latePaymentValid = data.has_late_payment_history === "no" || isFilled(data.max_late_payment_days);
    return [data.requested_amount, data.desired_term, data.down_payment, data.monthly_debts, data.estimated_monthly_expenses, data.primary_bank].every(isFilled) && latePaymentValid;
  }
  if (step === 3) {
    return [data.product_type, data.vehicle_make, data.vehicle_model, data.vehicle_year, data.vehicle_price, data.dealer_supplier, data.vehicle_condition].every(isFilled);
  }
  if (step === 4) {
    if (data.co_debtor_required === "no") return true;
    return [data.co_debtor_full_name, data.co_debtor_identification, data.co_debtor_phone, data.co_debtor_monthly_income, data.co_debtor_relationship, data.co_debtor_employment].every(isFilled);
  }
  if (step === 6) {
    return data.consent_bureau_authorization && data.consent_terms_accepted && data.consent_data_processing_authorization;
  }
  return true;
}

function requiredHint(step: number): string {
  if (step === 4) return "Completa los datos del co-deudor o marca que no es requerido.";
  if (step === 6) return "Los tres consentimientos son obligatorios para enviar.";
  return "Completa los campos obligatorios para continuar.";
}

function numeric(value: string | number | null | undefined): number {
  const parsed = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function preliminaryPayment(principal: number, annualRate = 18, months = 36): number {
  const safePrincipal = Math.max(0, principal);
  const safeMonths = Math.max(1, months);
  const monthlyRate = annualRate / 100 / 12;
  if (safePrincipal === 0) return 0;
  if (monthlyRate === 0) return safePrincipal / safeMonths;
  return safePrincipal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -safeMonths));
}

function preliminaryViability(data: ApplicationFormData) {
  const income = numeric(data.monthly_income) + numeric(data.other_income) + (data.co_debtor_required === "yes" ? numeric(data.co_debtor_monthly_income) : 0);
  const capacity = income * 0.35;
  const productPrice = numeric(data.vehicle_price);
  const requested = numeric(data.requested_amount);
  const downPayment = numeric(data.down_payment);
  const principalFromPrice = Math.max(0, productPrice - downPayment);
  const principal = requested > 0 && requested < principalFromPrice ? requested : principalFromPrice;
  const term = Math.max(1, Math.round(numeric(data.desired_term) || 36));
  const payment = preliminaryPayment(principal, 18, term);
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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ApplicationFormData>(initialData);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateCreditApplication();

  const updateField = <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = stepIsValid(currentStep, formData);

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceed) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (_status: "draft" | "submitted") => {
    if (!stepIsValid(6, formData)) {
      setSubmitStatus("error");
      setSubmitError("Debes aceptar todos los consentimientos antes de enviar.");
      return;
    }
    setSubmitStatus("submitting");
    setSubmitError(null);
    try {
      const result = await createMutation.mutateAsync(buildCreateApplicationPayload(formData));
      setSubmitStatus("success");
      celebrateSuccessRespectReduced();
      forgeToast.success("¡Solicitud creada exitosamente!");
      setTimeout(() => {
        router.push(`/credit-hub/dealer/applications/${result.application_id}`);
      }, 1500);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : "No se pudo crear la solicitud.");
      forgeToast.error(error instanceof Error ? error.message : "No se pudo crear la solicitud.");
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
      <option value="">Selecciona...</option>
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
      return (
        <div className="space-y-5">
          {sectionHeader("Datos del solicitante", "Identificación y datos de contacto del cliente.")}
          <div className="grid gap-4 md:grid-cols-2">
            {input("applicant_full_name", "Nombre completo *", { autoFocus: true })}
            {input("applicant_identification", "Cédula / Identificación *")}
            {input("applicant_date_of_birth", "Fecha de nacimiento *", { type: "date" })}
            {input("applicant_age", "Edad *", { type: "number" })}
            {select("applicant_marital_status", "Estado civil *", [["single", "Soltero/a"], ["married", "Casado/a"], ["union", "Unión libre"], ["divorced", "Divorciado/a"], ["widowed", "Viudo/a"]])}
            {input("applicant_phone", "Teléfono *", { type: "tel" })}
            {input("applicant_email", "Email *", { type: "email" })}
            {input("applicant_country", "País *")}
            {input("applicant_address", "Dirección *", { className: "md:col-span-2" })}
            {input("applicant_city", "Ciudad *")}
            {input("applicant_province", "Provincia *")}
          </div>
        </div>
      );
    }
    if (currentStep === 1) {
      return (
        <div className="space-y-5">
          {sectionHeader("Información laboral", "Capacidad de pago y estabilidad laboral.")}
          <div className="grid gap-4 md:grid-cols-2">
            {select("employment_type", "Tipo de empleo *", [["employee", "Empleado privado"], ["public_employee", "Empleado público"], ["self_employed", "Independiente"], ["business_owner", "Dueño de negocio"], ["retired", "Pensionado"]])}
            {input("employer_name", "Empresa donde trabaja *")}
            {input("employment_position", "Cargo *")}
            {input("time_in_job", "Tiempo en empleo *", { placeholder: "Ej: 2 años" })}
            {input("monthly_income", "Ingreso mensual *", { inputMode: "decimal" })}
            {input("other_income", "Otros ingresos", { inputMode: "decimal" })}
            {select("payment_frequency", "Frecuencia de pago *", [["weekly", "Semanal"], ["biweekly", "Quincenal"], ["monthly", "Mensual"]])}
            {input("work_phone", "Teléfono laboral *", { type: "tel" })}
          </div>
        </div>
      );
    }
    if (currentStep === 2) {
      return (
        <div className="space-y-5">
          {sectionHeader("Información financiera", "Condiciones solicitadas y obligaciones actuales.")}
          <div className="grid gap-4 md:grid-cols-2">
            {input("requested_amount", "Monto solicitado *", { inputMode: "decimal" })}
            {input("desired_term", "Plazo deseado *", { placeholder: "Ej: 48 meses" })}
            {input("down_payment", "Cuota inicial *", { inputMode: "decimal" })}
            {input("monthly_debts", "Deudas mensuales *", { inputMode: "decimal" })}
            {input("estimated_monthly_expenses", "Gasto mensual estimado *", { inputMode: "decimal" })}
            {input("primary_bank", "Banco principal *")}
            {boolSelect("has_bank_account", "Tiene cuenta bancaria *")}
            {boolSelect("has_late_payment_history", "Historial de mora *")}
            {formData.has_late_payment_history === "yes" && input("max_late_payment_days", "Días máximos de mora *", { type: "number" })}
          </div>
        </div>
      );
    }
    if (currentStep === 3) {
      return (
        <div className="space-y-5">
          {sectionHeader("Vehículo / producto financiado", "Datos del activo o producto a financiar.")}
          <div className="grid gap-4 md:grid-cols-2">
            {select("product_type", "Tipo de producto *", [["vehicle", "Vehículo"], ["motorcycle", "Motocicleta"], ["equipment", "Equipo"], ["other", "Otro"]])}
            {input("vehicle_make", "Marca *")}
            {input("vehicle_model", "Modelo *")}
            {input("vehicle_year", "Año *", { type: "number" })}
            {input("vehicle_price", "Precio *", { inputMode: "decimal" })}
            {input("dealer_supplier", "Dealer / Suplidor *")}
            {select("vehicle_condition", "Condición *", [["new", "Nuevo"], ["used", "Usado"]])}
          </div>
        </div>
      );
    }
    if (currentStep === 4) {
      return (
        <div className="space-y-5">
          {sectionHeader("Co-deudor / garante", "Completa esta sección solo si la operación requiere garante.")}
          <div className="grid gap-4 md:grid-cols-2">
            {boolSelect("co_debtor_required", "Requiere co-deudor *")}
            {formData.co_debtor_required === "yes" && (
              <>
                {input("co_debtor_full_name", "Nombre co-deudor *")}
                {input("co_debtor_identification", "Cédula co-deudor *")}
                {input("co_debtor_phone", "Teléfono co-deudor *", { type: "tel" })}
                {input("co_debtor_monthly_income", "Ingreso mensual co-deudor *", { inputMode: "decimal" })}
                {input("co_debtor_relationship", "Relación con solicitante *")}
                {input("co_debtor_employment", "Empleo co-deudor *")}
              </>
            )}
          </div>
        </div>
      );
    }
    if (currentStep === 5) {
      return (
        <div className="space-y-5">
          {sectionHeader("Documentos requeridos", "Marca los documentos recibidos. La carga de archivos llegará después.")}
          <div className="grid gap-3 md:grid-cols-2">
            {checkbox("document_id_uploaded", "Cédula cargada")}
            {checkbox("document_income_proof_uploaded", "Comprobante ingresos")}
            {checkbox("document_bank_statement_uploaded", "Estado de cuenta")}
            {checkbox("document_bureau_authorization_uploaded", "Autorización buró")}
            {checkbox("document_invoice_uploaded", "Factura / proforma")}
          </div>
        </div>
      );
    }
    if (currentStep === 6) {
      return (
        <div className="space-y-5">
          {sectionHeader("Consentimientos", "Todos son obligatorios antes de enviar la solicitud.")}
          <div className="space-y-3">
            {checkbox("consent_bureau_authorization", "Autorizo la consulta de buró de crédito *")}
            {checkbox("consent_terms_accepted", "Acepto los términos y condiciones *")}
            {checkbox("consent_data_processing_authorization", "Autorizo el tratamiento de datos personales *")}
          </div>
        </div>
      );
    }
    const payload = buildCreateApplicationPayload(formData);
    const preview = preliminaryViability(formData);
    const sections = [
      ["Solicitante", payload.applicant],
      ["Laboral", payload.employment],
      ["Financiera", payload.financial],
      ["Vehículo / Producto", payload.vehicle],
      ["Co-deudor", payload.co_debtor],
      ["Documentos", payload.documents],
      ["Consentimientos", payload.consents],
    ] as const;
    return (
      <div className="space-y-5">
        {sectionHeader("Revisión final", "Verifica la solicitud completa antes de guardar o enviar.")}
        <div className="rounded-2xl border border-forge-primary/20 bg-forge-primary/5 p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-forge-primary">Previsualización de viabilidad</p>
          <p className="mt-1 text-sm text-forge-text-muted">Estimación preliminar antes de enviar.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-forge-surface-elevated p-3">
              <p className="text-xs text-forge-text-muted">Cuota estimada preliminar</p>
              <p className="font-semibold text-forge-text">{formatDop(preview.payment)}</p>
            </div>
            <div className="rounded-xl bg-forge-surface-elevated p-3">
              <p className="text-xs text-forge-text-muted">Capacidad estimada preliminar</p>
              <p className="font-semibold text-forge-text">{formatDop(preview.capacity)}</p>
            </div>
            <div className="rounded-xl bg-forge-surface-elevated p-3">
              <p className="text-xs text-forge-text-muted">Status preliminar</p>
              <p className={preview.status === "verde" ? "font-semibold text-forge-success" : preview.status === "amarillo" ? "font-semibold text-forge-warning" : "font-semibold text-forge-danger"}>
                {preview.status === "verde" ? "Viable" : preview.status === "amarillo" ? "Requiere ajuste" : "Riesgo alto"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-forge-text-muted">El análisis completo con Forge AI estará disponible después de enviar la solicitud.</p>
        </div>
        <div className="space-y-4">
          {sections.map(([title, values], index) => (
            <div key={title} className="rounded-xl bg-forge-surface-elevated p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-forge-text">{title}</h3>
                <ForgeButton variant="ghost" size="sm" onClick={() => setCurrentStep(index)}>
                  Editar
                </ForgeButton>
              </div>
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                {Object.entries(values).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 border-b border-forge-border/50 pb-1">
                    <dt className="text-forge-text-muted">{key}</dt>
                    <dd className="text-right text-forge-text">{value === true ? "Sí" : value === false ? "No" : value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        {submitError && <p role="alert" className="rounded-xl border border-forge-danger/30 bg-forge-danger/10 p-3 text-sm text-forge-danger">{submitError}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <ForgeButton variant="secondary" size="lg" fullWidth onClick={() => handleSubmit("draft")} disabled={submitStatus === "submitting" || submitStatus === "success"} loading={submitStatus === "submitting"}>
            Guardar borrador
          </ForgeButton>
          <ForgeButton variant="primary" size="lg" fullWidth onClick={() => handleSubmit("submitted")} disabled={submitStatus === "submitting" || submitStatus === "success"} loading={submitStatus === "submitting"} leftIcon={submitStatus === "success" ? <FileCheck className="h-5 w-5" /> : undefined}>
            {submitStatus === "success" ? "¡Creada exitosamente!" : "Enviar solicitud"}
          </ForgeButton>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div role="status" aria-live="polite" className="sr-only">
        Paso {currentStep + 1} de {steps.length}: {steps[currentStep].title}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-forge-text-muted">
            Paso {currentStep + 1} de {steps.length}
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
            Cancelar
          </ForgeButton>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <ForgeButton variant="secondary" onClick={handleBack} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                Atrás
              </ForgeButton>
            )}

            <ForgeButton
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Siguiente
            </ForgeButton>
          </div>
        </div>
      )}

      {!canProceed && currentStep < steps.length - 1 && (
        <p className="text-center text-sm text-forge-warning">{requiredHint(currentStep)}</p>
      )}
    </div>
  );
}
