"use client";

import { useMemo } from "react";
import { documentTypeSelectOptions } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { Button, Checkbox, DateInput, Input, Select } from "@/components/forge";
import { formatDominicanCedula, cleanDominicanCedula } from "@/lib/credit/formatters/dominican-id";
import { validateDominicanCedula, validatePassport } from "@/lib/credit/validators/dominican-id";
import { calculateAge, parseDateInput } from "@/lib/credit/utils/age";
import { calculateEmploymentTenure } from "@/lib/credit/utils/employment-tenure";
import { calculateTotalMonthlyIncome, type Frequency } from "@/lib/credit/utils/income-normalizer";
import { useAdministrativeDivisions } from "@/lib/credit/catalogs/useAdministrativeDivisions";
import { useCatalogs } from "@/lib/credit-hub/hooks/useCatalogs";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { formatForgeCurrency } from "@/utils/forge-locale";
import { cleanDecimalInput, useDealerWizard } from "./DealerWizardProvider";
import { stepIsValid, type WizardStepValidationConfig } from "@/components/credit-hub/dealer/wizard/WizardContainer";

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

function documentIsValid(type: string, value: string): boolean {
  if (type === "CEDULA") return validateDominicanCedula(value);
  if (type === "PASAPORTE") return validatePassport(value);
  return value.trim().length > 0;
}

function numeric(value: string | number | null | undefined): number {
  const parsed = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function SectionStatus({ complete, label }: { complete: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 500,
        color: complete ? "var(--ch-success-text, #16a34a)" : "var(--ch-warning-text, #d97706)",
        background: complete ? "var(--ch-success-bg, #f0fdf4)" : "var(--ch-warning-bg, #fffbeb)",
        borderRadius: 6,
        padding: "2px 8px",
      }}
      aria-label={`${label}: ${complete ? "completo" : "incompleto"}`}
    >
      {complete ? "\u2713" : "\u25CB"} {label} {complete ? "completo" : "incompleto"}
    </span>
  );
}

