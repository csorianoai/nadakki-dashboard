import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WizardContainer, buildCreateApplicationPayload, type ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { useCreateCreditApplication } from "@/lib/credit-hub/hooks/useCreateCreditApplication";
import { getDefaultTenantBankingConfig, useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

const push = jest.fn();
const back = jest.fn();
const mutateAsync = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/credit-hub/hooks/useCreateCreditApplication", () => ({
  useCreateCreditApplication: jest.fn(),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => {
  const actual = jest.requireActual<typeof import("@/lib/credit-hub/hooks/useTenantConfig")>("@/lib/credit-hub/hooks/useTenantConfig");
  return {
    ...actual,
    useTenantConfig: jest.fn(() => ({ tenantConfig: actual.getDefaultTenantBankingConfig("wizard-test-tenant"), loading: false })),
  };
});

jest.mock("@/lib/credit-hub/hooks/useCatalogs", () => {
  const { DO_VEHICLE_BRANDS } = require("@/lib/credit/catalogs/do/vehicle-brands");
  const { DO_BANKS } = require("@/lib/credit/catalogs/do/banks");
  const {
    DO_CONTRACT_TYPES,
    DO_INCOME_CONCEPTS,
    DO_PAYMENT_FREQUENCIES,
    DO_RELATIONSHIP_TYPES,
  } = require("@/lib/credit/catalogs/do/employment-types");
  return {
    useCatalogs: () => ({
      catalogs: {
        vehicleBrands: DO_VEHICLE_BRANDS,
        banks: DO_BANKS,
        contractTypes: DO_CONTRACT_TYPES,
        incomeConcepts: DO_INCOME_CONCEPTS,
        paymentFrequencies: DO_PAYMENT_FREQUENCIES,
        relationshipTypes: DO_RELATIONSHIP_TYPES,
      },
      loading: false,
    }),
  };
});

jest.mock("@/components/credit-hub/system/ForgeToaster", () => ({
  forgeToast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/credit-hub/utils/celebrate", () => ({
  celebrateSuccessRespectReduced: jest.fn(),
}));

const mockUseCreateApplication = useCreateCreditApplication as jest.Mock;
const mockUseTenantConfig = useTenantConfig as unknown as jest.Mock;

const fullData: ApplicationFormData = {
  applicant_full_name: "Ana Pérez",
  applicant_identification: "05300030532",
  applicant_document_type: "CEDULA",
  applicant_document_other_type: "",
  applicant_date_of_birth: "1990-01-01",
  applicant_age: "",
  applicant_marital_status: "single",
  applicant_email: "ana@example.com",
  applicant_phone: "8095550000",
  applicant_address: "Calle 1",
  applicant_city: "Santo Domingo de Guzmán",
  applicant_province: "Distrito Nacional",
  applicant_country: "República Dominicana",
  employment_type: "employee",
  employer_name: "Credicefi",
  employment_position: "Analista",
  employment_start_date: "2020-01-01",
  employer_address: "Av. Winston Churchill",
  employer_province: "Distrito Nacional",
  employer_city: "Santo Domingo de Guzmán",
  contract_type: "indefinido",
  monthly_income: "85000",
  has_other_income: "no",
  other_incomes: [],
  work_phone: "8095551111",
  requested_amount: "",
  desired_term: "48 meses",
  down_payment: "100000",
  monthly_debts: "15000",
  estimated_monthly_expenses: "30000",
  bank_institution: "",
  has_bank_account: "yes",
  has_late_payment_history: "no",
  max_late_payment_days: "",
  product_type: "Vehículo nuevo",
  vehicle_brand_other: "",
  vehicle_version: "",
  vehicle_color: "",
  vehicle_mileage: "",
  vehicle_make: "Toyota",
  vehicle_model: "Hilux",
  vehicle_year: "2024",
  vehicle_price: "1600000",
  dealer_supplier: "Dealer Norte",
  vehicle_condition: "new",
  co_debtor_required: "no",
  co_debtor_document_type: "CEDULA",
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
  documents_received: {
    id_front: true,
    id_back: true,
    employment_letter: true,
    bank_statements: true,
    address_proof: true,
  },
  document_files_ready: { id_front: true },
  document_notes: {},
  additional_document_items: [],
  personal_references: [
    { id: "r1", nombre_completo: "Juan Pérez", direccion: "Calle 1, SD", telefono: "8095551234" },
    { id: "r2", nombre_completo: "María López", direccion: "Av. 2, SD", telefono: "8095555678" },
    { id: "r3", nombre_completo: "Pedro Ruiz", direccion: "Calle 3, SD", telefono: "8095559012" },
  ],
  consent_presence: "present",
  consent_bureau_authorization: true,
  consent_terms_accepted: true,
  consent_data_processing_authorization: true,
  consent_signature_full_name: "Ana Pérez",
  consent_present_confirmed: true,
  consent_method: "PRESENT",
  consent_audit_hash: "",
  consent_accepted_at: "2020-01-02T00:00:00.000Z",
  consent_sms_otp_sent: false,
  consent_dealer_otp_code: "",
  vehicle_decl_perdida_total: "no",
  vehicle_decl_accidentes: "no",
  vehicle_decl_gravamenes: "no",
  vehicle_decl_titulo_vendedor: "yes",
  vehicle_decl_km_coincide: "yes",
  vehicle_decl_signature_name: "Dealer Test SA",
  vehicle_decl_signed_at: "2020-01-02T00:00:00.000Z",
  vehicle_decl_hash: "test-hash",
};

