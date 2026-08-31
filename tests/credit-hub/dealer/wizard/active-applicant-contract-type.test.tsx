import { render, screen } from "@testing-library/react";
import type { ChangeEventHandler } from "react";
import { DealerWizardApplicantEmploymentStep } from "@/components/forge/credit-hub/dealer/DealerWizardApplicantEmploymentStep";

jest.mock("@/components/forge", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Checkbox: ({ label, checked, onChange }: { label: string; checked?: boolean; onChange?: ChangeEventHandler<HTMLInputElement> }) => (
    <label>
      {label}
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  ),
  DateInput: ({ label, value, onValueChange }: { label: string; value?: string; onValueChange?: (value: string) => void }) => (
    <label>
      {label}
      <input value={value ?? ""} onChange={(event) => onValueChange?.(event.target.value)} />
    </label>
  ),
  Input: ({ label, value, onChange }: { label: string; value?: string; onChange?: ChangeEventHandler<HTMLInputElement> }) => (
    <label>
      {label}
      <input value={value ?? ""} onChange={onChange} />
    </label>
  ),
  Select: ({ label, value, onChange, disabled, options }: { label: string; value?: string; onChange?: ChangeEventHandler<HTMLSelectElement>; disabled?: boolean; options: { value: string; label: string }[] }) => (
    <label>
      {label}
      <select value={value ?? ""} onChange={onChange} disabled={disabled}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  ),
}));

jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "", variable: "" }),
  JetBrains_Mono: () => ({ className: "", variable: "" }),
  Source_Serif_4: () => ({ className: "", variable: "" }),
}));

jest.mock("@/components/credit-hub/dealer/wizard/WizardContainer", () => ({
  documentTypeSelectOptions: () => [["CEDULA", "Cédula"]],
  stepIsValid: () => false,
}));

jest.mock("@/lib/credit-hub/hooks/useCatalogs", () => ({
  useCatalogs: () => ({
    catalogs: {
      vehicleBrands: [],
      banks: [],
      contractTypes: ["Indefinido", "Temporal"],
      incomeConcepts: ["Salario adicional"],
      paymentFrequencies: ["MENSUAL"],
      relationshipTypes: [],
    },
    // Reproduces the stale global loading flag with the needed catalog ready.
    loading: true,
  }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: {
      country_code: "DO",
      locale: "es-DO",
      document_types: { primary_id: "CEDULA" },
      min_age: 18,
      max_age: 100,
    },
  }),
}));

jest.mock("@/lib/credit/catalogs/useAdministrativeDivisions", () => ({
  useAdministrativeDivisions: () => [{ name: "Distrito Nacional", municipalities: ["Santo Domingo"] }],
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    common: { no_data: "Sin datos", select_placeholder: "Selecciona" },
    validation: {
      age_invalid: "Edad inválida",
      age_min: () => "Edad mínima",
      age_over_max: "Edad máxima",
      invalid_cedula: "Cédula inválida",
      invalid_passport: "Pasaporte inválido",
    },
    wizard: {
      calculated_age: "Edad calculada",
      calculated_tenure: "Antigüedad calculada",
      years_suffix: (age: number) => `${age} años`,
      sections: {
        applicant_title: "Solicitante",
        applicant_sub: "Datos del solicitante",
        employment_title: "Empleo",
        employment_sub: "Datos laborales",
      },
    },
  }),
}));

jest.mock("@/components/forge/credit-hub/dealer/DealerWizardProvider", () => ({
  cleanDecimalInput: (value: string) => value,
  useDealerWizard: () => ({
    formData: {
      applicant_full_name: "",
      applicant_document_type: "CEDULA",
      applicant_document_other_type: "",
      applicant_identification: "",
      applicant_date_of_birth: "",
      applicant_marital_status: "",
      applicant_phone: "",
      applicant_email: "",
      applicant_country: "República Dominicana",
      applicant_address: "",
      applicant_city: "",
      applicant_province: "",
      employment_type: "",
      employer_name: "",
      employment_position: "",
      employment_start_date: "",
      monthly_income: "",
      work_phone: "",
      employer_address: "",
      employer_province: "",
      employer_city: "",
      contract_type: "",
      has_other_income: "yes",
      other_incomes: [
        {
          id: "other-income-1",
          concept: "",
          amount: "",
          frequency: "MENSUAL",
          variable_avg_6_months: "",
          is_documented: false,
        },
      ],
    },
    updateField: jest.fn(),
    updateOtherIncomeRow: jest.fn(),
    addOtherIncomeRow: jest.fn(),
    removeOtherIncomeRow: jest.fn(),
    setHasOtherIncome: jest.fn(),
    validationConfig: {},
    getFieldError: jest.fn(),
  }),
}));

describe("active applicant step — contract type", () => {
  test("enables contract type for an empty draft once its catalog is populated", () => {
    render(<DealerWizardApplicantEmploymentStep />);

    const select = screen.getByLabelText("Tipo de contrato *");
    expect(select).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "Indefinido" })).toBeInTheDocument();
  });

  test("enables other income concept once its catalog is populated", () => {
    render(<DealerWizardApplicantEmploymentStep />);

    const select = screen.getByLabelText("Concepto *");
    expect(select).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "Salario adicional" })).toBeInTheDocument();
  });

  test("enables other income frequency once its catalog is populated", () => {
    render(<DealerWizardApplicantEmploymentStep />);

    const select = screen.getByLabelText("Frecuencia *");
    expect(select).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "MENSUAL" })).toBeInTheDocument();
  });
});
