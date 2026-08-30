import { render, screen } from "@testing-library/react";
import { DealerWizardApplicantEmploymentStep } from "@/components/forge/credit-hub/dealer/DealerWizardApplicantEmploymentStep";

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
      incomeConcepts: [],
      paymentFrequencies: [],
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
      has_other_income: "no",
      other_incomes: [],
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
});