async function fillVehicleDeclaration() {
  const user = userEvent.setup();
  await screen.findByTestId("vehicle-declaration-section");
  for (const [testId, value] of [
    ["vehicle-decl-perdida_total", "no"],
    ["vehicle-decl-accidentes", "no"],
    ["vehicle-decl-gravamenes", "no"],
    ["vehicle-decl-titulo_vendedor", "yes"],
    ["vehicle-decl-km_coincide", "yes"],
  ] as const) {
    const fieldset = screen.getByTestId(testId);
    const input = fieldset.querySelector(`input[value="${value}"]`) as HTMLInputElement;
    await user.click(input);
  }
  const section = screen.getByTestId("vehicle-declaration-section");
  fireEvent.change(within(section).getByRole("textbox"), { target: { value: "Dealer Test SA" } });
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();
  });
}

function change(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function fillApplicantAndContinue() {
  change("Nombre completo *", fullData.applicant_full_name);
  change(/Número de documento/i, fullData.applicant_identification);
  change("Fecha de nacimiento *", fullData.applicant_date_of_birth);
  change("Estado civil *", fullData.applicant_marital_status);
  change("Teléfono *", fullData.applicant_phone);
  change(/Correo electrónico/i, fullData.applicant_email);
  change("País *", fullData.applicant_country);
  change("Dirección *", fullData.applicant_address);
  change("Provincia *", fullData.applicant_province);
  change("Municipio *", fullData.applicant_city);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Información laboral")).toBeInTheDocument();
}

async function completeRequiredDocuments() {
  for (const label of [/Cédula \(frente\)/i, /Cédula \(reverso\)/i, /Documentos del vehículo/i]) {
    const el = screen.getByLabelText(label) as HTMLInputElement;
    if (!el.checked) fireEvent.click(el);
  }
}

async function advanceToConsents() {
  await fillApplicantAndContinue();
  change("Tipo de empleo *", fullData.employment_type);
  change("Empresa donde trabaja *", fullData.employer_name);
  change("Cargo *", fullData.employment_position);
  change("Fecha de ingreso al empleo *", fullData.employment_start_date);
  change("Ingreso mensual neto *", fullData.monthly_income);
  change("Teléfono empresa *", fullData.work_phone);
  change("Dirección de la empresa *", fullData.employer_address);
  change("Provincia empresa *", fullData.employer_province);
  change("Municipio empresa *", fullData.employer_city);
  change("Tipo de contrato *", fullData.contract_type);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Información financiera y producto")).toBeInTheDocument();

  change("Plazo deseado *", fullData.desired_term);
  change("Cuota inicial disponible *", fullData.down_payment);
  change("Deudas mensuales actuales *", fullData.monthly_debts);
  change(/Gasto mensual estimado/i, fullData.estimated_monthly_expenses);
  change("Tipo de producto *", fullData.product_type);
  change("Marca *", fullData.vehicle_make);
  change("Modelo *", fullData.vehicle_model);
  change("Año *", fullData.vehicle_year);
  change("Precio de venta *", fullData.vehicle_price);
  change("Dealer / Suplidor *", fullData.dealer_supplier);
  change("Condición *", fullData.vehicle_condition);
  await fillVehicleDeclaration();
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Garante o cofirmante")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Documentos recibidos")).toBeInTheDocument();

  await completeRequiredDocuments();
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByRole("heading", { name: "Consentimientos" })).toBeInTheDocument();
}

