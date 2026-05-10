"use client";

import { useMemo } from "react";
import { PreApprovalBadge } from "@/components/credit-hub/dealer/wizard/PreApprovalBadge";
import { Input, Select } from "@/components/forge";
import {
  calculateAmountToFinance,
  calculateLTV,
  calculateWizardEstimatedCapacity,
} from "@/lib/credit/utils/financial-calculator";
import { calculateTotalMonthlyIncome, type Frequency } from "@/lib/credit/utils/income-normalizer";
import { preapprovalParamsFromTenantFractions, simulatePreApproval } from "@/lib/credit/simulation/preapproval-base";
import { useCatalogs } from "@/lib/credit-hub/hooks/useCatalogs";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { formatForgeCurrency } from "@/utils/forge-locale";
import { cleanDecimalInput, useDealerWizard } from "./DealerWizardProvider";

function numeric(value: string | number | null | undefined): number {
  const parsed = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function otherIncomesToParts(formData: { other_incomes: { amount: string; frequency: string; variable_avg_6_months?: string }[] }) {
  return (formData.other_incomes ?? []).map((row) => ({
    amount: numeric(row.amount),
    frequency: row.frequency as Frequency,
    variable_avg_6_months: row.variable_avg_6_months ? numeric(row.variable_avg_6_months) : undefined,
  }));
}

export function DealerWizardVehicleFinancialStep() {
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const { catalogs, loading: catalogsLoading } = useCatalogs();
  const { formData, updateField } = useDealerWizard();

  const otherMonthlyStep = formData.has_other_income === "yes" ? calculateTotalMonthlyIncome(0, otherIncomesToParts(formData)) : 0;
  const amountToFinance = calculateAmountToFinance(numeric(formData.vehicle_price), numeric(formData.down_payment));
  const estimatedCapacity = calculateWizardEstimatedCapacity(
    numeric(formData.monthly_income),
    otherMonthlyStep,
    numeric(formData.monthly_debts),
    0.4
  );
  const ltvPercent = calculateLTV(amountToFinance, numeric(formData.vehicle_price));

  const preApproval = useMemo(() => {
    const baseIncome = numeric(formData.monthly_income);
    const monthlyIncomeTotal = baseIncome + otherMonthlyStep;
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
  }, [formData, otherMonthlyStep, tenantConfig]);

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 32 }, (_, index) => {
        const year = new Date().getFullYear() + 1 - index;
        return { value: String(year), label: String(year) };
      }),
    []
  );

  const productTypeOptions = useMemo(() => {
    const pts = tenantConfig.product_types;
    const base = pts.map((item) => ({ value: item, label: item }));
    if (formData.product_type && !pts.includes(formData.product_type)) {
      return [{ value: formData.product_type, label: formData.product_type }, ...base];
    }
    return base;
  }, [tenantConfig.product_types, formData.product_type]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">{t.wizard.sections.financial_title}</h2>
        <p className="mt-1 text-forge-sm text-forgeGray-500">{t.wizard.sections.financial_sub}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Plazo deseado *" placeholder="Ej: 48 meses" value={formData.desired_term} onChange={(e) => updateField("desired_term", e.target.value)} />
        <Input
          label="Cuota inicial disponible *"
          inputMode="decimal"
          value={formData.down_payment}
          onChange={(e) => updateField("down_payment", cleanDecimalInput(e.target.value))}
        />
        <Input
          label="Deudas mensuales actuales *"
          inputMode="decimal"
          value={formData.monthly_debts}
          onChange={(e) => updateField("monthly_debts", cleanDecimalInput(e.target.value))}
        />
        <Input
          label="Gasto mensual estimado (opcional)"
          inputMode="decimal"
          value={formData.estimated_monthly_expenses}
          onChange={(e) => updateField("estimated_monthly_expenses", cleanDecimalInput(e.target.value))}
        />
        <Select
          label="¿Tiene cuenta bancaria activa? *"
          value={formData.has_bank_account}
          onChange={(e) => updateField("has_bank_account", e.target.value as "yes" | "no")}
          options={[
            { value: "yes", label: "Sí" },
            { value: "no", label: "No" },
          ]}
        />
        {formData.has_bank_account === "yes" ? (
          <Select
            label="Institución bancaria (opcional)"
            value={formData.bank_institution}
            onChange={(e) => updateField("bank_institution", e.target.value)}
            disabled={catalogsLoading || !catalogs}
            options={[{ value: "", label: t.common.select_placeholder }, ...(catalogs?.banks ?? []).map((b) => ({ value: b, label: b }))]}
          />
        ) : null}
        <div className="md:col-span-2 border-t border-forgeGray-200 pt-4">
          <h3 className="font-semibold text-forgeGray-800">{t.wizard.vehicle_section}</h3>
        </div>
        <Select
          label="Tipo de producto *"
          value={formData.product_type}
          onChange={(e) => updateField("product_type", e.target.value)}
          options={productTypeOptions}
        />
        <Select
          label="Marca *"
          value={formData.vehicle_make}
          onChange={(e) => updateField("vehicle_make", e.target.value)}
          disabled={catalogsLoading || !catalogs}
          options={[
            { value: "", label: t.common.select_placeholder },
            ...((catalogs?.vehicleBrands ?? []) as string[]).map((brand) => ({ value: brand, label: brand })),
          ]}
        />
        {formData.vehicle_make === "Otros" ? (
          <Input label="Especifique marca *" value={formData.vehicle_brand_other} onChange={(e) => updateField("vehicle_brand_other", e.target.value)} />
        ) : null}
        <Input label="Modelo *" value={formData.vehicle_model} onChange={(e) => updateField("vehicle_model", e.target.value)} />
        <Input label="Sub-modelo / versión (opcional)" value={formData.vehicle_version} onChange={(e) => updateField("vehicle_version", e.target.value)} />
        <Select
          label="Año *"
          value={formData.vehicle_year}
          onChange={(e) => updateField("vehicle_year", e.target.value)}
          options={[{ value: "", label: t.common.select_placeholder }, ...yearOptions]}
        />
        <Input label="Color (opcional)" value={formData.vehicle_color} onChange={(e) => updateField("vehicle_color", e.target.value)} />
        <Input
          label="Precio de venta *"
          inputMode="decimal"
          value={formData.vehicle_price}
          onChange={(e) => updateField("vehicle_price", cleanDecimalInput(e.target.value))}
        />
        <Select
          label="Condición *"
          value={formData.vehicle_condition}
          onChange={(e) => updateField("vehicle_condition", e.target.value)}
          options={[
            { value: "new", label: "Nuevo" },
            { value: "used", label: "Usado" },
          ]}
        />
        {formData.vehicle_condition === "used" ? (
          <Input
            label="Kilometraje actual"
            inputMode="numeric"
            value={formData.vehicle_mileage}
            onChange={(e) => updateField("vehicle_mileage", e.target.value)}
          />
        ) : null}
        <Input label="Dealer / Suplidor *" value={formData.dealer_supplier} onChange={(e) => updateField("dealer_supplier", e.target.value)} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-forge-md bg-forgeSurface-sunken p-3">
          <p className="text-forge-xs text-forgeGray-500">{t.wizard.amount_finance}</p>
          <p className="font-semibold tabular-nums text-forgeGray-800">{formatForgeCurrency(amountToFinance, tenantConfig.locale, tenantConfig.currency_code)}</p>
        </div>
        <div className="rounded-forge-md bg-forgeSurface-sunken p-3">
          <p className="text-forge-xs text-forgeGray-500">{t.wizard.ltv_label}</p>
          <p className="font-semibold tabular-nums text-forgeGray-800">{Math.round(ltvPercent)}%</p>
          {ltvPercent / 100 > tenantConfig.ltv_max ? (
            <p className="text-forge-xs text-forgeDanger-600">{t.wizard.ltv_exceeds}</p>
          ) : null}
        </div>
        <div className="rounded-forge-md bg-forgeSurface-sunken p-3">
          <p className="text-forge-xs text-forgeGray-500">{t.wizard.estimated_capacity}</p>
          <p className="font-semibold tabular-nums text-forgeGray-800">
            {formatForgeCurrency(estimatedCapacity, tenantConfig.locale, tenantConfig.currency_code)}
          </p>
        </div>
      </div>
      {preApproval ? <PreApprovalBadge result={preApproval} /> : null}
    </div>
  );
}
