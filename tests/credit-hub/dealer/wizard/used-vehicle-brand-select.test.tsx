import { render, screen } from "@testing-library/react";
import type { ChangeEventHandler } from "react";
import { DealerWizardVehicleFinancialStep } from "@/components/forge/credit-hub/dealer/DealerWizardVehicleFinancialStep";

const updateField = jest.fn();
const patchForm = jest.fn();
const getFieldError = jest.fn();

jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "", variable: "" }),
  JetBrains_Mono: () => ({ className: "", variable: "" }),
  Source_Serif_4: () => ({ className: "", variable: "" }),
}));

jest.mock("@/components/forge", () => ({
  Input: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange?: ChangeEventHandler<HTMLInputElement>;
  }) => (
    <label>
      {label}
      <input value={value ?? ""} onChange={onChange} />
    </label>
  ),
  Select: ({
    label,
    value,
    onChange,
    disabled,
    options,
  }: {
    label: string;
    value?: string;
    onChange?: ChangeEventHandler<HTMLSelectElement>;
    disabled?: boolean;
    options: { value: string; label: string }[];
  }) => (
    <label>
      {label}
      <select value={value ?? ""} onChange={onChange} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

jest.mock("@/lib/credit-hub/hooks/useCatalogs", () => ({
  useCatalogs: () => ({
    catalogs: {
      vehicleBrands: Array.from({ length: 24 }, (_, index) => `Marca ${index + 1}`),
      banks: [],
      contractTypes: [],
      incomeConcepts: [],
      paymentFrequencies: [],
      relationshipTypes: [],
    },
    loading: true,
  }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: {
      country_code: "DO",
      locale: "es-DO",
      currency_code: "DOP",
      product_types: ["Vehículo usado"],
      ltv_max: 0.9,
      max_debt_ratio: 0.4,
    },
  }),
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    common: { select_placeholder: "Selecciona" },
    wizard: {
      sections: { financial_title: "Financiamiento", financial_sub: "Datos del vehículo" },
      vehicle_section: "Vehículo",
      amount_finance: "Monto a financiar",
      ltv_label: "LTV",
      ltv_exceeds: "Excede",
      estimated_capacity: "Capacidad estimada",
    },
  }),
}));

jest.mock("@/components/credit-hub/dealer/wizard/PreApprovalBadge", () => ({
  PreApprovalBadge: () => <div data-testid="preapproval-badge" />,
}));

jest.mock("@/components/credit-hub/dealer/wizard/LtvAlertBanner", () => ({
  LtvAlertBanner: () => <div data-testid="ltv-alert" />,
}));

jest.mock("@/components/credit-hub/dealer/wizard/WizardSegmentPanel", () => ({
  WizardSegmentPanel: () => <div data-testid="wizard-segment-panel" />,
}));

jest.mock("@/components/credit-hub/dealer/wizard/VehicleDeclarationSection", () => ({
  VehicleDeclarationSection: () => <div data-testid="vehicle-declaration" />,
}));

jest.mock("@/components/forge/credit-hub/dealer/DealerWizardProvider", () => ({
  cleanDecimalInput: (value: string) => value,
  useDealerWizard: () => ({
    formData: {
      desired_term: "48 meses",
      down_payment: "100000",
      monthly_debts: "0",
      estimated_monthly_expenses: "",
      has_bank_account: "no",
      bank_institution: "",
      product_type: "Vehículo usado",
      vehicle_make: "",
      vehicle_brand_other: "",
      vehicle_model: "",
      vehicle_version: "",
      vehicle_year: "",
      vehicle_color: "",
      vehicle_price: "1000000",
      vehicle_condition: "used",
      vehicle_mileage: "",
      dealer_supplier: "",
      monthly_income: "100000",
      has_other_income: "no",
      other_incomes: [],
    },
    updateField,
    patchForm,
    getFieldError,
  }),
}));

describe("dealer wizard vehicle step - used vehicle brand", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps Marca enabled when vehicle brands are loaded even if the catalog loading flag is still true", () => {
    render(<DealerWizardVehicleFinancialStep />);

    const brandSelect = screen.getByLabelText("Marca *");
    expect(brandSelect).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "Marca 24" })).toBeInTheDocument();
  });
});