async function advanceToReview() {
  await advanceToConsents();
  fireEvent.click(screen.getByText(/Autorización Ley 172-13/i));
  fireEvent.click(screen.getByText(/Autorización consulta de buró/i));
  fireEvent.click(screen.getByText(/Política de tratamiento de datos/i));
  fireEvent.change(screen.getByLabelText(/Nombre completo \(firma digital\)/i), { target: { value: "Ana Pérez" } });
  fireEvent.click(screen.getByTestId("present-submit"));
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Revisión final")).toBeInTheDocument();
}

async function navigateToGaranteStep() {
  await fillApplicantAndContinue();
  change("Tipo de empleo *", fullData.employment_type);
  change("Empresa donde trabaja *", fullData.employer_name);
  change("Cargo *", fullData.employment_position);
  change("Fecha de ingreso al empleo *", fullData.employment_start_date);
  change("Ingreso mensual neto *", fullData.monthly_income);
  change("Teléfono empresa *", fullData.work_phone);
  change("Dirección de la empresa *", fullData.employer_address);
  change("Provincia empresa *", fullData.employer_province);
  change("Municipio empresa *", fullData.employer_city);
  change("Tipo de contrato *", fullData.contract_type);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Información financiera y producto")).toBeInTheDocument();
  change("Plazo deseado *", fullData.desired_term);
  change("Cuota inicial disponible *", fullData.down_payment);
  change("Deudas mensuales actuales *", fullData.monthly_debts);
  change(/Gasto mensual estimado/i, fullData.estimated_monthly_expenses);
  change("Tipo de producto *", fullData.product_type);
  change("Marca *", fullData.vehicle_make);
  change("Modelo *", fullData.vehicle_model);
  change("Año *", fullData.vehicle_year);
  change("Precio de venta *", fullData.vehicle_price);
  change("Dealer / Suplidor *", fullData.dealer_supplier);
  change("Condición *", fullData.vehicle_condition);
  await fillVehicleDeclaration();
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Garante o cofirmante")).toBeInTheDocument();
}

async function navigateToDocumentsStep() {
  await navigateToGaranteStep();
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Documentos recibidos")).toBeInTheDocument();
}

