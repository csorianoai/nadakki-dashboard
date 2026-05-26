"use client";

import { useCallback, useMemo } from "react";
import {
  documentTypeSelectOptions,
  getGaranteInlineErrors,
} from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { Input, Select, DateInput } from "@/components/forge";
import { formatDominicanCedula, cleanDominicanCedula } from "@/lib/credit/formatters/dominican-id";
import { calculateAge, parseDateInput } from "@/lib/credit/utils/age";
import { calculateEmploymentTenure } from "@/lib/credit/utils/employment-tenure";
import { calculateAmountToFinance, calculatePMT } from "@/lib/credit/utils/financial-calculator";
import { DO_RELATIONSHIP_TYPES } from "@/lib/credit/catalogs/do/employment-types";
import { useAdministrativeDivisions } from "@/lib/credit/catalogs/useAdministrativeDivisions";
import { useCatalogs } from "@/lib/credit-hub/hooks/useCatalogs";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { formatForgeCurrency } from "@/utils/forge-locale";
import { cleanDecimalInput, useDealerWizard } from "./DealerWizardProvider";

function numeric(value: string | number | null | undefined): number {
  const parsed = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function DealerWizardCoBorrowerStep() {
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const { catalogs } = useCatalogs();
  const administrativeDivisions = useAdministrativeDivisions(tenantConfig.country_code);
  const { formData, updateField, validationConfig, showValidationErrors, touchedFields, touchField, fieldErrors } = useDealerWizard();

  const shouldShowError = useCallback(
    (name: string): string | undefined => {
      if ((showValidationErrors || touchedFields.has(name)) && fieldErrors[name]) {
        return fieldErrors[name];
      }
      return undefined;
    },
    [showValidationErrors, touchedFields, fieldErrors]
  );

  const defaultDocType = tenantConfig.document_types.primary_id ?? "CEDULA";
  const coDoc = formData.co_debtor_document_type || defaultDocType;
  const coBirthDate = parseDateInput(formData.co_debtor_date_of_birth);
  const coAge = coBirthDate ? calculateAge(coBirthDate) : null;
  const garanteErrors = getGaranteInlineErrors(formData, validationConfig, t.validation);
  const coEmploymentTenure = formData.co_debtor_employment_start_date
    ? calculateEmploymentTenure(formData.co_debtor_employment_start_date)
    : null;

  const selectedCoDebtorProvince = administrativeDivisions.find((item) => item.name === formData.co_debtor_province);

  const provinceOptions = useMemo(
    () => [
      { value: "", label: t.common.select_placeholder },
      ...administrativeDivisions.map((item) => ({ value: item.name, label: item.name })),
    ],
    [administrativeDivisions, t.common.select_placeholder]
  );

  const coMunicipalityOptions = useMemo(
    () => [
      { value: "", label: t.common.select_placeholder },
      ...(selectedCoDebtorProvince?.municipalities ?? []).map((m) => ({ value: m, label: m })),
    ],
    [selectedCoDebtorProvince?.municipalities, t.common.select_placeholder]
  );

  const docTypeSelect = useMemo(
    () =>
      documentTypeSelectOptions(tenantConfig).map(([value, label]) => ({
        value,
        label,
      })),
    [tenantConfig]
  );

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
        garanteIncomeWarning = `Ingreso del garante por debajo del mínimo recomendado (${formatForgeCurrency(minReq, tenantConfig.locale, tenantConfig.currency_code)})`;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.garante_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">{t.wizard.sections.garante_sub}</p>
      </div>
      {tenantConfig.features_enabled.garante_required ? (
        <div className="rounded-forge-md border border-forgeBrand-500/40 bg-forgeBrand-500/10 p-3 text-forge-sm text-forgeGray-800">
          {t.wizard.garante_auto_required}
        </div>
      ) : null}
      {!tenantConfig.features_enabled.garante_required ? (
        <Select
          label="¿La solicitud incluye garante o cofirmante? *"
          value={formData.co_debtor_required}
          onChange={(e) => updateField("co_debtor_required", e.target.value as "yes" | "no")}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Sí" },
          ]}
        />
      ) : null}
      {tenantConfig.features_enabled.garante_required || formData.co_debtor_required === "yes" ? (
        <div className="grid gap-4 border-l-2 border-forgeBrand-500/40 pl-4 md:grid-cols-2 md:pl-6">
          <div className="md:col-span-2 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4">
            <h3 className="font-semibold text-forgeGray-800">{t.wizard.garante_data_title}</h3>
          </div>
          <Select label="Tipo de documento garante *" value={coDoc} onChange={(e) => updateField("co_debtor_document_type", e.target.value)} options={docTypeSelect} />
          {coDoc === "OTRO" ? (
            <Input
              label="Especifique tipo *"
              value={formData.co_debtor_document_other_type}
              onChange={(e) => updateField("co_debtor_document_other_type", e.target.value)}
            />
          ) : null}
          <div className="space-y-1 md:col-span-2">
            <Input
              label="Número de documento garante *"
              aria-label="Número de documento garante"
              value={coDoc === "CEDULA" ? formatDominicanCedula(formData.co_debtor_identification) : formData.co_debtor_identification}
              onChange={(e) =>
                updateField("co_debtor_identification", coDoc === "CEDULA" ? cleanDominicanCedula(e.target.value) : e.target.value.toUpperCase())
              }
              onBlur={() => touchField("co_debtor_identification")}
              error={garanteErrors.co_debtor_identification ?? shouldShowError("co_debtor_identification")}
            />
          </div>
          <Input label="Nombre completo garante *" value={formData.co_debtor_full_name} onChange={(e) => updateField("co_debtor_full_name", e.target.value)} onBlur={() => touchField("co_debtor_full_name")} error={shouldShowError("co_debtor_full_name")} />
          <div className="space-y-1">
            <DateInput
              label="Fecha de nacimiento garante *"
              locale={tenantConfig.locale}
              value={formData.co_debtor_date_of_birth}
              onValueChange={(iso) => updateField("co_debtor_date_of_birth", iso)}
              onBlur={() => touchField("co_debtor_date_of_birth")}
              error={garanteErrors.co_debtor_date_of_birth ?? shouldShowError("co_debtor_date_of_birth")}
            />
          </div>
          <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-3">
            <p className="text-forge-xs text-forgeGray-500">{t.wizard.age_guarantor}</p>
            <p className="font-semibold text-forgeGray-800">{coAge === null ? t.common.no_data : t.wizard.years_suffix(coAge)}</p>
          </div>
          <Input label="Teléfono garante *" type="tel" value={formData.co_debtor_phone} onChange={(e) => updateField("co_debtor_phone", e.target.value)} onBlur={() => touchField("co_debtor_phone")} error={shouldShowError("co_debtor_phone")} />
          <Input label="Correo electrónico garante *" type="email" value={formData.co_debtor_email} onChange={(e) => updateField("co_debtor_email", e.target.value)} onBlur={() => touchField("co_debtor_email")} error={shouldShowError("co_debtor_email")} />
          <Input label="Dirección garante *" className="md:col-span-2" value={formData.co_debtor_address} onChange={(e) => updateField("co_debtor_address", e.target.value)} onBlur={() => touchField("co_debtor_address")} error={shouldShowError("co_debtor_address")} />
          <Select
            label="Provincia garante *"
            value={formData.co_debtor_province}
            onChange={(e) => updateField("co_debtor_province", e.target.value)}
            onBlur={() => touchField("co_debtor_province")}
            error={shouldShowError("co_debtor_province")}
            options={provinceOptions}
          />
          <Select
            label="Municipio garante *"
            value={formData.co_debtor_city}
            onChange={(e) => updateField("co_debtor_city", e.target.value)}
            onBlur={() => touchField("co_debtor_city")}
            error={shouldShowError("co_debtor_city")}
            options={coMunicipalityOptions}
            disabled={!selectedCoDebtorProvince}
          />
          <div className="space-y-1">
            <Input
              label="Ingreso mensual garante *"
              inputMode="decimal"
              value={formData.co_debtor_monthly_income}
              onChange={(e) => updateField("co_debtor_monthly_income", cleanDecimalInput(e.target.value))}
              onBlur={() => touchField("co_debtor_monthly_income")}
              error={garanteErrors.co_debtor_monthly_income ?? shouldShowError("co_debtor_monthly_income")}
            />
            {garanteIncomeWarning ? <p className="text-forge-xs text-forgeWarning-700">{garanteIncomeWarning}</p> : null}
          </div>
          <Input label="Empresa donde labora garante *" value={formData.co_debtor_employer_name} onChange={(e) => updateField("co_debtor_employer_name", e.target.value)} onBlur={() => touchField("co_debtor_employer_name")} error={shouldShowError("co_debtor_employer_name")} />
          <Input
            label="Ocupación / tipo laboral del cofirmante"
            value={formData.co_debtor_employment}
            onChange={(e) => updateField("co_debtor_employment", e.target.value)}
            className="md:col-span-2"
          />
          <div className="space-y-1 md:col-span-2">
            <DateInput
              label="Fecha de ingreso al empleo garante *"
              locale={tenantConfig.locale}
              value={formData.co_debtor_employment_start_date}
              onValueChange={(iso) => updateField("co_debtor_employment_start_date", iso)}
              onBlur={() => touchField("co_debtor_employment_start_date")}
              error={shouldShowError("co_debtor_employment_start_date")}
            />
            {coEmploymentTenure?.isValid ? (
              <p className="text-forge-sm text-forgeGray-500">Antigüedad: {coEmploymentTenure.display}</p>
            ) : null}
          </div>
          <Select
            label="Relación con solicitante *"
            value={formData.co_debtor_relationship}
            onChange={(e) => updateField("co_debtor_relationship", e.target.value)}
            onBlur={() => touchField("co_debtor_relationship")}
            error={shouldShowError("co_debtor_relationship")}
            options={[
              { value: "", label: t.common.select_placeholder },
              ...(catalogs?.relationshipTypes ?? [...DO_RELATIONSHIP_TYPES]).map((r) => ({ value: r, label: r })),
            ]}
          />
          {formData.co_debtor_relationship === "Otro" ? (
            <div className="space-y-1 md:col-span-2">
              <Input
                label="Especifique relación *"
                value={formData.co_debtor_relationship_other}
                onChange={(e) => updateField("co_debtor_relationship_other", e.target.value)}
                onBlur={() => touchField("co_debtor_relationship_other")}
                error={garanteErrors.co_debtor_relationship_other ?? shouldShowError("co_debtor_relationship_other")}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
