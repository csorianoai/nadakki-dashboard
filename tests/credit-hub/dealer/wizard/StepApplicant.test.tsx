import { render, screen } from "@testing-library/react";
import { StepApplicant } from "@/components/credit-hub/dealer/wizard/StepApplicant";

const mockUseDealerWizard = jest.fn();

jest.mock("@/components/forge", () => {
  const React = require("react");
  const Select = ({ label, options, ...props }: any) => (
    <label>
      {label}
      <select aria-label={label} {...props}>
        {options.map((option: any) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
  const Input = ({ label, ...props }: any) => <label>{label}<input aria-label={label} {...props} /></label>;
  const Button = (props: any) => <button {...props} />;
  const Checkbox = ({ label, ...props }: any) => <label>{label}<input type="checkbox" aria-label={label} {...props} /></label>;
  const DateInput = Input;
  return { Button, Checkbox, DateInput, Input, Select };
});

jest.mock("@/components/credit-hub/dealer/wizard/WizardContainer", () => ({
  documentTypeSelectOptions: () => [["CEDULA", "Cédula"]],
  stepIsValid: () => false,
}));

jest.mock("@/components/forge/credit-hub/dealer/DealerWizardProvider", () => ({
  useDealerWizard: () => mockUseDealerWizard(),
}));

jest.mock("@/lib/credit-hub/hooks/useCatalogs", () => ({
  useCatalogs: () => ({
    catalogs: {
      contractTypes: ["Indefinido", "Temporal", "Por proyecto", "Independiente", "Otro", "Prácticas"],
      incomeConcepts: ["Otro"],
      paymentFrequencies: ["MENSUAL"],
    },
    loading: false,
  }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: {
      country_code: "DO",
      document_types: { primary_id: "CEDULA" },
      min_age: 18,
      max_age: 100,
      features_enabled: { garante_required: false },
    },
  }),
}));

jest.mock("@/lib/credit/catalogs/useAdministrativeDivisions", () => ({
  useAdministrativeDivisions: () => [],
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    common: { select_placeholder: "Selecciona", no_data: "Sin datos" },
    wizard: {
      sections: { applicant_title: "Solicitante", applicant_sub: "", employment_title: "Empleo", employment_sub: "" },
      calculated_age: "Edad",
      years_suffix: (age: number) => `${age} años`,
      calculated_tenure: "Antigüedad",
    },
    validation: {
      invalid_cedula: "Cédula inválida",
      invalid_passport: "Pasaporte inválido",
      age_invalid: "Edad inválida",
      age_min: (age: number) => `Mínimo ${age}`,
      age_over_max: "Edad máxima",
    },
  }),
}));

describe("StepApplicant", () => {
  beforeEach(() => {
    mockUseDealerWizard.mockReturnValue({
      formData: {
        applicant_document_type: "CEDULA",
        applicant_document_other_type: "",
        applicant_identification: "",
        applicant_date_of_birth: "",
        applicant_full_name: "",
        applicant_marital_status: "",
        applicant_phone: "",
        applicant_email: "",
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
      },
      updateField: jest.fn(),
      updateOtherIncomeRow: jest.fn(),
      addOtherIncomeRow: jest.fn(),
      removeOtherIncomeRow: jest.fn(),
      setHasOtherIncome: jest.fn(),
      validationConfig: {
        min_age: 18,
        max_age: 100,
        garante_required: false,
        default_document_type: "CEDULA",
        required_documents: [],
        consent_application_id_ready: false,
      },
      getFieldError: jest.fn(),
    });
  });

  test("enables contract type in the rendered applicant step", () => {
    render(<StepApplicant />);

    const select = screen.getByLabelText("Tipo de contrato *");
    expect(select).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "Prácticas" })).toBeInTheDocument();
  });
});