describe("WizardContainer", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.useRealTimers();
    user = userEvent.setup();
    push.mockReset();
    back.mockReset();
    mutateAsync.mockReset();
    mockUseCreateApplication.mockReturnValue({ mutateAsync });
    mockUseTenantConfig.mockReturnValue({ tenantConfig: getDefaultTenantBankingConfig("wizard-test-tenant"), loading: false });
  });

  test("wizard renders new full credit application sections", async () => {
    render(<WizardContainer />);
    expect(screen.getByText("Datos del solicitante")).toBeInTheDocument();
    await fillApplicantAndContinue();
    expect(screen.getByText("Información laboral")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    expect(await screen.findByText("Datos del solicitante")).toBeInTheDocument();
  });

  test("validates required applicant fields", () => {
    render(<WizardContainer />);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  test("payload contains full backend sections", () => {
    const payload = buildCreateApplicationPayload(fullData, { defaultDocumentType: "CEDULA" });

    expect(payload).toMatchObject({
      applicant: { full_name: "Ana Pérez", identification: "05300030532", document_type: "CEDULA" },
      employment: { employer_name: "Credicefi", monthly_income: "85000" },
      financial: { down_payment: "100000", has_late_payment_history: false },
      vehicle: { make: "Toyota", model: "Hilux" },
      co_debtor: { required: false },
      documents: { id_uploaded: true, invoice_uploaded: false },
      consents: {
        bureau_authorization: true,
        terms_accepted: true,
        data_processing_authorization: true,
        consent_method: "PRESENT",
        signature_full_name: "Ana Pérez",
      },
      source: "forge_dealer_portal",
      version: "full_credit_application_v1",
    });
  });

  test("co-debtor fields are conditional", () => {
    const withoutCoDebtor = buildCreateApplicationPayload({ ...fullData, co_debtor_required: "no" }, { defaultDocumentType: "CEDULA" });
    expect(withoutCoDebtor.co_debtor.required).toBe(false);

    const withCoDebtor = buildCreateApplicationPayload(
      {
        ...fullData,
        co_debtor_required: "yes",
        co_debtor_full_name: "Luis Pérez",
        co_debtor_identification: "40212398768",
        co_debtor_phone: "8095552222",
        co_debtor_monthly_income: "65000",
        co_debtor_relationship: "Hermano",
        co_debtor_employment: "Ingeniero",
        co_debtor_document_type: "CEDULA",
        co_debtor_date_of_birth: "1985-06-01",
        co_debtor_email: "luis@example.com",
        co_debtor_address: "Calle 9",
        co_debtor_province: "Distrito Nacional",
        co_debtor_city: "Santo Domingo de Guzmán",
        co_debtor_employer_name: "ACME",
        co_debtor_employment_start_date: "2018-01-01",
      },
      { defaultDocumentType: "CEDULA" }
    );
    expect(withCoDebtor.co_debtor).toMatchObject({ required: true, full_name: "Luis Pérez", monthly_income: "65000" });
  });

  test("consents are required before final review", async () => {
    const user = userEvent.setup();
    render(<WizardContainer />);
    await advanceToConsents();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    await user.click(screen.getByText(/Autorización Ley 172-13/i));
    await user.click(screen.getByText(/Autorización consulta de buró/i));
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  test(
    "submit success redirects to detail",
    async () => {
    mutateAsync.mockResolvedValue({ application_id: "app-created" });
    render(<WizardContainer />);

    await advanceToReview();
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
        applicant: expect.objectContaining({ full_name: "Ana Pérez" }),
        source: "forge_dealer_portal",
        version: "full_credit_application_v1",
      }))
    );

    await waitFor(
      () => {
        expect(push).toHaveBeenCalledWith("/credit-hub/dealer/applications/app-created");
      },
      { timeout: 4000 }
    );
  },
  30_000);

  test("submit error shows backend message", async () => {
    mutateAsync.mockRejectedValue(new Error("Backend validation failed"));
    render(<WizardContainer />);
    await advanceToReview();
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Backend validation failed");
  });

  it("does not render the legacy manual age input", () => {
    render(<WizardContainer />);
    const birthDateInput = screen.getByLabelText(/fecha de nacimiento/i);
    fireEvent.change(birthDateInput, { target: { value: "1990-05-10" } });
    expect(screen.getByTestId("calculated-age")).toHaveTextContent(/años/i);
  });

  it("calculates age automatically from birth date", async () => {
    render(<WizardContainer />);
    const birthDateInput = screen.getByLabelText(/fecha de nacimiento/i);
    fireEvent.change(birthDateInput, { target: { value: "1990-05-15" } });
    expect(screen.getByTestId("calculated-age")).toHaveTextContent(/años/i);
  });

  it("blocks continuation if applicant is under 18", async () => {
    render(<WizardContainer />);
    const recentDate = new Date();
    recentDate.setFullYear(recentDate.getFullYear() - 17);
    const iso = `${recentDate.getFullYear()}-${String(recentDate.getMonth() + 1).padStart(2, "0")}-${String(recentDate.getDate()).padStart(2, "0")}`;
    await user.clear(screen.getByLabelText(/Fecha de nacimiento/i));
    await user.type(screen.getByLabelText(/Fecha de nacimiento/i), iso);
    expect(screen.getByText(/Edad mínima requerida/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Siguiente/i })).toBeDisabled();
  });

  it("auto-formats Dominican cedula with mask", async () => {
    render(<WizardContainer />);
    const docTypeSelect = screen.getByLabelText(/Tipo de documento/i);
    await user.selectOptions(docTypeSelect, "CEDULA");
    const docInput = screen.getByLabelText(/Número de documento/i);
    await user.clear(docInput);
    await user.type(docInput, "05300030532");
    expect(docInput).toHaveValue("053-0003053-2");
  });

  it("rejects invalid Dominican cedula by Luhn check", async () => {
    render(<WizardContainer />);
    const docInput = screen.getByLabelText(/Número de documento/i);
    await user.clear(docInput);
    await user.type(docInput, "001-1234567-8");
    expect(await screen.findByText(/Cédula inválida/i)).toBeInTheDocument();
  });

  it("does not show garante form when co_debtor_required is no", async () => {
    render(<WizardContainer />);
    await navigateToGaranteStep();
    expect(screen.queryByTestId("garante-section")).not.toBeInTheDocument();
  });

  it("shows garante form when co_debtor_required is yes", async () => {
    render(<WizardContainer />);
    await navigateToGaranteStep();
    await user.selectOptions(screen.getByLabelText(/¿La solicitud incluye garante o cofirmante/i), "yes");
    expect(await screen.findByTestId("garante-section")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo garante/i)).toBeInTheDocument();
  });

  it("validates guarantor cedula different from applicant", async () => {
    render(<WizardContainer />);
    await navigateToGaranteStep();
    await user.selectOptions(screen.getByLabelText(/¿La solicitud incluye garante o cofirmante/i), "yes");
    await screen.findByTestId("garante-section");
    const guarantorDoc = screen.getByLabelText(/Número de documento garante/i);
    fireEvent.change(guarantorDoc, { target: { value: "053-0003053-2" } });
    expect(await screen.findByText(/El garante no puede ser el mismo solicitante/i)).toBeInTheDocument();
  });

  it("calculates guarantor age from birth date", async () => {
    render(<WizardContainer />);
    await navigateToGaranteStep();
    await user.selectOptions(screen.getByLabelText(/¿La solicitud incluye garante o cofirmante/i), "yes");
    await screen.findByTestId("garante-section");
    const birth = screen.getByLabelText(/Fecha de nacimiento garante/i);
    fireEvent.change(birth, { target: { value: "1985-06-20" } });
    expect(await screen.findByTestId("co-debtor-calculated-age")).toHaveTextContent(/años/i);
  });

  it("auto-enables guarantor when tenant garante_required is true", async () => {
    const base = getDefaultTenantBankingConfig("t");
    mockUseTenantConfig.mockReturnValue({
      tenantConfig: { ...base, features_enabled: { ...base.features_enabled, garante_required: true } },
      loading: false,
    });
    render(<WizardContainer />);
    await navigateToGaranteStep();
    expect(screen.queryByLabelText(/¿La solicitud incluye garante o cofirmante/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("garante-section")).toBeInTheDocument();
    expect(screen.getByText(/Esta institución requiere garante/i)).toBeInTheDocument();
  });

  it("renders documents checklist from tenant required_documents", async () => {
    render(<WizardContainer />);
    await navigateToDocumentsStep();
    expect(screen.getByTestId("documents-checklist")).toBeInTheDocument();
    expect(screen.getByLabelText(/Cédula \(frente\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Carta de empleo \/ constancia laboral/i)).toBeInTheDocument();
  });

  it("does not render Factura checkbox on documents step", async () => {
    render(<WizardContainer />);
    await navigateToDocumentsStep();
    expect(screen.queryByLabelText(/^Factura/i)).not.toBeInTheDocument();
  });

  it("blocks continuation when required documents are missing", async () => {
    render(<WizardContainer />);
    await navigateToDocumentsStep();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("enables continuation when required documents are checked", async () => {
    render(<WizardContainer />);
    await navigateToDocumentsStep();
    await completeRequiredDocuments();
    expect(screen.getByRole("button", { name: "Siguiente" })).not.toBeDisabled();
  });

  it("allows adding additional documents row", async () => {
    render(<WizardContainer />);
    await navigateToDocumentsStep();
    fireEvent.click(screen.getByRole("button", { name: /Agregar documento adicional/i }));
    expect(screen.getByLabelText(/Nombre del documento/i)).toBeInTheDocument();
  });

  it("shows received counter on documents step", async () => {
    render(<WizardContainer />);
    await navigateToDocumentsStep();
    expect(screen.getByText(/\d+ de \d+ documentos recibidos/)).toBeInTheDocument();
  });
});