export function DealerWizardApplicantEmploymentStep() {
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const { catalogs, loading: catalogsLoading } = useCatalogs();
  const administrativeDivisions = useAdministrativeDivisions(tenantConfig.country_code);
  const {
    formData,
    updateField,
    updateOtherIncomeRow,
    addOtherIncomeRow,
    removeOtherIncomeRow,
    setHasOtherIncome,
    validationConfig,
    getFieldError,
  } = useDealerWizard();

  const applicantDoc = formData.applicant_document_type || tenantConfig.document_types.primary_id;
  const birthDate = parseDateInput(formData.applicant_date_of_birth);
  const age = birthDate ? calculateAge(birthDate) : null;
  const docError =
    getFieldError("applicant_identification") ??
    (formData.applicant_identification && !documentIsValid(applicantDoc, formData.applicant_identification)
      ? applicantDoc === "CEDULA"
        ? t.validation.invalid_cedula
        : t.validation.invalid_passport
      : undefined);

  const selectedApplicantProvince = administrativeDivisions.find((item) => item.name === formData.applicant_province);
  const selectedEmployerProvince = administrativeDivisions.find((item) => item.name === formData.employer_province);

  const employmentStart = parseDateInput(formData.employment_start_date);
  const tenure = formData.employment_start_date ? calculateEmploymentTenure(formData.employment_start_date) : null;
  const tenureLabel = tenure?.isValid ? tenure.display : employmentStart ? t.validation.age_invalid : t.common.no_data;

  const otherIncomesToParts = () =>
    (formData.other_incomes ?? []).map((row) => ({
      amount: numeric(row.amount),
      frequency: row.frequency,
      variable_avg_6_months: row.variable_avg_6_months ? numeric(row.variable_avg_6_months) : undefined,
    }));

  const otherMonthlyTotal = formData.has_other_income === "yes" ? calculateTotalMonthlyIncome(0, otherIncomesToParts()) : 0;
  const totalIncomeDisplay = numeric(formData.monthly_income) + otherMonthlyTotal;

  const contractOptions = useMemo(
    () =>
      (catalogs?.contractTypes?.map((label) => ({ value: contractLabelToFormValue(label), label })) ?? [
        { value: "indefinido", label: "Indefinido" },
        { value: "temporal", label: "Temporal" },
        { value: "proyecto", label: "Por proyecto" },
        { value: "independiente", label: "Independiente" },
        { value: "otro", label: "Otro" },
      ]),
    [catalogs?.contractTypes]
  );

  const provinceOptions = useMemo(
    () => [
      { value: "", label: t.common.select_placeholder },
      ...administrativeDivisions.map((item) => ({ value: item.name, label: item.name })),
    ],
    [administrativeDivisions, t.common.select_placeholder]
  );

  const applicantMunicipalityOptions = useMemo(
    () => [
      { value: "", label: t.common.select_placeholder },
      ...(selectedApplicantProvince?.municipalities ?? []).map((m) => ({ value: m, label: m })),
    ],
    [selectedApplicantProvince?.municipalities, t.common.select_placeholder]
  );

  const employerMunicipalityOptions = useMemo(
    () => [
      { value: "", label: t.common.select_placeholder },
      ...(selectedEmployerProvince?.municipalities ?? []).map((m) => ({ value: m, label: m })),
    ],
    [selectedEmployerProvince?.municipalities, t.common.select_placeholder]
  );

  const docTypeSelect = useMemo(
    () =>
      documentTypeSelectOptions(tenantConfig).map(([value, label]) => ({
        value,
        label,
      })),
    [tenantConfig]
  );

  const applicantComplete = useMemo(() => stepIsValid(0, formData, validationConfig, t), [formData, validationConfig, t]);
  const employmentComplete = useMemo(() => stepIsValid(1, formData, validationConfig, t), [formData, validationConfig, t]);

  return (
    <div className="space-y-8">
      {/* Section-level completion summary (both sections required to advance) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 8,
          background: applicantComplete && employmentComplete
            ? "var(--ch-success-bg, #f0fdf4)"
            : "var(--ch-warning-bg, #fffbeb)",
          border: `1px solid ${applicantComplete && employmentComplete ? "var(--ch-success-line, #bbf7d0)" : "var(--ch-warning-line, #fde68a)"}`,
        }}
        data-testid="wizard-step1-section-status"
      >
        <SectionStatus complete={applicantComplete} label="Solicitante" />
        <span style={{ color: "var(--ch-text-3)", fontSize: 12, lineHeight: "20px" }}>&middot;</span>
        <SectionStatus complete={employmentComplete} label="Empleo" />
        {!applicantComplete || !employmentComplete ? (
          <span style={{ fontSize: 12, color: "var(--ch-text-3)", marginLeft: "auto", lineHeight: "20px" }}>
            Completa ambas secciones para continuar
          </span>
        ) : null}
      </div>

      <div id="section-applicant">
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.applicant_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">{t.wizard.sections.applicant_sub}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Nombre completo *"
          fieldKey="applicant_full_name"
          autoComplete="name"
          value={formData.applicant_full_name}
          onChange={(e) => updateField("applicant_full_name", e.target.value)}
          error={getFieldError("applicant_full_name")}
        />
        <Select
          label="Tipo de documento *"
          fieldKey="applicant_document_type"
          value={applicantDoc}
          onChange={(e) => updateField("applicant_document_type", e.target.value)}
          options={docTypeSelect}
        />
        {applicantDoc === "OTRO" ? (
          <Input
            label="Especifique tipo *"
            fieldKey="applicant_document_other_type"
            value={formData.applicant_document_other_type}
            onChange={(e) => updateField("applicant_document_other_type", e.target.value)}
            error={getFieldError("applicant_document_other_type")}
          />
        ) : null}
        <Input
          label="Número de documento *"
          fieldKey="applicant_identification"
          aria-label="Número de documento"
          value={applicantDoc === "CEDULA" ? formatDominicanCedula(formData.applicant_identification) : formData.applicant_identification}
          placeholder={applicantDoc === "CEDULA" ? "053-0003053-2" : "Pasaporte"}
          onChange={(e) =>
            updateField("applicant_identification", applicantDoc === "CEDULA" ? cleanDominicanCedula(e.target.value) : e.target.value.toUpperCase())
          }
          error={docError}
        />
        <DateInput
          label="Fecha de nacimiento *"
          fieldKey="applicant_date_of_birth"
          locale={tenantConfig.locale}
          value={formData.applicant_date_of_birth}
          onValueChange={(iso) => updateField("applicant_date_of_birth", iso)}
          error={getFieldError("applicant_date_of_birth")}
        />
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-3 md:col-span-1">
          <p className="text-forge-xs text-forgeGray-500">{t.wizard.calculated_age}</p>
          <p className="font-semibold text-forgeGray-800">{age === null ? t.common.no_data : t.wizard.years_suffix(age)}</p>
          {age !== null && age < tenantConfig.min_age ? (
            <p className="mt-1 text-forge-xs text-forgeDanger-600">{t.validation.age_min(tenantConfig.min_age)}</p>
          ) : null}
          {age !== null && age > tenantConfig.max_age ? (
            <p className="mt-1 text-forge-xs text-forgeDanger-600">{t.validation.age_over_max}</p>
          ) : null}
        </div>
        <Select
          label="Estado civil *"
          fieldKey="applicant_marital_status"
          value={formData.applicant_marital_status}
          onChange={(e) => updateField("applicant_marital_status", e.target.value)}
          error={getFieldError("applicant_marital_status")}
          options={[
            { value: "", label: t.common.select_placeholder },
            { value: "single", label: "Soltero/a" },
            { value: "married", label: "Casado/a" },
            { value: "union", label: "Unión libre" },
            { value: "divorced", label: "Divorciado/a" },
            { value: "widowed", label: "Viudo/a" },
          ]}
        />
        <Input label="Teléfono *" fieldKey="applicant_phone" type="tel" autoComplete="tel" value={formData.applicant_phone} onChange={(e) => updateField("applicant_phone", e.target.value)} error={getFieldError("applicant_phone")} />
        <Input label="Correo electrónico *" fieldKey="applicant_email" type="email" autoComplete="email" value={formData.applicant_email} onChange={(e) => updateField("applicant_email", e.target.value)} error={getFieldError("applicant_email")} />
        <Input label="País *" fieldKey="applicant_country" value={formData.applicant_country} onChange={(e) => updateField("applicant_country", e.target.value)} error={getFieldError("applicant_country")} />
        <Input label="Dirección *" fieldKey="applicant_address" className="md:col-span-2" value={formData.applicant_address} onChange={(e) => updateField("applicant_address", e.target.value)} error={getFieldError("applicant_address")} />
        <Select
          label="Provincia *"
          fieldKey="applicant_province"
          value={formData.applicant_province}
          onChange={(e) => updateField("applicant_province", e.target.value)}
          error={getFieldError("applicant_province")}
          options={provinceOptions}
        />
        <Select
          label="Municipio *"
          fieldKey="applicant_city"
          value={formData.applicant_city}
          onChange={(e) => updateField("applicant_city", e.target.value)}
          error={getFieldError("applicant_city")}
          options={applicantMunicipalityOptions}
          disabled={!selectedApplicantProvince}
        />
      </div>

      <div id="section-employment">
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.employment_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">{t.wizard.sections.employment_sub}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Tipo de empleo *"
          fieldKey="employment_type"
          value={formData.employment_type}
          onChange={(e) => updateField("employment_type", e.target.value)}
          error={getFieldError("employment_type")}
          options={[
            { value: "", label: t.common.select_placeholder },
            { value: "employee", label: "Empleado privado" },
            { value: "public_employee", label: "Empleado público" },
            { value: "self_employed", label: "Independiente" },
            { value: "business_owner", label: "Dueño de negocio" },
            { value: "retired", label: "Pensionado" },
          ]}
        />
        <Input label="Empresa donde trabaja *" fieldKey="employer_name" value={formData.employer_name} onChange={(e) => updateField("employer_name", e.target.value)} error={getFieldError("employer_name")} />
        <Input label="Cargo *" fieldKey="employment_position" value={formData.employment_position} onChange={(e) => updateField("employment_position", e.target.value)} error={getFieldError("employment_position")} />
        <DateInput
          label="Fecha de ingreso al empleo *"
          fieldKey="employment_start_date"
          locale={tenantConfig.locale}
          value={formData.employment_start_date}
          onValueChange={(iso) => updateField("employment_start_date", iso)}
          error={getFieldError("employment_start_date")}
        />
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-3">
          <p className="text-forge-xs text-forgeGray-500">{t.wizard.calculated_tenure}</p>
          <p className="font-semibold text-forgeGray-800">{tenureLabel}</p>
        </div>
        <Input
          label="Ingreso mensual neto *"
          fieldKey="monthly_income"
          inputMode="decimal"
          value={formData.monthly_income}
          onChange={(e) => updateField("monthly_income", cleanDecimalInput(e.target.value))}
          error={getFieldError("monthly_income")}
        />
        <Input label="Teléfono empresa *" fieldKey="work_phone" type="tel" value={formData.work_phone} onChange={(e) => updateField("work_phone", e.target.value)} error={getFieldError("work_phone")} />
        <Input label="Dirección de la empresa *" fieldKey="employer_address" className="md:col-span-2" value={formData.employer_address} onChange={(e) => updateField("employer_address", e.target.value)} error={getFieldError("employer_address")} />
        <Select
          label="Provincia empresa *"
          fieldKey="employer_province"
          value={formData.employer_province}
          onChange={(e) => updateField("employer_province", e.target.value)}
          error={getFieldError("employer_province")}
          options={provinceOptions}
        />
        <Select
          label="Municipio empresa *"
          fieldKey="employer_city"
          value={formData.employer_city}
          onChange={(e) => updateField("employer_city", e.target.value)}
          error={getFieldError("employer_city")}
          options={employerMunicipalityOptions}
          disabled={!selectedEmployerProvince}
        />
        <Select
          label="Tipo de contrato *"
          fieldKey="contract_type"
          value={formData.contract_type}
          onChange={(e) => updateField("contract_type", e.target.value)}
          error={getFieldError("contract_type")}
          options={[{ value: "", label: t.common.select_placeholder }, ...contractOptions]}
        />
        <div className="md:col-span-2">
          <Select
            label="¿Tiene otros ingresos además del salario? *"
            value={formData.has_other_income}
            onChange={(e) => setHasOtherIncome(e.target.value as "yes" | "no")}
            options={[
              { value: "no", label: "No" },
              { value: "yes", label: "Sí" },
            ]}
          />
        </div>
        {formData.has_other_income === "yes" ? (
          <div className="md:col-span-2 space-y-3 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-forge-sm font-medium text-forgeGray-800">Otras fuentes de ingreso</p>
              <Button type="button" variant="secondary" size="sm" onClick={addOtherIncomeRow}>
                Agregar fuente de ingreso
              </Button>
            </div>
            {formData.other_incomes.map((row) => (
              <div key={row.id} className="grid gap-3 rounded-forge-sm border border-forgeGray-100 bg-forgeSurface-card p-3 md:grid-cols-2">
                <Select
                  label="Concepto *"
                  fieldKey={`other_income_${row.id}_concept`}
                  value={row.concept}
                  onChange={(e) => updateOtherIncomeRow(row.id, { concept: e.target.value })}
                  disabled={catalogsLoading || !catalogs}
                  error={getFieldError(`other_income_${row.id}_concept`)}
                  options={(catalogs?.incomeConcepts ?? ["Otro"]).map((c) => ({ value: c, label: c }))}
                />
                <Input
                  label="Monto *"
                  fieldKey={`other_income_${row.id}_amount`}
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(e) => updateOtherIncomeRow(row.id, { amount: cleanDecimalInput(e.target.value) })}
                  error={getFieldError(`other_income_${row.id}_amount`)}
                />
                <Select
                  label="Frecuencia *"
                  fieldKey={`other_income_${row.id}_frequency`}
                  value={row.frequency}
                  onChange={(e) => updateOtherIncomeRow(row.id, { frequency: e.target.value as Frequency })}
                  disabled={catalogsLoading || !catalogs}
                  error={getFieldError(`other_income_${row.id}_frequency`)}
                  options={(catalogs?.paymentFrequencies ?? ["MENSUAL"]).map((f) => ({ value: f, label: f }))}
                />
                {row.frequency === "VARIABLE" ? (
                  <Input
                    label="Promedio últimos 6 meses *"
                    fieldKey={`other_income_${row.id}_variable_avg_6_months`}
                    inputMode="decimal"
                    value={row.variable_avg_6_months ?? ""}
                    onChange={(e) => updateOtherIncomeRow(row.id, { variable_avg_6_months: cleanDecimalInput(e.target.value) })}
                    error={getFieldError(`other_income_${row.id}_variable_avg_6_months`)}
                  />
                ) : null}
                <Checkbox
                  label="Ingreso documentado"
                  checked={row.is_documented}
                  onChange={(e) => updateOtherIncomeRow(row.id, { is_documented: e.target.checked })}
                  className="md:col-span-2"
                />
                <div className="flex justify-end md:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={formData.has_other_income === "yes" && formData.other_incomes.length <= 1}
                    onClick={() => removeOtherIncomeRow(row.id)}
                  >
                    Eliminar fuente
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="rounded-forge-md bg-forgeBrand-500/10 p-4 text-forge-sm text-forgeGray-700">
        Ingreso total mensual estimado:{" "}
        <span className="font-semibold tabular-nums">
          {formatForgeCurrency(totalIncomeDisplay, tenantConfig.locale, tenantConfig.currency_code || "DOP")}
        </span>
      </div>
    </div>
  );
}
