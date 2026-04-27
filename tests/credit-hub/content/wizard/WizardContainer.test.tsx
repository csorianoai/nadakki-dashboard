import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WizardContainer, buildCreateApplicationPayload, type ApplicationFormData } from "@/components/credit-hub/dealer/wizard/WizardContainer";
import { useCreateCreditApplication } from "@/lib/credit-hub/hooks/useCreateCreditApplication";

const push = jest.fn();
const back = jest.fn();
const mutateAsync = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreateCreditApplication", () => ({
  useCreateCreditApplication: jest.fn(),
}));

const mockUseCreateApplication = useCreateCreditApplication as jest.Mock;

const fullData: ApplicationFormData = {
  applicant_full_name: "Ana Pérez",
  applicant_identification: "001-0000000-1",
  applicant_date_of_birth: "1990-01-01",
  applicant_age: "35",
  applicant_marital_status: "single",
  applicant_email: "ana@example.com",
  applicant_phone: "8095550000",
  applicant_address: "Calle 1",
  applicant_city: "Santo Domingo",
  applicant_province: "Distrito Nacional",
  applicant_country: "República Dominicana",
  employment_type: "employee",
  employer_name: "Credicefi",
  employment_position: "Analista",
  time_in_job: "3 años",
  monthly_income: "85000",
  other_income: "5000",
  payment_frequency: "monthly",
  work_phone: "8095551111",
  requested_amount: "500000",
  desired_term: "48 meses",
  down_payment: "100000",
  monthly_debts: "15000",
  estimated_monthly_expenses: "30000",
  primary_bank: "Banco Popular",
  has_bank_account: "yes",
  has_late_payment_history: "no",
  max_late_payment_days: "",
  product_type: "vehicle",
  vehicle_make: "Toyota",
  vehicle_model: "Hilux",
  vehicle_year: "2024",
  vehicle_price: "1600000",
  dealer_supplier: "Dealer Norte",
  vehicle_condition: "new",
  co_debtor_required: "no",
  co_debtor_full_name: "",
  co_debtor_identification: "",
  co_debtor_phone: "",
  co_debtor_monthly_income: "",
  co_debtor_relationship: "",
  co_debtor_employment: "",
  document_id_uploaded: true,
  document_income_proof_uploaded: true,
  document_bank_statement_uploaded: true,
  document_bureau_authorization_uploaded: true,
  document_invoice_uploaded: true,
  consent_bureau_authorization: true,
  consent_terms_accepted: true,
  consent_data_processing_authorization: true,
};

function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function fillApplicantAndContinue() {
  change("Nombre completo *", fullData.applicant_full_name);
  change("Cédula / Identificación *", fullData.applicant_identification);
  change("Fecha de nacimiento *", fullData.applicant_date_of_birth);
  change("Edad *", fullData.applicant_age);
  change("Estado civil *", fullData.applicant_marital_status);
  change("Teléfono *", fullData.applicant_phone);
  change("Email *", fullData.applicant_email);
  change("País *", fullData.applicant_country);
  change("Dirección *", fullData.applicant_address);
  change("Ciudad *", fullData.applicant_city);
  change("Provincia *", fullData.applicant_province);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Información laboral")).toBeInTheDocument();
}

async function advanceToConsents() {
  await fillApplicantAndContinue();
  change("Tipo de empleo *", fullData.employment_type);
  change("Empresa donde trabaja *", fullData.employer_name);
  change("Cargo *", fullData.employment_position);
  change("Tiempo en empleo *", fullData.time_in_job);
  change("Ingreso mensual *", fullData.monthly_income);
  change("Frecuencia de pago *", fullData.payment_frequency);
  change("Teléfono laboral *", fullData.work_phone);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Información financiera")).toBeInTheDocument();

  change("Monto solicitado *", fullData.requested_amount);
  change("Plazo deseado *", fullData.desired_term);
  change("Cuota inicial *", fullData.down_payment);
  change("Deudas mensuales *", fullData.monthly_debts);
  change("Gasto mensual estimado *", fullData.estimated_monthly_expenses);
  change("Banco principal *", fullData.primary_bank);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Vehículo / producto financiado")).toBeInTheDocument();

  change("Tipo de producto *", fullData.product_type);
  change("Marca *", fullData.vehicle_make);
  change("Modelo *", fullData.vehicle_model);
  change("Año *", fullData.vehicle_year);
  change("Precio *", fullData.vehicle_price);
  change("Dealer / Suplidor *", fullData.dealer_supplier);
  change("Condición *", fullData.vehicle_condition);
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Co-deudor / garante")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Documentos requeridos")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByRole("heading", { name: "Consentimientos" })).toBeInTheDocument();
}

async function advanceToReview() {
  await advanceToConsents();
  fireEvent.click(screen.getByLabelText("Autorizo la consulta de buró de crédito *"));
  fireEvent.click(screen.getByLabelText("Acepto los términos y condiciones *"));
  fireEvent.click(screen.getByLabelText("Autorizo el tratamiento de datos personales *"));
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  expect(await screen.findByText("Revisión final")).toBeInTheDocument();
}

describe("WizardContainer", () => {
  beforeEach(() => {
    jest.useRealTimers();
    push.mockReset();
    back.mockReset();
    mutateAsync.mockReset();
    mockUseCreateApplication.mockReturnValue({ mutateAsync });
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
    const payload = buildCreateApplicationPayload(fullData);

    expect(payload).toMatchObject({
      applicant: { full_name: "Ana Pérez", identification: "001-0000000-1" },
      employment: { employer_name: "Credicefi", monthly_income: "85000" },
      financial: { requested_amount: "500000", has_late_payment_history: false },
      vehicle: { make: "Toyota", model: "Hilux" },
      co_debtor: { required: false },
      documents: { id_uploaded: true },
      consents: { bureau_authorization: true, terms_accepted: true, data_processing_authorization: true },
      source: "forge_dealer_portal",
      version: "full_credit_application_v1",
    });
  });

  test("co-debtor fields are conditional", () => {
    const withoutCoDebtor = buildCreateApplicationPayload({ ...fullData, co_debtor_required: "no" });
    expect(withoutCoDebtor.co_debtor.required).toBe(false);

    const withCoDebtor = buildCreateApplicationPayload({
      ...fullData,
      co_debtor_required: "yes",
      co_debtor_full_name: "Luis Pérez",
      co_debtor_identification: "001-1111111-1",
      co_debtor_phone: "8095552222",
      co_debtor_monthly_income: "65000",
      co_debtor_relationship: "Hermano",
      co_debtor_employment: "Ingeniero",
    });
    expect(withCoDebtor.co_debtor).toMatchObject({ required: true, full_name: "Luis Pérez", monthly_income: "65000" });
  });

  test("consents are required before final review", async () => {
    render(<WizardContainer />);
    await advanceToConsents();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Autorizo la consulta de buró de crédito *"));
    fireEvent.click(screen.getByLabelText("Acepto los términos y condiciones *"));
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  test("submit success redirects to detail", async () => {
    jest.useFakeTimers();
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

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(push).toHaveBeenCalledWith("/credit-hub/dealer/applications/app-created");
    jest.useRealTimers();
  });

  test("submit error shows backend message", async () => {
    mutateAsync.mockRejectedValue(new Error("Backend validation failed"));
    render(<WizardContainer />);
    await advanceToReview();
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Backend validation failed");
  });
});
