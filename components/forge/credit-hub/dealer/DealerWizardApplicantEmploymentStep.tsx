"use client";

import { useCallback, useMemo } from "react";
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
    showValidationErrors,
    touchedFields,
    touchField,
    fieldErrors,
  } = useDealerWizard();

  const shouldShowError = useCallback(
    (name: string): string | undefined => {
      if ((showValidationErrors || touchedFields.has(name)) && fieldErrors[name]) {
        return fieldErrors[name];
      }
      return undefined;
    },
    [showValidationErrors, touchedFields, fieldErrors]
  );

  const applicantDoc = formData.applicant_document_type || tenantConfig.document_types.primary_id;
  const birthDate = parseDateInput(formData.applicant_date_of_birth);
  const age = birthDate ? calculateAge(birthDate) : null;
  const docError =
    formData.applicant_identification && !documentIsValid(applicantDoc, formData.applicant_identification)
      ? applicantDoc === "CEDULA"
        ? t.validation.invalid_cedula
        : t.validation.invalid_passport
      : undefined;

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.applicant_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">{t.wizard.sections.applicant_sub}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Nombre completo *"
          autoComplete="name"
          value={formData.applicant_full_name}
          onChange={(e) => updateField("applicant_full_name", e.target.value)}
          onBlur={() => touchField("applicant_full_name")}
          error={shouldShowError("applicant_full_name")}
        />
        <Select
          label="Tipo de documento *"
          value={applicantDoc}
          onChange={(e) => updateField("applicant_document_type", e.target.value)}
          options={docTypeSelect}
        />
        {applicantDoc === "OTRO" ? (
          <Input
            label="Especifique tipo *"
            value={formData.applicant_document_other_type}
            onChange={(e) => updateField("applicant_document_other_type", e.target.value)}
          />
        ) : null}
        <Input
          label="Número de documento *"
          aria-label="Número de documento"
          value={applicantDoc === "CEDULA" ? formatDominicanCedula(formData.applicant_identification) : formData.applicant_identification}
          placeholder={applicantDoc === "CEDULA" ? "053-0003053-2" : "Pasaporte"}
          onChange={(e) =>
            updateField("applicant_identification", applicantDoc === "CEDULA" ? cleanDominicanCedula(e.target.value) : e.target.value.toUpperCase())
          }
          onBlur={() => touchField("applicant_identification")}
          error={docError ?? shouldShowError("applicant_identification")}
        />
        <DateInput
          label="Fecha de nacimiento *"
          locale={tenantConfig.locale}
          value={formData.applicant_date_of_birth}
          onValueChange={(iso) => updateField("applicant_date_of_birth", iso)}
          onBlur={() => touchField("applicant_date_of_birth")}
          error={shouldShowError("applicant_date_of_birth")}
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
          value={formData.applicant_marital_status}
          onChange={(e) => updateField("applicant_marital_status", e.target.value)}
          onBlur={() => touchField("applicant_marital_status")}
          error={shouldShowError("applicant_marital_status")}
          options={[
            { value: "", label: t.common.select_placeholder },
            { value: "single", label: "Soltero/a" },
            { value: "married", label: "Casado/a" },
            { value: "union", label: "Unión libre" },
            { value: "divorced", label: "Divorciado/a" },
            { value: "widowed", label: "Viudo/a" },
          ]}
        />
        <Input label="Teléfono *" type="tel" autoComplete="tel" value={formData.applicant_phone} onChange={(e) => updateField("applicant_phone", e.target.value)} onBlur={() => touchField("applicant_phone")} error={shouldShowError("applicant_phone")} />
        <Input label="Correo electrónico *" type="email" autoComplete="email" value={formData.applicant_email} onChange={(e) => updateField("applicant_email", e.target.value)} onBlur={() => touchField("applicant_email")} error={shouldShowError("applicant_email")} />
        <Input label="País *" value={formData.applicant_country} onChange={(e) => updateField("applicant_country", e.target.value)} onBlur={() => touchField("applicant_country")} error={shouldShowError("applicant_country")} />
        <Input label="Dirección *" className="md:col-span-2" value={formData.applicant_address} onChange={(e) => updateField("applicant_address", e.target.value)} onBlur={() => touchField("applicant_address")} error={shouldShowError("applicant_address")} />
        <Select
          label="Provincia *"
          value={formData.applicant_province}
          onChange={(e) => updateField("applicant_province", e.target.value)}
          onBlur={() => touchField("applicant_province")}
          error={shouldShowError("applicant_province")}
          options={provinceOptions}
        />
        <Select
          label="Municipio *"
          value={formData.applicant_city}
          onChange={(e) => updateField("applicant_city", e.target.value)}
          onBlur={() => touchField("applicant_city")}
          error={shouldShowError("applicant_city")}
          options={applicantMunicipalityOptions}
          disabled={!selectedApplicantProvince}
        />
      </div>

      <div>
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.employment_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">{t.wizard.sections.employment_sub}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Tipo de empleo *"
          value={formData.employment_type}
          onChange={(e) => updateField("employment_type", e.target.value)}
          onBlur={() => touchField("employment_type")}
          error={shouldShowError("employment_type")}
          options={[
            { value: "", label: t.common.select_placeholder },
            { value: "employee", label: "Empleado privado" },
            { value: "public_employee", label: "Empleado público" },
            { value: "self_employed", label: "Independiente" },
            { value: "business_owner", label: "Dueño de negocio" },
            { value: "retired", label: "Pensionado" },
          ]}
        />
        <Input label="Empresa donde trabaja *" value={formData.employer_name} onChange={(e) => updateField("employer_name", e.target.value)} onBlur={() => touchField("employer_name")} error={shouldShowError("employer_name")} />
        <Input label="Cargo *" value={formData.employment_position} onChange={(e) => updateField("employment_position", e.target.value)} onBlur={() => touchField("employment_position")} error={shouldShowError("employment_position")} />
        <DateInput
          label="Fecha de ingreso al empleo *"
          locale={tenantConfig.locale}
          value={formData.employment_start_date}
          onValueChange={(iso) => updateField("employment_start_date", iso)}
          onBlur={() => touchField("employment_start_date")}
          error={shouldShowError("employment_start_date")}
        />
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-3">
          <p className="text-forge-xs text-forgeGray-500">{t.wizard.calculated_tenure}</p>
          <p className="font-semibold text-forgeGray-800">{tenureLabel}</p>
        </div>
        <Input
          label="Ingreso mensual neto *"
          inputMode="decimal"
          value={formData.monthly_income}
          onChange={(e) => updateField("monthly_income", cleanDecimalInput(e.target.value))}
          onBlur={() => touchField("monthly_income")}
          error={shouldShowError("monthly_income")}
        />
        <Input label="Teléfono empresa *" type="tel" value={formData.work_phone} onChange={(e) => updateField("work_phone", e.target.value)} onBlur={() => touchField("work_phone")} error={shouldShowError("work_phone")} />
        <Input label="Dirección de la empresa *" className="md:col-span-2" value={formData.employer_address} onChange={(e) => updateField("employer_address", e.target.value)} onBlur={() => touchField("employer_address")} error={shouldShowError("employer_address")} />
        <Select
          label="Provincia empresa *"
          value={formData.employer_province}
          onChange={(e) => updateField("employer_province", e.target.value)}
          onBlur={() => touchField("employer_province")}
          error={shouldShowError("employer_province")}
          options={provinceOptions}
        />
        <Select
          label="Municipio empresa *"
          value={formData.employer_city}
          onChange={(e) => updateField("employer_city", e.target.value)}
          onBlur={() => touchField("employer_city")}
          error={shouldShowError("employer_city")}
          options={employerMunicipalityOptions}
          disabled={!selectedEmployerProvince}
        />
        <Select
          label="Tipo de contrato *"
          value={formData.contract_type}
          onChange={(e) => updateField("contract_type", e.target.value)}
          onBlur={() => touchField("contract_type")}
          error={shouldShowError("contract_type")}
          disabled={catalogsLoading || !catalogs}
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
                  value={row.concept}
                  onChange={(e) => updateOtherIncomeRow(row.id, { concept: e.target.value })}
                  onBlur={() => touchField(`other_income_${row.id}_concept`)}
                  error={shouldShowError(`other_income_${row.id}_concept`)}
                  disabled={catalogsLoading || !catalogs}
                  options={(catalogs?.incomeConcepts ?? ["Otro"]).map((c) => ({ value: c, label: c }))}
                />
                <Input
                  label="Monto *"
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(e) => updateOtherIncomeRow(row.id, { amount: cleanDecimalInput(e.target.value) })}
                  onBlur={() => touchField(`other_income_${row.id}_amount`)}
                  error={shouldShowError(`other_income_${row.id}_amount`)}
                />
                <Select
                  label="Frecuencia *"
                  value={row.frequency}
                  onChange={(e) => updateOtherIncomeRow(row.id, { frequency: e.target.value as Frequency })}
                  onBlur={() => touchField(`other_income_${row.id}_frequency`)}
                  error={shouldShowError(`other_income_${row.id}_frequency`)}
                  disabled={catalogsLoading || !catalogs}
                  options={(catalogs?.paymentFrequencies ?? ["MENSUAL"]).map((f) => ({ value: f, label: f }))}
                />
                {row.frequency === "VARIABLE" ? (
                  <Input
                    label="Promedio últimos 6 meses *"
                    inputMode="decimal"
                    value={row.variable_avg_6_months ?? ""}
                    onChange={(e) => updateOtherIncomeRow(row.id, { variable_avg_6_months: cleanDecimalInput(e.target.value) })}
                    onBlur={() => touchField(`other_income_${row.id}_variable_avg`)}
                    error={shouldShowError(`other_income_${row.id}_variable_avg`)}
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
        <span className="font-semibold tabular-nums">{formatForgeCurrency(totalIncomeDisplay, tenantConfig.locale, tenantConfig.currency_code)}</span>
      </div>
    </div>
  );
}
